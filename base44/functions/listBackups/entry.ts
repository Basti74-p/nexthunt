import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all backups (automatically filtered by user's tenant)
    const backups = await base44.entities.Backup.list('-created_date', 100);

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
    console.error('Fehler beim Laden der Backups:', error);
    return Response.json({ backups: [] });
  }
});