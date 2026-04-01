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
    const { tenant_id, revier_id, updated_since } = body;

    if (!tenant_id) {
      return Response.json({ error: 'tenant_id required' }, { status: 400, headers: corsHeaders });
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
    }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});