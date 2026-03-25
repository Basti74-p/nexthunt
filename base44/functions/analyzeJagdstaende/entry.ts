import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { revier_id } = await req.json();
    if (!revier_id) {
      return Response.json({ error: 'Missing revier_id' }, { status: 400 });
    }

    // Einrichtungen für dieses Revier abrufen
    const einrichtungen = await base44.entities.Jagdeinrichtung.filter({ revier_id });
    if (einrichtungen.length === 0) {
      return Response.json({ analyzeResults: [], landcoverFeatures: [] });
    }

    // Historische Sichtungen/Strecken für dieses Revier (letzte 30 Tage)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [sichtungen, strecken] = await Promise.all([
      base44.entities.JagdMeldung.filter({ revier_id }),
      base44.entities.Strecke.filter({ revier_id }),
    ]);

    // Wildaktivitätssummary aus Sichtungen & Strecken
    const wildActivity = {};
    sichtungen.forEach(s => {
      if (s.wildart) {
        wildActivity[s.wildart] = (wildActivity[s.wildart] || 0) + 1;
      }
    });
    strecken.forEach(s => {
      if (s.species) {
        wildActivity[s.species] = (wildActivity[s.species] || 0) + 1;
      }
    });

    // Einrichtungen mit Standort und Typ formatieren
    const einrichtungenForAnalysis = einrichtungen.map(e => ({
      id: e.id,
      name: e.name,
      type: e.type,
      latitude: e.latitude,
      longitude: e.longitude,
      orientation: e.orientation || 'unknown',
      condition: e.condition || 'gut',
    }));

    // Berechne Reviergrenze aus Standorten für KI-Kontext
    const lats = einrichtungen.filter(e => e.latitude).map(e => e.latitude);
    const lngs = einrichtungen.filter(e => e.longitude).map(e => e.longitude);
    const revierBounds = lats.length > 0 ? {
      north: Math.max(...lats) + 0.02,
      south: Math.min(...lats) - 0.02,
      east: Math.max(...lngs) + 0.02,
      west: Math.min(...lngs) - 0.02,
    } : null;

    // KI-Analyse mit Flächenerkennung
    const analysisPrompt = `
Du bist ein erfahrener Jagdberater und Kartenanalyst. Analysiere die Jagdstände UND erkenne Waldfiächen im Revier.

REVIER-INFORMATIONEN:
Jagdstände: ${JSON.stringify(einrichtungenForAnalysis, null, 2)}

${revierBounds ? `REVIER-GRENZEN (ungefähr):
- Nord: ${revierBounds.north}
- Süd: ${revierBounds.south}
- Ost: ${revierBounds.east}
- West: ${revierBounds.west}` : ''}

WILDAKTIVITÄT (letzte 30 Tage):
${Object.entries(wildActivity).map(([wild, count]) => `- ${wild}: ${count} Sichtungen/Strecken`).join('\n')}

AUFGABEN:
1. Bewerte jeden Stand basierend auf aktueller Windrichtung (recherchieren für Deutschland heute), Wildaktivität und Standorttyp.
2. Erkenne Waldfiächen und Wiesenflächen im Revier anhand von Satellitenbildern und gib sie als GeoJSON-Polygone zurück.
   - Waldfiächen (forest): dicht bewaldete Gebiete (grün markieren)
   - Wiesenflächen (meadow): offene Acker- und Grünlandflächen (gelb markieren)

Antworte NUR als JSON (kein zusätzlicher Text):
{
  "results": [
    {
      "einrichtung_id": "...",
      "suitability": "green|yellow|red",
      "reason": "..."
    }
  ],
  "landcover": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], [lng, lat], ...]]
      },
      "properties": {
        "category": "forest|meadow"
      }
    }
  ]
}`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      add_context_from_internet: true,
      model: 'gemini_3_pro',
      response_json_schema: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                einrichtung_id: { type: 'string' },
                suitability: { type: 'string', enum: ['green', 'yellow', 'red'] },
                reason: { type: 'string' },
              },
              required: ['einrichtung_id', 'suitability', 'reason'],
            },
          },
          landcover: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                geometry: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    coordinates: { type: 'array' },
                  },
                },
                properties: {
                  type: 'object',
                  properties: {
                    category: { type: 'string', enum: ['forest', 'meadow'] },
                  },
                },
              },
            },
          },
        },
        required: ['results'],
      },
    });

    return Response.json({
      analyzeResults: aiResponse?.results || [],
      landcoverFeatures: aiResponse?.landcover || [],
      einrichtungenCount: einrichtungen.length,
      wildActivitySummary: wildActivity,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});