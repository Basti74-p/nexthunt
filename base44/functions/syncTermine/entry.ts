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
      const { tenant_id, revier_id, updated_since, from_date, to_date } = body;

      if (!tenant_id) {
        return Response.json({ error: 'tenant_id required' }, { status: 400, headers: corsHeaders });
      }

      const filter = { tenant_id };
      if (revier_id) filter.revier_id = revier_id;

      let termine = await base44.asServiceRole.entities.Termin.filter(filter);

      if (updated_since) {
        const since = new Date(updated_since);
        termine = termine.filter(t => new Date(t.updated_date) > since);
      }

      if (from_date) termine = termine.filter(t => t.datum >= from_date);
      if (to_date) termine = termine.filter(t => t.datum <= to_date);

      return Response.json({
        success: true,
        count: termine.length,
        data: termine,
        sync_timestamp: new Date().toISOString()
      }, { headers: corsHeaders });

    } else if (method === 'POST' || body.action === 'create') {
      const {
        tenant_id, revier_id, titel, beschreibung,
        datum, uhrzeit_start, uhrzeit_ende, ort,
        erstellt_von, gast_ids
      } = body;

      if (!tenant_id || !titel || !datum) {
        return Response.json({ error: 'tenant_id, titel und datum sind Pflichtfelder' }, { status: 400, headers: corsHeaders });
      }

      const newTermin = await base44.asServiceRole.entities.Termin.create({
        tenant_id,
        revier_id: revier_id || null,
        titel,
        beschreibung: beschreibung || null,
        datum,
        uhrzeit_start: uhrzeit_start || null,
        uhrzeit_ende: uhrzeit_ende || null,
        ort: ort || null,
        erstellt_von: erstellt_von || null,
        gast_ids: gast_ids || [],
        status: 'geplant'
      });

      return Response.json({
        success: true,
        data: newTermin,
        sync_timestamp: new Date().toISOString()
      }, { status: 201, headers: corsHeaders });

    } else {
      return Response.json({ error: 'Method not supported. Use action: "list" or "create"' }, { status: 405, headers: corsHeaders });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});