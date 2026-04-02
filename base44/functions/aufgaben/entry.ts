import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const tenant_id = user.tenant_id || body.tenant_id;
    const action = body.action;

    if (action === 'update_status') {
      const { id, status } = body;
      if (!id || !status) {
        return Response.json({ error: 'Pflichtfelder fehlen: id, status' }, { status: 400 });
      }
      const updated = await base44.entities.Aufgabe.update(id, { status });
      return Response.json({ data: updated, sync_timestamp: new Date().toISOString() });
    }

    const filter = { tenant_id };
    if (body.revier_id) filter.revier_id = body.revier_id;
    if (body.updated_since) filter.updated_date = { $gte: body.updated_since };
    const data = await base44.entities.Aufgabe.filter(filter);
    return Response.json({ data, sync_timestamp: new Date().toISOString() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});