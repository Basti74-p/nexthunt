import * as djwt from 'https://deno.land/x/djwt@v2.9.1/mod.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    if (body.action === 'create') {
      const { revier_id, type, name } = body;
      if (!revier_id || !type || !name) {
        return Response.json({ error: 'Pflichtfelder fehlen: revier_id, type, name' }, { status: 400, headers: corsHeaders });
      }
      const { action, ...rest } = body;
      const data = await base44.asServiceRole.entities.Jagdeinrichtung.create({ ...rest, tenant_id: payload.tenant_id });
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

    const filter = { tenant_id: payload.tenant_id };
    if (body.revier_id) filter.revier_id = body.revier_id;
    const data = await base44.asServiceRole.entities.Jagdeinrichtung.filter(filter);
    return Response.json({ data, sync_timestamp: new Date().toISOString() }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
});