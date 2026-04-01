import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const reviere = await base44.entities.Revier.filter({ tenant_id: user.tenant_id });
        return Response.json(reviere);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});