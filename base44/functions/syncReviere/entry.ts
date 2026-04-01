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
    const { tenant_id, updated_since } = body;

    if (!tenant_id) {
      return Response.json({ error: 'tenant_id required' }, { status: 400 });
    }

    let reviere = await base44.asServiceRole.entities.Revier.filter({ tenant_id, status: 'active' });

    if (updated_since) {
      const since = new Date(updated_since);
      reviere = reviere.filter(r => new Date(r.updated_date) > since);
    }

    return Response.json({
      success: true,
      count: reviere.length,
      data: reviere,
      sync_timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});