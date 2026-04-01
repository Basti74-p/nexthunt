import * as djwt from 'https://deno.land/x/djwt@v2.9.1/mod.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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
    try {
        const user = await verifyToken(req);
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const base44 = createClientFromRequest(req);

        if (req.method === 'GET') {
            const abschuesse = await base44.asServiceRole.entities.Strecke.filter({ tenant_id: user.tenant_id });
            return Response.json(abschuesse);
        }

        if (req.method === 'POST') {
            const data = await req.json();
            if (!data.species || !data.date || !data.revier_id) {
                return Response.json({ error: 'Pflichtfelder: species, date, revier_id' }, { status: 400 });
            }
            const newAbschuss = await base44.asServiceRole.entities.Strecke.create({
                ...data,
                tenant_id: user.tenant_id,
                shooter_email: user.email
            });
            return Response.json(newAbschuss, { status: 201 });
        }

        return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});