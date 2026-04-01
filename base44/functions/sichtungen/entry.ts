import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        switch (req.method) {
            case 'GET': {
                const sichtungen = await base44.entities.WolfSighting.filter({ tenant_id: user.tenant_id });
                return Response.json(sichtungen);
            }
            case 'POST': {
                const data = await req.json();
                if (!data || !data.sighting_date || !data.sighting_type) {
                    return Response.json({ error: 'Missing required fields: sighting_date, sighting_type' }, { status: 400 });
                }
                const newSichtung = await base44.entities.WolfSighting.create({
                    ...data,
                    tenant_id: user.tenant_id
                });
                return Response.json(newSichtung, { status: 201 });
            }
            default:
                return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
        }
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});