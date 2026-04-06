import * as djwt from 'https://deno.land/x/djwt@v2.9.1/mod.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

async function authenticate(req, body) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const key = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(Deno.env.get('JWT_SECRET')),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
      );
      const payload = await djwt.verify(authHeader.slice(7), key);
      return { ok: true, tenant_id: payload.tenant_id };
    } catch { /* fall through */ }
  }
  const apiKey = req.headers.get('x-api-key');
  if (apiKey && (apiKey === Deno.env.get('NEXTHUNT_MOBILE_KEY') || apiKey === Deno.env.get('NEXTHUNT_API_KEY'))) {
    return { ok: true, tenant_id: body.tenant_id || null };
  }
  return { ok: false };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const auth = await authenticate(req, body);
    if (!auth.ok) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const { action, id, updated_since, tenant_id: bodyTenantId, revier_id, ...rest } = body;
    const tenant_id = auth.tenant_id || bodyTenantId;

    // LISTING
    if (!action) {
      if (!tenant_id) return Response.json({ error: 'tenant_id required' }, { status: 400, headers: corsHeaders });
      const filter = { tenant_id };
      if (revier_id) filter.revier_id = revier_id;
      let data = await base44.asServiceRole.entities.Trichinenprotokoll.filter(filter);
      if (updated_since) data = data.filter(i => new Date(i.updated_date) > new Date(updated_since));
      return Response.json({ data, sync_timestamp: new Date().toISOString() }, { headers: corsHeaders });
    }

    // CREATE
    if (action === 'create') {
      if (!rest.datum_erlegung) return Response.json({ error: 'datum_erlegung required' }, { status: 400, headers: corsHeaders });
      const data = await base44.asServiceRole.entities.Trichinenprotokoll.create({
        wildart: 'Wildschwein', ergebnis: 'ausstehend', ...rest, tenant_id, revier_id: revier_id || '',
      });
      return Response.json({ data, sync_timestamp: new Date().toISOString() }, { status: 201, headers: corsHeaders });
    }

    // UPDATE — mit Delta-Sync für verknüpfte Wildkammer/Strecke
    if (action === 'update') {
      if (!id) return Response.json({ error: 'id required' }, { status: 400, headers: corsHeaders });
      const data = await base44.asServiceRole.entities.Trichinenprotokoll.update(id, rest);

      const ergebnis = rest.ergebnis;
      if (ergebnis === 'negativ' || ergebnis === 'positiv') {
        const protokoll = await base44.asServiceRole.entities.Trichinenprotokoll.get(id);
        const datum = rest.ergebnis_datum || new Date().toISOString().slice(0, 10);
        if (protokoll?.wildkammer_id) {
          await base44.asServiceRole.entities.Wildkammer.update(protokoll.wildkammer_id, {
            trichinenprobe: true,
            trichinenprobe_datum: datum,
            trichinenprobe_ergebnis: ergebnis,
            freigabe: ergebnis === 'negativ',
            freigabe_datum: ergebnis === 'negativ' ? datum : undefined,
            status: ergebnis === 'negativ' ? 'lager' : undefined,
          });
        }
        if (protokoll?.strecke_id) {
          await base44.asServiceRole.entities.Strecke.update(protokoll.strecke_id, {
            notes: ergebnis === 'negativ' ? 'Trichinenprobe negativ ✓' : 'Trichinenprobe POSITIV ⚠',
            status: ergebnis === 'negativ' ? 'bestaetigt' : 'erfasst',
          });
        }
      }

      return Response.json({ data, sync_timestamp: new Date().toISOString() }, { headers: corsHeaders });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400, headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
});