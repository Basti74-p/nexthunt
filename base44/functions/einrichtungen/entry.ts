import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const revierId = url.searchParams.get('revier_id');

        const filter = { tenant_id: user.tenant_id };
        if (revierId) {
            filter.revier_id = revierId;
        }

        const einrichtungen = await base44.entities.Jagdeinrichtung.filter(filter);
        return Response.json(einrichtungen);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});