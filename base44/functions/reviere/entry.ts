import * as djwt from 'https://deno.land/x/djwt@v2.9.1/mod.ts';
import { createClient } from 'npm:@base44/sdk@0.8.23';

const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });

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
    const data = await base44.asServiceRole.entities.Revier.filter({ tenant_id: payload.tenant_id });
    return Response.json({ data, sync_timestamp: new Date().toISOString() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});