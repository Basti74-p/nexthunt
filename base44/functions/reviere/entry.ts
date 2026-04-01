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
        const reviere = await base44.asServiceRole.entities.Revier.filter({ tenant_id: user.tenant_id });
        return Response.json(reviere);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});