import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

// Gibt Metadaten zurück: Anzahl der Datensätze pro Entität + letztes Update
// Nützlich für die Mobile-App um zu entscheiden was synchronisiert werden muss

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== Deno.env.get('NEXTHUNT_MOBILE_KEY')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { tenant_id } = body;

    if (!tenant_id) {
      return Response.json({ error: 'tenant_id required' }, { status: 400, headers: corsHeaders });
    }

    const [reviere, einrichtungen, strecken, aufgaben, termine, meldungen] = await Promise.all([
      base44.asServiceRole.entities.Revier.filter({ tenant_id, status: 'active' }),
      base44.asServiceRole.entities.Jagdeinrichtung.filter({ tenant_id }),
      base44.asServiceRole.entities.Strecke.filter({ tenant_id }),
      base44.asServiceRole.entities.Aufgabe.filter({ tenant_id }),
      base44.asServiceRole.entities.Termin.filter({ tenant_id }),
      base44.asServiceRole.entities.JagdMeldung.filter({ tenant_id, typ: 'sichtung' })
    ]);

    const lastUpdated = (arr) => {
      if (!arr.length) return null;
      return arr.reduce((max, item) => {
        const d = new Date(item.updated_date);
        return d > max ? d : max;
      }, new Date(0)).toISOString();
    };

    return Response.json({
      success: true,
      tenant_id,
      metadata: {
        reviere:       { count: reviere.length,       last_updated: lastUpdated(reviere) },
        einrichtungen: { count: einrichtungen.length, last_updated: lastUpdated(einrichtungen) },
        abschuesse:    { count: strecken.length,      last_updated: lastUpdated(strecken) },
        aufgaben:      { count: aufgaben.length,      last_updated: lastUpdated(aufgaben) },
        termine:       { count: termine.length,       last_updated: lastUpdated(termine) },
        sichtungen:    { count: meldungen.length,     last_updated: lastUpdated(meldungen) }
      },
      sync_timestamp: new Date().toISOString()
    }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});