import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's reviere to determine tenant
    let userReviere = await base44.entities.Revier.list();
    
    if (!userReviere || userReviere.length === 0) {
      return Response.json({ backups: [] });
    }

    const tenantId = userReviere[0].tenant_id;

    // List backups from private storage (pattern: backups/{tenant_id}/*.json)
    const backups = await base44.integrations.Core.ListStorageFiles({
      path: `backups/${tenantId}`,
      storage_type: 'private'
    });

    // Format backup list
    const formattedBackups = backups
      .filter(file => file.name.endsWith('.json'))
      .map(file => {
        // Extract timestamp from filename (format: backup-{timestamp}.json)
        const match = file.name.match(/backup-(\d+)-(.+?)\.json/);
        const timestamp = match ? parseInt(match[1]) : 0;
        const reviersCount = match ? parseInt(match[2]) || 0 : 0;
        
        return {
          id: file.name,
          name: file.name,
          size: file.size,
          created: new Date(timestamp).toLocaleString('de-DE'),
          reviersCount
        };
      })
      .sort((a, b) => b.created - a.created);

    return Response.json({ backups: formattedBackups });
  } catch (error) {
    return Response.json({ backups: [], error: error.message });
  }
});