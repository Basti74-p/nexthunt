import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const tenant_id = user.tenant_id || body.tenant_id;
    const action = body.action;

    if (action === 'create' || req.method === 'POST' && !action) {
      const { sighting_date, sighting_type } = body;
      if (!sighting_date || !sighting_type) {
        return Response.json({ error: 'Pflichtfelder fehlen: sighting_date, sighting_type' }, { status: 400 });
      }
      const created = await base44.entities.WolfSighting.create({ ...body, tenant_id });
      return Response.json({ data: created, sync_timestamp: new Date().toISOString() });
    }

    const filter = { tenant_id };
    if (body.revier_id) filter.revier_id = body.revier_id;
    if (body.updated_since) filter.updated_date = { $gte: body.updated_since };
    const data = await base44.entities.WolfSighting.filter(filter);
    return Response.json({ data, sync_timestamp: new Date().toISOString() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});