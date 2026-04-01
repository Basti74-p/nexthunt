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