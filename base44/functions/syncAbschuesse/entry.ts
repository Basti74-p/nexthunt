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
    const method = req.method;

    if (method === 'GET' || body.action === 'list') {
      // GET: Liste Abschüsse
      const { tenant_id, revier_id, updated_since } = body;

      if (!tenant_id) {
        return Response.json({ error: 'tenant_id required' }, { status: 400 });
      }

      const filter = { tenant_id };
      if (revier_id) filter.revier_id = revier_id;

      let strecken = await base44.asServiceRole.entities.Strecke.filter(filter);

      if (updated_since) {
        const since = new Date(updated_since);
        strecken = strecken.filter(s => new Date(s.updated_date) > since);
      }

      // Rückgabe ohne einrichtung_id — GPS-Koordinaten sind direkt im Datensatz
      return Response.json({
        success: true,
        count: strecken.length,
        data: strecken,
        sync_timestamp: new Date().toISOString()
      });

    } else if (method === 'POST' || body.action === 'create') {
      // POST: Neuen Abschuss anlegen
      const {
        tenant_id, revier_id, species, gender, age_class,
        date, shooter_email, shooter_person_id,
        latitude, longitude,
        wildmark_id, weight_kg, notes
      } = body;

      if (!tenant_id || !revier_id || !species || !date) {
        return Response.json({ error: 'tenant_id, revier_id, species und date sind Pflichtfelder' }, { status: 400 });
      }

      const newStrecke = await base44.asServiceRole.entities.Strecke.create({
        tenant_id,
        revier_id,
        species,
        gender: gender || 'unbekannt',
        age_class: age_class || '',
        date,
        shooter_email: shooter_email || null,
        shooter_person_id: shooter_person_id || null,
        latitude: latitude || null,
        longitude: longitude || null,
        wildmark_id: wildmark_id || null,
        weight_kg: weight_kg || null,
        notes: notes || null,
        status: 'erfasst'
      });

      return Response.json({
        success: true,
        data: newStrecke,
        sync_timestamp: new Date().toISOString()
      }, { status: 201 });

    } else {
      return Response.json({ error: 'Method not supported. Use action: "list" or "create"' }, { status: 405 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});