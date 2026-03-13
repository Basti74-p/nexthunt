import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { backupId } = await req.json();
    if (!backupId) return Response.json({ error: 'backupId is required' }, { status: 400 });

    const backups = await base44.asServiceRole.entities.Backup.filter({ id: backupId });
    if (!backups.length) return Response.json({ error: 'Backup not found' }, { status: 404 });

    const backup = backups[0];
    const result = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: backup.file_uri,
      expires_in: 300
    });

    return Response.json({ signed_url: result.signed_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});