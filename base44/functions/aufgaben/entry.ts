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
                const aufgaben = await base44.entities.Aufgabe.filter({ tenant_id: user.tenant_id });
                return Response.json(aufgaben);
            }
            case 'PUT': {
                const url = new URL(req.url);
                const aufgabeId = url.searchParams.get('id');

                if (!aufgabeId) {
                    return Response.json({ error: 'Missing task ID (?id=...)' }, { status: 400 });
                }

                const data = await req.json();
                if (!data || Object.keys(data).length === 0) {
                    return Response.json({ error: 'Request body is empty' }, { status: 400 });
                }

                const existing = await base44.entities.Aufgabe.get(aufgabeId);
                if (!existing || existing.tenant_id !== user.tenant_id) {
                    return Response.json({ error: 'Task not found or not authorized' }, { status: 404 });
                }

                const updated = await base44.entities.Aufgabe.update(aufgabeId, data);
                return Response.json(updated);
            }
            default:
                return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
        }
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});