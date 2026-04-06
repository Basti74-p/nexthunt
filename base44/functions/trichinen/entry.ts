import { createClient } from 'npm:@base44/sdk@0.8.23';

const base44 = createClient({
  appId: Deno.env.get('BASE44_APP_ID'),
  apiKey: Deno.env.get('NEXTHUNT_API_KEY'),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== Deno.env.get("NEXTHUNT_API_KEY")) return json({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const { action, tenant_id, revier_id, id, updated_since, ...rest } = body;

  if (!tenant_id) return json({ error: "tenant_id required" }, 400);

  try {
    // LISTING
    if (!action) {
      const filter = { tenant_id };
      if (revier_id) filter.revier_id = revier_id;
      let data = await base44.entities.Trichinenprotokoll.filter(filter);
      if (updated_since) data = data.filter(i => new Date(i.updated_date) > new Date(updated_since));
      return json(data);
    }

    // CREATE
    if (action === "create") {
      if (!body.datum_erlegung) return json({ error: "datum_erlegung required" }, 400);
      const created = await base44.entities.Trichinenprotokoll.create({
        tenant_id,
        revier_id: revier_id || "",
        wildart: "Wildschwein",
        ergebnis: "ausstehend",
        ...rest,
      });
      return json(created, 201);
    }

    // UPDATE — mit optionalem Delta-Sync für verknüpfte Wildkammer/Strecke
    if (action === "update") {
      if (!id) return json({ error: "id required" }, 400);

      const updated = await base44.entities.Trichinenprotokoll.update(id, rest);

      // Delta-Sync: Wenn Ergebnis eingetragen → verknüpfte Entitäten aktualisieren
      const ergebnis = rest.ergebnis;
      if (ergebnis === "negativ" || ergebnis === "positiv") {
        const protokoll = await base44.entities.Trichinenprotokoll.get(id);
        const datum = rest.ergebnis_datum || new Date().toISOString().slice(0, 10);

        // Wildkammer-Sync
        if (protokoll?.wildkammer_id) {
          await base44.entities.Wildkammer.update(protokoll.wildkammer_id, {
            trichinenprobe: true,
            trichinenprobe_datum: datum,
            trichinenprobe_ergebnis: ergebnis,
            freigabe: ergebnis === "negativ",
            freigabe_datum: ergebnis === "negativ" ? datum : undefined,
            status: ergebnis === "negativ" ? "lager" : undefined,
          });
        }

        // Strecke-Sync
        if (protokoll?.strecke_id) {
          await base44.entities.Strecke.update(protokoll.strecke_id, {
            notes: ergebnis === "negativ" ? "Trichinenprobe negativ ✓" : "Trichinenprobe POSITIV ⚠",
            status: ergebnis === "negativ" ? "bestaetigt" : "erfasst",
          });
        }
      }

      return json(updated);
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
});