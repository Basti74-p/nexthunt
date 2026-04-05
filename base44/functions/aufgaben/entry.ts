import * as djwt from 'https://deno.land/x/djwt@v2.9.1/mod.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

async function verifyToken(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(Deno.env.get('JWT_SECRET')),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
    );
    return await djwt.verify(token, key);
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });
  const payload = await verifyToken(req);
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    if (body.action === 'update_status') {
      const { id, status } = body;
      if (!id || !status) {
        return Response.json({ error: 'Pflichtfelder fehlen: id, status' }, { status: 400, headers: corsHeaders });
      }
      const data = await base44.asServiceRole.entities.Aufgabe.update(id, { status });
      return Response.json({ data, sync_timestamp: new Date().toISOString() }, { headers: corsHeaders });
    }

    const filter = { tenant_id: payload.tenant_id };
    if (body.revier_id) filter.revier_id = body.revier_id;
    const data = await base44.asServiceRole.entities.Aufgabe.filter(filter);
    return Response.json({ data, sync_timestamp: new Date().toISOString() }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
});