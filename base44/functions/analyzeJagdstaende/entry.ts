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

    // Einrichtungen mit Standort und Typ formatieren (mit Index für KI-Referenz)
    const einrichtungenForAnalysis = einrichtungen.map((e, idx) => ({
      id: e.id,
      index: idx + 1,
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

    // KI-Analyse mit verbesserter Bewertungslogik
    const analysisPrompt = `
Du bist ein erfahrener Jagdberater mit 20+ Jahren Erfahrung. Analysiere die Jagdstände präzise basierend auf mehreren Faktoren.

JAGDSTÄNDE (mit Positionen und IDs für Zuordnung):
${einrichtungenForAnalysis.map((e) => {
  return `Stand ${e.index}: "${e.name}" (${e.type}) [ID: ${e.id}] - Lat: ${e.latitude}, Lng: ${e.longitude}, Ausrichtung: ${e.orientation}, Zustand: ${e.condition}`;
}).join('\n')}

${revierBounds ? `REVIER-GRENZEN:
- Nord: ${revierBounds.north}, Süd: ${revierBounds.south}, Ost: ${revierBounds.east}, West: ${revierBounds.west}` : ''}

AKTUELLE WINDRICHTUNG (für Deutschland):
${new Date().toLocaleDateString('de-DE')} - Recherchiere die aktuelle Windrichtung und -stärke für Mitteleuropa.

WILDAKTIVITÄT (letzte 30 Tage):
${Object.entries(wildActivity).map(([wild, count]) => `- ${wild}: ${count} Nachweise`).join('\n')}

BEWERTUNGSKRITERIEN:
1. WINDPOSITION: Ist der Stand GEGEN den Wind für das Wild (ideal) oder vor dem Wind (schlecht)?
2. WALDDECKUNG: Liegt der Stand in/an Waldkante (versteckt) oder im offenen Feld (sichtbar)?
3. ZUGANGSWEGE: Kann man vom Sammelplatz unbemerkt zum Stand gehen?
4. WILDAKTIVITÄT: Wurden in der Nähe des Standes Tiere gesichtet/erlegt?
5. STANDTYP: Hochsitz/Leiter sind besser als offene Stände, Erdsitze sind diskret.

ANALYSE-BEISPIELE aus erfahrener Praxis:
- Stände in/an Waldkanten mit Ausblick auf freie Flächen = GRÜN (sehr gut)
- Stände auf Feldern aber mit guter Ansteller-Position zum Anfahrtsweg = GELB (bedingt brauchbar)
- Stände in dichter Nähe zu Waldwegen/Straßen wo das Wild wahrscheinlich Lärm von dort kommt = ROT (schlecht)

AUFGABEN:
1. Bewerte JEDEN Stand (1, 2, 3... bis zur Anzahl) basierend auf obigen Kriterien mit Windrichtung, Waldposition, Zugänglichkeit.
2. Erkenne Waldfiächen und Wiesenflächen im Revier und gib sie als GeoJSON-Polygone zurück.

Antworte NUR als JSON (kein zusätzlicher Text):
{
  "results": [
    {
      "einrichtung_id": "...",
      "suitability": "green|yellow|red",
      "reason": "kurze Erklärung basierend auf Wind, Walddeckung und Zugänglichkeit"
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
      add_context_from_internet: false,
      model: 'gemini_3_flash',
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

    // Map KI-Ergebnisse: KI gibt Stand-Nummern zurück, wir mappen zu echten IDs
    const mappedResults = aiResponse?.results?.map(result => {
      // Wenn KI "Stand X" oder eine Nummer zurückgibt, zur echten ID mappen
      const numMatch = result.einrichtung_id.match(/\d+/);
      let actualId = result.einrichtung_id;
      
      if (numMatch) {
        const idx = parseInt(numMatch[0]) - 1; // Stand 1 = Index 0
        if (einrichtungen[idx]) {
          actualId = einrichtungen[idx].id;
        }
      }
      
      return {
        ...result,
        einrichtung_id: actualId
      };
    }) || [];

    return Response.json({
      analyzeResults: mappedResults,
      landcoverFeatures: aiResponse?.landcover || [],
      einrichtungenCount: einrichtungen.length,
      wildActivitySummary: wildActivity,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});