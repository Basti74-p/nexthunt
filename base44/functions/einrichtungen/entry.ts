import * as djwt from 'https://deno.land/x/djwt@v2.9.1/mod.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    const tenant_id = auth.tenant_id;

    if (body.action === 'create') {
      const { revier_id, type, name } = body;
      if (!revier_id || !type || !name) {
        return Response.json({ error: 'Pflichtfelder fehlen: revier_id, type, name' }, { status: 400, headers: corsHeaders });
      }
      const { action, ...rest } = body;
      const data = await base44.asServiceRole.entities.Jagdeinrichtung.create({ ...rest, tenant_id });
      return Response.json({ data, sync_timestamp: new Date().toISOString() }, { status: 201, headers: corsHeaders });
    }

    if (body.action === 'update') {
      const { id, ...updateFields } = body;
      if (!id) return Response.json({ error: 'id erforderlich' }, { status: 400, headers: corsHeaders });
      delete updateFields.action;
      const data = await base44.asServiceRole.entities.Jagdeinrichtung.update(id, updateFields);
      return Response.json({ data, sync_timestamp: new Date().toISOString() }, { headers: corsHeaders });
    }

    if (body.action === 'delete') {
      const { id } = body;
      if (!id) return Response.json({ error: 'id erforderlich' }, { status: 400, headers: corsHeaders });
      await base44.asServiceRole.entities.Jagdeinrichtung.delete(id);
      return Response.json({ success: true, sync_timestamp: new Date().toISOString() }, { headers: corsHeaders });
    }

    if (!tenant_id) return Response.json({ error: 'tenant_id erforderlich' }, { status: 400, headers: corsHeaders });
    const filter = { tenant_id };
    if (body.revier_id) filter.revier_id = body.revier_id;
    const data = await base44.asServiceRole.entities.Jagdeinrichtung.filter(filter);
    return Response.json({ data, sync_timestamp: new Date().toISOString() }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
});