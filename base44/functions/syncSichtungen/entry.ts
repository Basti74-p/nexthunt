import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Hilfsfunktion: anzahl aus nachricht extrahieren
function extractAnzahl(nachricht) {
  if (!nachricht) return null;
  const match = nachricht.match(/^Anzahl:\s*(\d+)\s*\|/);
  return match ? parseInt(match[1], 10) : null;
}

// Hilfsfunktion: nachricht mit anzahl zusammenbauen
function buildNachricht(anzahl, notizen) {
  const prefix = anzahl != null ? `Anzahl: ${anzahl} | ` : '';
  return prefix + (notizen || '');
}

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
      // GET: Liste Sichtungen (JagdMeldungen vom Typ "sichtung")
      const { tenant_id, revier_id, jagd_id, updated_since } = body;

      if (!tenant_id) {
        return Response.json({ error: 'tenant_id required' }, { status: 400 });
      }

      const filter = { tenant_id, typ: 'sichtung' };
      if (jagd_id) filter.jagd_id = jagd_id;

      let meldungen = await base44.asServiceRole.entities.JagdMeldung.filter(filter);

      // Optional: nach revier filtern über verknüpfte Jagd (wird clientseitig gefiltert wenn nötig)
      if (updated_since) {
        const since = new Date(updated_since);
        meldungen = meldungen.filter(m => new Date(m.updated_date) > since);
      }

      // Anzahl aus nachricht extrahieren und als separates Feld zurückgeben
      const data = meldungen.map(m => ({
        ...m,
        anzahl: extractAnzahl(m.nachricht),
        notizen: m.nachricht ? m.nachricht.replace(/^Anzahl:\s*\d+\s*\|\s*/, '') : null
      }));

      return Response.json({
        success: true,
        count: data.length,
        data,
        sync_timestamp: new Date().toISOString()
      });

    } else if (method === 'POST' || body.action === 'create') {
      // POST: Neue Sichtung anlegen
      const {
        tenant_id, jagd_id,
        wildart, geschlecht, altersklasse,
        latitude, longitude,
        anzahl, notizen,
        zeitstempel, teilnehmer_id, teilnehmer_name
      } = body;

      if (!tenant_id || !jagd_id || !zeitstempel) {
        return Response.json({ error: 'tenant_id, jagd_id und zeitstempel sind Pflichtfelder' }, { status: 400 });
      }

      const nachricht = buildNachricht(anzahl, notizen);

      const newMeldung = await base44.asServiceRole.entities.JagdMeldung.create({
        tenant_id,
        jagd_id,
        typ: 'sichtung',
        wildart: wildart || 'sonstiges',
        geschlecht: geschlecht || 'unbekannt',
        altersklasse: altersklasse || null,
        latitude: latitude || null,
        longitude: longitude || null,
        nachricht: nachricht || null,
        zeitstempel,
        teilnehmer_id: teilnehmer_id || null,
        teilnehmer_name: teilnehmer_name || null,
        status: 'neu'
      });

      return Response.json({
        success: true,
        data: {
          ...newMeldung,
          anzahl: extractAnzahl(newMeldung.nachricht),
          notizen: newMeldung.nachricht ? newMeldung.nachricht.replace(/^Anzahl:\s*\d+\s*\|\s*/, '') : null
        },
        sync_timestamp: new Date().toISOString()
      }, { status: 201 });

    } else {
      return Response.json({ error: 'Method not supported. Use action: "list" or "create"' }, { status: 405 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});