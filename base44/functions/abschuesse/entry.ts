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
                const abschuesse = await base44.entities.Strecke.filter({ tenant_id: user.tenant_id });
                return Response.json(abschuesse);
            }
            case 'POST': {
                const data = await req.json();
                if (!data || !data.species || !data.date || !data.revier_id) {
                    return Response.json({ error: 'Missing required fields: species, date, revier_id' }, { status: 400 });
                }
                const newAbschuss = await base44.entities.Strecke.create({
                    ...data,
                    tenant_id: user.tenant_id,
                    shooter_email: user.email
                });
                return Response.json(newAbschuss, { status: 201 });
            }
            default:
                return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
        }
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});