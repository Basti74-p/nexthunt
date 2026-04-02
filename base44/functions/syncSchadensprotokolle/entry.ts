import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== Deno.env.get('NextHuntmobile')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // CREATE
    if (body.action === 'create') {
      const { tenant_id, revier_id, einrichtung_id, datum, titel, protokoll_typ } = body;
      if (!tenant_id || !revier_id || !einrichtung_id || !datum || !titel || !protokoll_typ) {
        return Response.json(
          { error: 'Pflichtfelder fehlen: tenant_id, revier_id, einrichtung_id, datum, titel, protokoll_typ' },
          { status: 400, headers: corsHeaders }
        );
      }
      const { action, ...rest } = body;
      const data = await base44.asServiceRole.entities.Schadensprotokoll.create(rest);
      return Response.json({ success: true, data, sync_timestamp: new Date().toISOString() }, { status: 201, headers: corsHeaders });
    }

    // UPDATE
    if (body.action === 'update') {
      const { id, ...updateFields } = body;
      if (!id) return Response.json({ error: 'id erforderlich' }, { status: 400, headers: corsHeaders });
      delete updateFields.action;
      const data = await base44.asServiceRole.entities.Schadensprotokoll.update(id, updateFields);
      return Response.json({ success: true, data, sync_timestamp: new Date().toISOString() }, { headers: corsHeaders });
    }

    // DELETE
    if (body.action === 'delete') {
      const { id } = body;
      if (!id) return Response.json({ error: 'id erforderlich' }, { status: 400, headers: corsHeaders });
      await base44.asServiceRole.entities.Schadensprotokoll.delete(id);
      return Response.json({ success: true, sync_timestamp: new Date().toISOString() }, { headers: corsHeaders });
    }

    // LIST (default)
    const { tenant_id, revier_id, einrichtung_id, updated_since } = body;
    if (!tenant_id) {
      return Response.json({ error: 'tenant_id required' }, { status: 400, headers: corsHeaders });
    }

    const filter = { tenant_id };
    if (revier_id) filter.revier_id = revier_id;
    if (einrichtung_id) filter.einrichtung_id = einrichtung_id;

    let protokolle = await base44.asServiceRole.entities.Schadensprotokoll.filter(filter);

    if (updated_since) {
      const since = new Date(updated_since);
      protokolle = protokolle.filter(p => new Date(p.updated_date) > since);
    }

    return Response.json({
      success: true,
      count: protokolle.length,
      data: protokolle,
      sync_timestamp: new Date().toISOString()
    }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});