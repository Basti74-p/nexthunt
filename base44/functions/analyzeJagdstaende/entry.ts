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
      return Response.json({ analyzeResults: [] });
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

    // KI-Analyse mit Wetterdaten aufrufen
    const analysisPrompt = `
Du bist ein erfahrener Jagdberater. Analysiere folgende Jagdstände für heute und bewerte ihre Eignung.

REVIER-INFORMATIONEN:
Jagdstände: ${JSON.stringify(einrichtungenForAnalysis, null, 2)}

WILDAKTIVITÄT (letzte 30 Tage):
${Object.entries(wildActivity).map(([wild, count]) => `- ${wild}: ${count} Sichtungen/Strecken`).join('\n')}

Basierend auf:
1. Der aktuellen Windrichtung heute (bitte recherchieren für die Region Deutschland)
2. Der historischen Wildaktivität
3. Den Standorttypen und Ausrichtungen

Gib für JEDEN Stand folgende Bewertung ab:
- Suitability: "green" (sehr geeignet), "yellow" (bedingt geeignet), oder "red" (ungeeignet)
- Reason: Kurze Begründung (max 2 Sätze)

Antworte NUR als JSON Array (kein zusätzlicher Text):
[
  {
    "einrichtung_id": "...",
    "suitability": "green|yellow|red",
    "reason": "..."
  }
]
`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      add_context_from_internet: true,
      response_json_schema: {
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
    });

    return Response.json({
      analyzeResults: aiResponse || [],
      einrichtungenCount: einrichtungen.length,
      wildActivitySummary: wildActivity,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});