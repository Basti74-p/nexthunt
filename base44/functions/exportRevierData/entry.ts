import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const { revier_id } = await req.json();
    if (!revier_id) return Response.json({ error: 'revier_id erforderlich' }, { status: 400, headers: corsHeaders });

    // Revier laden
    const reviereResult = await base44.asServiceRole.entities.Revier.filter({ id: revier_id });
    const revier = reviereResult[0];
    if (!revier) return Response.json({ error: 'Revier nicht gefunden' }, { status: 404, headers: corsHeaders });

    // Alle verknüpften Daten parallel laden
    const [
      einrichtungen,
      strecken,
      aufgaben,
      sichtungen,
      schwarzwild_sichtungen,
      schwarzwild_rotten,
      schwarzwild_schaeden,
      trichinen,
      asp_meldungen,
      kirrungen,
      termine,
      gesellschaftsjagden,
      abschussplaene,
    ] = await Promise.all([
      base44.asServiceRole.entities.Jagdeinrichtung.filter({ revier_id }),
      base44.asServiceRole.entities.Strecke.filter({ revier_id }),
      base44.asServiceRole.entities.Aufgabe.filter({ revier_id }),
      base44.asServiceRole.entities.WildManagement.filter({ revier_id }),
      base44.asServiceRole.entities.SchwarzwildSichtung.filter({ revier_id }),
      base44.asServiceRole.entities.SchwarzwildRotte.filter({ revier_id }),
      base44.asServiceRole.entities.SchwarzwildSchaden.filter({ revier_id }),
      base44.asServiceRole.entities.Trichinenprotokoll.filter({ revier_id }),
      base44.asServiceRole.entities.ASPMeldung.filter({ revier_id }),
      base44.asServiceRole.entities.Kirrung.filter({ revier_id }),
      base44.asServiceRole.entities.Termin.filter({ revier_id }),
      base44.asServiceRole.entities.GesellschaftsJagd.filter({ revier_id }),
      base44.asServiceRole.entities.Abschussplan.filter({ revier_id }),
    ]);

    const exportData = {
      export_version: "1.0",
      export_timestamp: new Date().toISOString(),
      export_source: "NextHunt",
      revier: {
        id: revier.id,
        name: revier.name,
        region: revier.region,
        size_ha: revier.size_ha,
        flaeche_ha: revier.flaeche_ha,
        notes: revier.notes,
        status: revier.status,
        boundary_geojson: revier.boundary_geojson || null,
        created_date: revier.created_date,
        updated_date: revier.updated_date,
      },
      einrichtungen: einrichtungen.map(e => ({
        id: e.id,
        type: e.type,
        name: e.name,
        latitude: e.latitude,
        longitude: e.longitude,
        condition: e.condition,
        orientation: e.orientation,
        notes: e.notes,
        photos: e.photos || [],
        created_date: e.created_date,
      })),
      strecken: strecken.map(s => ({
        id: s.id,
        species: s.species,
        gender: s.gender,
        age_class: s.age_class,
        date: s.date,
        weight_kg: s.weight_kg,
        latitude: s.latitude,
        longitude: s.longitude,
        status: s.status,
        notes: s.notes,
        shooter_email: s.shooter_email,
        created_date: s.created_date,
      })),
      aufgaben: aufgaben.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        status: a.status,
        priority: a.priority,
        due_date: a.due_date,
        assigned_to_name: a.assigned_to_name,
        einrichtung_name: a.einrichtung_name,
        created_date: a.created_date,
      })),
      schwarzwild_sichtungen,
      schwarzwild_rotten,
      schwarzwild_schaeden,
      trichinen,
      asp_meldungen,
      kirrungen,
      termine,
      gesellschaftsjagden,
      abschussplaene,
      sichtungen,
      summary: {
        revier_name: revier.name,
        flaeche_ha: revier.flaeche_ha || revier.size_ha,
        has_boundary: !!revier.boundary_geojson,
        einrichtungen_count: einrichtungen.length,
        strecken_count: strecken.length,
        aufgaben_count: aufgaben.length,
        schwarzwild_sichtungen_count: schwarzwild_sichtungen.length,
        schwarzwild_rotten_count: schwarzwild_rotten.length,
        trichinen_count: trichinen.length,
        kirrungen_count: kirrungen.length,
      }
    };

    return Response.json({ success: true, data: exportData }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});