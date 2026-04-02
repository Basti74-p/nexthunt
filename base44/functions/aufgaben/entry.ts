import * as djwt from 'https://deno.land/x/djwt@v2.9.1/mod.ts';
import { createClient } from 'npm:@base44/sdk@0.8.23';

const base44 = createClient({
  appId: Deno.env.get('BASE44_APP_ID'),
  apiKey: Deno.env.get('NEXTHUNT_API_KEY'),
});

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

Deno.serve(async (req) => {
  const payload = await verifyToken(req);
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));

    if (body.action === 'update_status') {
      const { id, status } = body;
      if (!id || !status) {
        return Response.json({ error: 'Pflichtfelder fehlen: id, status' }, { status: 400 });
      }
      const data = await base44.entities.Aufgabe.update(id, { status });
      return Response.json({ data, sync_timestamp: new Date().toISOString() });
    }

    const filter = { tenant_id: payload.tenant_id };
    if (body.revier_id) filter.revier_id = body.revier_id;
    const data = await base44.entities.Aufgabe.filter(filter);
    return Response.json({ data, sync_timestamp: new Date().toISOString() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});