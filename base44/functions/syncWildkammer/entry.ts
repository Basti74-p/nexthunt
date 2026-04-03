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

    if (body.action === 'list') {
      const { tenant_id, revier_id, updated_since } = body;

      if (!tenant_id) {
        return Response.json({ error: 'tenant_id required' }, { status: 400, headers: corsHeaders });
      }

      const filter = { tenant_id };
      if (revier_id) filter.revier_id = revier_id;

      let items = await base44.asServiceRole.entities.Wildkammer.filter(filter);

      if (updated_since) {
        const since = new Date(updated_since);
        items = items.filter(i => new Date(i.updated_date) > since);
      }

      return Response.json({
        success: true,
        count: items.length,
        data: items,
        sync_timestamp: new Date().toISOString()
      }, { headers: corsHeaders });

    } else if (body.action === 'create') {
      const { tenant_id, revier_id, species, eingang_datum } = body;

      if (!tenant_id || !revier_id || !species || !eingang_datum) {
        return Response.json({ error: 'tenant_id, revier_id, species und eingang_datum sind Pflichtfelder' }, { status: 400, headers: corsHeaders });
      }

      const newItem = await base44.asServiceRole.entities.Wildkammer.create({
        tenant_id,
        revier_id,
        strecke_id: body.strecke_id || null,
        species,
        gender: body.gender || 'unbekannt',
        age_class: body.age_class || '',
        eingang_datum,
        eingang_zeit: body.eingang_zeit || null,
        aufbruch_ok: body.aufbruch_ok || false,
        decke_ab: body.decke_ab || false,
        kuehlraum_eingang: body.kuehlraum_eingang || null,
        kuehltemperatur: body.kuehltemperatur || null,
        gewicht_aufgebrochen: body.gewicht_aufgebrochen || null,
        gewicht_kalt: body.gewicht_kalt || null,
        trichinenprobe: body.trichinenprobe || false,
        trichinenprobe_datum: body.trichinenprobe_datum || null,
        trichinenprobe_ergebnis: body.trichinenprobe_ergebnis || 'ausstehend',
        fleischbeschau: body.fleischbeschau || false,
        freigabe: body.freigabe || false,
        freigabe_datum: body.freigabe_datum || null,
        status: body.status || 'eingang',
        ausgabe_datum: body.ausgabe_datum || null,
        ausgabe_an: body.ausgabe_an || null,
        ausgabe_typ: body.ausgabe_typ || null,
        verkaufspreis: body.verkaufspreis || null,
        notes: body.notes || null,
      });

      return Response.json({
        success: true,
        data: newItem,
        sync_timestamp: new Date().toISOString()
      }, { status: 201, headers: corsHeaders });

    } else if (body.action === 'update') {
      const { wildkammer_id } = body;

      if (!wildkammer_id) {
        return Response.json({ error: 'wildkammer_id required for update' }, { status: 400, headers: corsHeaders });
      }

      const { wildkammer_id: _, action: __, tenant_id: ___, revier_id: ____, ...updateData } = body;

      const updated = await base44.asServiceRole.entities.Wildkammer.update(wildkammer_id, updateData);

      return Response.json({
        success: true,
        data: updated,
        sync_timestamp: new Date().toISOString()
      }, { headers: corsHeaders });

    } else if (body.action === 'delete') {
      const { wildkammer_id } = body;

      if (!wildkammer_id) {
        return Response.json({ error: 'wildkammer_id required for delete' }, { status: 400, headers: corsHeaders });
      }

      await base44.asServiceRole.entities.Wildkammer.delete(wildkammer_id);

      return Response.json({
        success: true,
        sync_timestamp: new Date().toISOString()
      }, { headers: corsHeaders });

    } else {
      return Response.json({ error: 'Unknown action. Use: list, create, update, delete' }, { status: 405, headers: corsHeaders });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});