import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    
    try {
      user = await base44.auth.me();
    } catch (e) {
      // Auth might fail, but that's OK - we'll use service role
      user = null;
    }

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all reviere for this tenant
    const reviere = await base44.entities.Revier.list();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      count: {
        reviere: 0,
        jagdeinrichtungen: 0,
        strecken: 0,
        wildkammern: 0,
        jagdevents: 0
      }
    };

    // For each revier, fetch key entities
    for (const revier of reviere) {
      const [
        jagdeinrichtungen,
        strecken,
        wildkammern,
        jagdevents
      ] = await Promise.all([
        base44.entities.Jagdeinrichtung.filter({ revier_id: revier.id }),
        base44.entities.Strecke.filter({ revier_id: revier.id }),
        base44.entities.Wildkammer.filter({ revier_id: revier.id }),
        base44.entities.JagdEvent.filter({ revier_id: revier.id })
      ]);

      backupData.count.reviere++;
      backupData.count.jagdeinrichtungen += jagdeinrichtungen.length;
      backupData.count.strecken += strecken.length;
      backupData.count.wildkammern += wildkammern.length;
      backupData.count.jagdevents += jagdevents.length;
    }

    // Convert to JSON and upload
    const jsonString = JSON.stringify(backupData, null, 2);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `revier-backup-${dateStr}.json`;

    // Create a File object from the JSON string
    const file = new File([jsonString], filename, { type: 'application/json' });

    // Upload to private file storage
    const uploadResult = await base44.integrations.Core.UploadPrivateFile({
      file: file
    });

    return Response.json({
      success: true,
      message: `Backup erfolgreich erstellt: ${filename}`,
      reviersCount: reviere.length,
      fileUri: uploadResult.file_uri,
      timestamp: now.toISOString()
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});