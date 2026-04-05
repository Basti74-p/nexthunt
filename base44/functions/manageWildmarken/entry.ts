import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import * as djwt from 'https://deno.land/x/djwt@v2.9.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

const ALLOWED_ACTIONS = ["get_all", "get_by_id", "create_batch", "assign_to_abschuss", "mark_nfc_written"];

async function authenticate(req) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const key = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(Deno.env.get('JWT_SECRET')),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
      );
      const payload = await djwt.verify(authHeader.slice(7), key);
      return { ok: true };
    } catch { /* fall through */ }
  }
  const apiKey = req.headers.get('x-api-key');
  if (apiKey && (apiKey === Deno.env.get('NEXTHUNT_MOBILE_KEY') || apiKey === Deno.env.get('NEXTHUNT_API_KEY'))) {
    return { ok: true };
  }
  return { ok: false };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticate(req);
    if (!auth.ok) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action, tenant_id } = body;

    if (!tenant_id) {
      return Response.json({ error: 'tenant_id ist erforderlich' }, { status: 400, headers: corsHeaders });
    }

    if (!action || !ALLOWED_ACTIONS.includes(action)) {
      return Response.json({
        error: 'Unbekannte Action',
        detail: `Action '${action}' wird nicht unterstuetzt. Erlaubt: ${ALLOWED_ACTIONS.join(', ')}`
      }, { status: 400, headers: corsHeaders });
    }

    const Wildmarke = base44.asServiceRole.entities.Wildmarke;

    // ─── get_all ─────────────────────────────────────────────────────────────
    if (action === 'get_all') {
      const wildmarken = await Wildmarke.filter({ tenant_id }, 'nummer', 500);
      return Response.json({ data: wildmarken }, { headers: corsHeaders });
    }

    // ─── get_by_id ───────────────────────────────────────────────────────────
    if (action === 'get_by_id') {
      const { wildmarke_id, nummer } = body;
      let results = [];

      if (wildmarke_id) {
        results = await Wildmarke.filter({ id: wildmarke_id, tenant_id });
      } else if (nummer) {
        results = await Wildmarke.filter({ nummer, tenant_id });
      } else {
        return Response.json({ error: 'wildmarke_id oder nummer erforderlich' }, { status: 400, headers: corsHeaders });
      }

      if (!results || results.length === 0) {
        return Response.json({ error: 'Wildmarke nicht gefunden' }, { status: 404, headers: corsHeaders });
      }
      return Response.json({ data: results[0] }, { headers: corsHeaders });
    }

    // ─── create_batch ────────────────────────────────────────────────────────
    if (action === 'create_batch') {
      const count = parseInt(body.count) || 10;
      if (![10, 20].includes(count)) {
        return Response.json({ error: 'count muss 10 oder 20 sein' }, { status: 400, headers: corsHeaders });
      }

      // Höchste vorhandene Nummer ermitteln
      const existing = await Wildmarke.filter({ tenant_id }, '-nummer', 500);
      let maxNum = 0;
      if (existing && existing.length > 0) {
        for (const wm of existing) {
          const parsed = parseInt((wm.nummer || '').replace('NH-', ''), 10);
          if (!isNaN(parsed) && parsed > maxNum) maxNum = parsed;
        }
      }

      const now = new Date().toISOString();
      const newItems = [];
      for (let i = 1; i <= count; i++) {
        const num = maxNum + i;
        const wm = await Wildmarke.create({
          tenant_id,
          nummer: 'NH-' + String(num).padStart(5, '0'),
          status: 'frei',
          nfc_written: false,
          created_date: now,
        });
        newItems.push(wm);
      }

      return Response.json({ data: newItems }, { headers: corsHeaders });
    }

    // ─── assign_to_abschuss ──────────────────────────────────────────────────
    if (action === 'assign_to_abschuss') {
      const { wildmarke_id, abschuss_id, abschuss_info } = body;
      if (!wildmarke_id || !abschuss_id) {
        return Response.json({ error: 'wildmarke_id und abschuss_id erforderlich' }, { status: 400, headers: corsHeaders });
      }

      const results = await Wildmarke.filter({ id: wildmarke_id, tenant_id });
      if (!results || results.length === 0) {
        return Response.json({ error: 'Wildmarke nicht gefunden' }, { status: 404, headers: corsHeaders });
      }
      const wm = results[0];

      if (wm.status === 'vergeben') {
        return Response.json({ error: 'Wildmarke ist bereits vergeben' }, { status: 409, headers: corsHeaders });
      }

      const updated = await Wildmarke.update(wm.id, {
        status: 'vergeben',
        abschuss_id,
        abschuss_info: abschuss_info || null,
        updated_date: new Date().toISOString(),
      });

      return Response.json({ data: updated }, { headers: corsHeaders });
    }

    // ─── mark_nfc_written ────────────────────────────────────────────────────
    if (action === 'mark_nfc_written') {
      const { wildmarke_id } = body;
      if (!wildmarke_id) {
        return Response.json({ error: 'wildmarke_id erforderlich' }, { status: 400, headers: corsHeaders });
      }

      const results = await Wildmarke.filter({ id: wildmarke_id, tenant_id });
      if (!results || results.length === 0) {
        return Response.json({ error: 'Wildmarke nicht gefunden' }, { status: 404, headers: corsHeaders });
      }

      const updated = await Wildmarke.update(results[0].id, {
        nfc_written: true,
        updated_date: new Date().toISOString(),
      });

      return Response.json({ data: updated }, { headers: corsHeaders });
    }

  } catch (error) {
    return Response.json({
      error: 'Interner Serverfehler',
      detail: error.message
    }, { status: 500, headers: corsHeaders });
  }
});