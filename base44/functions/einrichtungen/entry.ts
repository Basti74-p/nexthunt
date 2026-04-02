import * as djwt from 'https://deno.land/x/djwt@v2.9.1/mod.ts';

const APP_ID = Deno.env.get('BASE44_APP_ID');
const API_KEY = Deno.env.get('NEXTHUNT_API_KEY');

async function verifyToken(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(Deno.env.get('JWT_SECRET')),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
    );
    return await djwt.verify(token, key);
  } catch { return null; }
}

async function dbFilter(entity, filter) {
  const res = await fetch(`https://api.base44.com/api/apps/${APP_ID}/entities/${entity}/filter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'ApiKey': API_KEY },
    body: JSON.stringify(filter)
  });
  if (!res.ok) throw new Error(`DB error: ${res.status}`);
  return res.json();
}

Deno.serve(async (req) => {
  const payload = await verifyToken(req);
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const filter = { tenant_id: payload.tenant_id };
    if (body.revier_id) filter.revier_id = body.revier_id;

    const data = await dbFilter('Jagdeinrichtung', filter);
    return Response.json({ data, sync_timestamp: new Date().toISOString() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});