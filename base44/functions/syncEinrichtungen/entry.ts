import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    // API-Key Auth
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== Deno.env.get('NextHuntmobile')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { tenant_id, revier_id, updated_since } = body;

    if (!tenant_id) {
      return Response.json({ error: 'tenant_id required' }, { status: 400 });
    }

    const filter = { tenant_id };
    if (revier_id) filter.revier_id = revier_id;

    let einrichtungen = await base44.asServiceRole.entities.Jagdeinrichtung.filter(filter);

    if (updated_since) {
      const since = new Date(updated_since);
      einrichtungen = einrichtungen.filter(e => new Date(e.updated_date) > since);
    }

    return Response.json({
      success: true,
      count: einrichtungen.length,
      data: einrichtungen,
      sync_timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});