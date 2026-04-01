import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, api_key, Authorization",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(msg, status = 400) {
  return json({ error: msg }, status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // --- API Key Auth ---
  const apiKey = req.headers.get("x-api-key") || req.headers.get("api_key");
  const expectedKey = Deno.env.get("NEXTHUNT_API_KEY");
  if (!expectedKey) return err("Server misconfiguration: NEXTHUNT_API_KEY not set", 500);
  if (!apiKey || apiKey !== expectedKey) return err("Unauthorized", 401);

  // --- Parse route from ?path=... ---
  const url = new URL(req.url);
  // path param: e.g. /reviere, /reviere/123, /einrichtungen, etc.
  const pathParam = url.searchParams.get("path") || "";
  const segments = pathParam.replace(/^\/+/, "").split("/").filter(Boolean);
  const resource = segments[0] || "";
  const id = segments[1] || null;

  const base44 = createClientFromRequest(req);

  // Body parsing for POST/PUT
  let body = {};
  if (req.method === "POST" || req.method === "PUT") {
    try { body = await req.json(); } catch { body = {}; }
  }

  // tenant_id filter helper from query params
  const tenantId = url.searchParams.get("tenant_id");
  const revier_id = url.searchParams.get("revier_id");
  const updatedSince = url.searchParams.get("updated_since");

  function buildFilter(extra = {}) {
    const f = {};
    if (tenantId) f.tenant_id = tenantId;
    if (revier_id) f.revier_id = revier_id;
    return { ...f, ...extra };
  }

  try {
    // =====================
    // REVIERE
    // =====================
    if (resource === "reviere") {
      if (req.method === "GET") {
        if (id) {
          const item = await base44.asServiceRole.entities.Revier.get(id);
          return item ? json(item) : err("Not found", 404);
        }
        const filter = {};
        if (tenantId) filter.tenant_id = tenantId;
        const items = await base44.asServiceRole.entities.Revier.filter(filter);
        const result = updatedSince
          ? items.filter(i => new Date(i.updated_date) > new Date(updatedSince))
          : items;
        return json(result);
      }
      return err("Method not allowed", 405);
    }

    // =====================
    // EINRICHTUNGEN
    // =====================
    if (resource === "einrichtungen") {
      if (req.method === "GET") {
        if (id) {
          const item = await base44.asServiceRole.entities.Jagdeinrichtung.get(id);
          return item ? json(item) : err("Not found", 404);
        }
        const items = await base44.asServiceRole.entities.Jagdeinrichtung.filter(buildFilter());
        const result = updatedSince
          ? items.filter(i => new Date(i.updated_date) > new Date(updatedSince))
          : items;
        return json(result);
      }
      if (req.method === "POST") {
        if (!body.tenant_id) return err("tenant_id required");
        if (!body.revier_id) return err("revier_id required");
        if (!body.type) return err("type required");
        if (!body.name) return err("name required");
        const created = await base44.asServiceRole.entities.Jagdeinrichtung.create(body);
        return json(created, 201);
      }
      if (req.method === "PUT") {
        if (!id) return err("ID required in path");
        const updated = await base44.asServiceRole.entities.Jagdeinrichtung.update(id, body);
        return json(updated);
      }
      return err("Method not allowed", 405);
    }

    // =====================
    // ABSCHUESSE (Strecke)
    // =====================
    if (resource === "abschuesse") {
      if (req.method === "GET") {
        if (id) {
          const item = await base44.asServiceRole.entities.Strecke.get(id);
          return item ? json(item) : err("Not found", 404);
        }
        const items = await base44.asServiceRole.entities.Strecke.filter(buildFilter());
        const result = updatedSince
          ? items.filter(i => new Date(i.updated_date) > new Date(updatedSince))
          : items;
        return json(result);
      }
      if (req.method === "POST") {
        if (!body.tenant_id) return err("tenant_id required");
        if (!body.revier_id) return err("revier_id required");
        if (!body.species) return err("species required");
        if (!body.date) return err("date required");
        const created = await base44.asServiceRole.entities.Strecke.create(body);
        return json(created, 201);
      }
      return err("Method not allowed", 405);
    }

    // =====================
    // SICHTUNGEN (JagdMeldung)
    // =====================
    if (resource === "sichtungen") {
      if (req.method === "GET") {
        if (id) {
          const item = await base44.asServiceRole.entities.JagdMeldung.get(id);
          return item ? json(item) : err("Not found", 404);
        }
        const items = await base44.asServiceRole.entities.JagdMeldung.filter(buildFilter());
        const result = updatedSince
          ? items.filter(i => new Date(i.updated_date) > new Date(updatedSince))
          : items;
        return json(result);
      }
      if (req.method === "POST") {
        if (!body.tenant_id) return err("tenant_id required");
        if (!body.jagd_id) body.jagd_id = body.revier_id || "standalone";
        if (!body.typ) body.typ = "sichtung";
        if (!body.zeitstempel) body.zeitstempel = new Date().toISOString();
        const created = await base44.asServiceRole.entities.JagdMeldung.create(body);
        return json(created, 201);
      }
      return err("Method not allowed", 405);
    }

    // =====================
    // AUFGABEN
    // =====================
    if (resource === "aufgaben") {
      if (req.method === "GET") {
        if (id) {
          const item = await base44.asServiceRole.entities.Aufgabe.get(id);
          return item ? json(item) : err("Not found", 404);
        }
        const items = await base44.asServiceRole.entities.Aufgabe.filter(buildFilter());
        const result = updatedSince
          ? items.filter(i => new Date(i.updated_date) > new Date(updatedSince))
          : items;
        return json(result);
      }
      if (req.method === "PUT") {
        if (!id) return err("ID required in path");
        const updated = await base44.asServiceRole.entities.Aufgabe.update(id, body);
        return json(updated);
      }
      return err("Method not allowed", 405);
    }

    // =====================
    // TERMINE
    // =====================
    if (resource === "termine") {
      if (req.method === "GET") {
        if (id) {
          const item = await base44.asServiceRole.entities.Termin.get(id);
          return item ? json(item) : err("Not found", 404);
        }
        const items = await base44.asServiceRole.entities.Termin.filter(buildFilter());
        const result = updatedSince
          ? items.filter(i => new Date(i.updated_date) > new Date(updatedSince))
          : items;
        return json(result);
      }
      return err("Method not allowed", 405);
    }

    // =====================
    // JAGDTERMINE (GesellschaftsJagd)
    // =====================
    if (resource === "jagdtermine") {
      if (req.method === "GET") {
        if (id) {
          const item = await base44.asServiceRole.entities.GesellschaftsJagd.get(id);
          return item ? json(item) : err("Not found", 404);
        }
        const items = await base44.asServiceRole.entities.GesellschaftsJagd.filter(buildFilter());
        const result = updatedSince
          ? items.filter(i => new Date(i.updated_date) > new Date(updatedSince))
          : items;
        return json(result);
      }
      return err("Method not allowed", 405);
    }

    // =====================
    // ROOT: API Info
    // =====================
    if (!resource) {
      return json({
        name: "NextHunt External REST API",
        version: "1.0",
        endpoints: [
          "GET  ?path=/reviere",
          "GET  ?path=/reviere/{id}",
          "GET  ?path=/einrichtungen",
          "GET  ?path=/einrichtungen/{id}",
          "POST ?path=/einrichtungen",
          "PUT  ?path=/einrichtungen/{id}",
          "GET  ?path=/abschuesse",
          "POST ?path=/abschuesse",
          "GET  ?path=/sichtungen",
          "POST ?path=/sichtungen",
          "GET  ?path=/aufgaben",
          "PUT  ?path=/aufgaben/{id}",
          "GET  ?path=/termine",
          "GET  ?path=/jagdtermine",
        ],
        query_params: ["tenant_id (required)", "revier_id (optional)", "updated_since (ISO date, optional)"],
        auth: "Header: x-api-key: <your_key>",
      });
    }

    return err("Unknown endpoint", 404);
  } catch (e) {
    return err(e.message || "Internal error", 500);
  }
});