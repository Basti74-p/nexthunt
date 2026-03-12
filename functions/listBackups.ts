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

    // Get all backups for this tenant
    const backups = await base44.entities.Backup.filter({ tenant_id: tenantId }, '-created_date');

    // Format backup list
    const formattedBackups = backups.map(backup => ({
      id: backup.id,
      fileUri: backup.file_uri,
      created: new Date(backup.created_date).toLocaleString('de-DE'),
      reviersCount: backup.reviers_count,
      isAutomatic: backup.is_automatic,
      fileSize: backup.file_size
    }));

    return Response.json({ backups: formattedBackups });
  } catch (error) {
    return Response.json({ backups: [], error: error.message });
  }
});