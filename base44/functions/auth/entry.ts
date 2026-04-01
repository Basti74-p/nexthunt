import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import * as djwt from 'https://deno.land/x/djwt@v2.9.1/mod.ts';

const JWT_SECRET = Deno.env.get('JWT_SECRET');

async function getKey() {
    const enc = new TextEncoder();
    return await crypto.subtle.importKey(
        'raw',
        enc.encode(JWT_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
}

// Helper: JWT aus Request-Header lesen und validieren
export async function verifyToken(req) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    try {
        const key = await getKey();
        const payload = await djwt.verify(token, key);
        return payload;
    } catch {
        return null;
    }
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return Response.json({ error: 'Method Not Allowed' }, { status: 405, headers: corsHeaders });
    }

    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return Response.json({ error: 'Email und Passwort erforderlich' }, { status: 400, headers: corsHeaders });
        }

        // Base44 Login mit Email/Passwort
        const base44 = createClientFromRequest(req);
        
        // Nutzer aus der User-Liste suchen und validieren
        const users = await base44.asServiceRole.entities.User.filter({ email });
        if (!users || users.length === 0) {
            return Response.json({ error: 'Ungültige Anmeldedaten' }, { status: 401, headers: corsHeaders });
        }
        const user = users[0];

        // TenantMember prüfen
        const members = await base44.asServiceRole.entities.TenantMember.filter({ user_email: email, status: 'active' });
        if (!members || members.length === 0) {
            return Response.json({ error: 'Kein aktiver Tenant gefunden' }, { status: 403, headers: corsHeaders });
        }
        const member = members[0];

        // JWT erstellen (24h gültig)
        const key = await getKey();
        const token = await djwt.create(
            { alg: 'HS256', typ: 'JWT' },
            {
                sub: user.id,
                email: user.email,
                full_name: user.full_name,
                tenant_id: member.tenant_id,
                role: member.role,
                exp: djwt.getNumericDate(60 * 60 * 24), // 24 Stunden
            },
            key
        );

        return Response.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                tenant_id: member.tenant_id,
                role: member.role,
            }
        }, { headers: corsHeaders });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
});