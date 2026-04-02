import * as djwt from 'https://deno.land/x/djwt@v2.9.1/mod.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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
  const payload = await verifyToken(req);
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    if (body.action === 'create') {
      const { name } = body;
      if (!name) return Response.json({ error: 'name erforderlich' }, { status: 400 });
      const { action, ...rest } = body;
      const data = await base44.asServiceRole.entities.Revier.create({ ...rest, tenant_id: payload.tenant_id, status: rest.status || 'active' });
      return Response.json({ data, sync_timestamp: new Date().toISOString() }, { status: 201 });
    }

    if (body.action === 'update') {
      const { revier_id, ...updateFields } = body;
      if (!revier_id) return Response.json({ error: 'revier_id erforderlich' }, { status: 400 });
      delete updateFields.action;
      const data = await base44.asServiceRole.entities.Revier.update(revier_id, updateFields);
      return Response.json({ data, sync_timestamp: new Date().toISOString() });
    }

    if (body.action === 'update_boundary') {
      const { revier_id, boundary_geojson } = body;
      if (!revier_id || !boundary_geojson) {
        return Response.json({ error: 'revier_id und boundary_geojson erforderlich' }, { status: 400 });
      }
      const data = await base44.asServiceRole.entities.Revier.update(revier_id, { boundary_geojson });
      return Response.json({ data, sync_timestamp: new Date().toISOString() });
    }

    if (body.action === 'delete') {
      const { revier_id } = body;
      if (!revier_id) return Response.json({ error: 'revier_id erforderlich' }, { status: 400 });
      await base44.asServiceRole.entities.Revier.delete(revier_id);
      return Response.json({ success: true, sync_timestamp: new Date().toISOString() });
    }

    const data = await base44.asServiceRole.entities.Revier.filter({ tenant_id: payload.tenant_id });
    return Response.json({ data, sync_timestamp: new Date().toISOString() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});