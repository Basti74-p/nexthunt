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

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Der Base44 User ist bereits eingeloggt - wir brauchen nur seinen Token
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Nicht eingeloggt. Bitte zuerst in Base44 einloggen.' }, { status: 401, headers: corsHeaders });
        }

        // TenantMember prüfen
        const members = await base44.asServiceRole.entities.TenantMember.filter({ 
            user_email: user.email, 
            status: 'active' 
        });

        if (!members || members.length === 0) {
            return Response.json({ error: 'Kein aktiver Tenant gefunden' }, { status: 403, headers: corsHeaders });
        }
        const member = members[0];

        // Tenant-Info laden
        const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: member.tenant_id });
        const tenant = tenants?.[0] || null;

        // JWT für Mobile-App erstellen (7 Tage gültig)
        const key = await getKey();
        const token = await djwt.create(
            { alg: 'HS256', typ: 'JWT' },
            {
                sub: user.id,
                email: user.email,
                full_name: user.full_name,
                tenant_id: member.tenant_id,
                role: member.role,
                exp: djwt.getNumericDate(60 * 60 * 24 * 7), // 7 Tage
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
                tenant_name: tenant?.name || '',
            }
        }, { headers: corsHeaders });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
});