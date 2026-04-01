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
    const method = req.method;

    if (method === 'GET' || body.action === 'list') {
      const { tenant_id, revier_id, updated_since } = body;

      if (!tenant_id) {
        return Response.json({ error: 'tenant_id required' }, { status: 400, headers: corsHeaders });
      }

      const filter = { tenant_id };
      if (revier_id) filter.revier_id = revier_id;

      let aufgaben = await base44.asServiceRole.entities.Aufgabe.filter(filter);

      if (updated_since) {
        const since = new Date(updated_since);
        aufgaben = aufgaben.filter(a => new Date(a.updated_date) > since);
      }

      return Response.json({
        success: true,
        count: aufgaben.length,
        data: aufgaben,
        sync_timestamp: new Date().toISOString()
      }, { headers: corsHeaders });

    } else if (method === 'POST' || body.action === 'update_status') {
      const { id, status, tenant_id } = body;

      if (!id || !status || !tenant_id) {
        return Response.json({ error: 'id, status und tenant_id erforderlich' }, { status: 400, headers: corsHeaders });
      }

      const validStatuses = ['offen', 'in_bearbeitung', 'erledigt'];
      if (!validStatuses.includes(status)) {
        return Response.json({ error: `Ungültiger Status. Erlaubt: ${validStatuses.join(', ')}` }, { status: 400, headers: corsHeaders });
      }

      const updated = await base44.asServiceRole.entities.Aufgabe.update(id, { status });

      return Response.json({
        success: true,
        data: updated,
        sync_timestamp: new Date().toISOString()
      }, { headers: corsHeaders });

    } else {
      return Response.json({ error: 'Method not supported. Use action: "list" or "update_status"' }, { status: 405, headers: corsHeaders });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});