import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let backupData = null;
    const contentType = req.headers.get('content-type') || '';
    
    // Check if it's a backup ID or file upload
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const backupId = body.backupId;

      if (backupId) {
        // Load backup from Cloud
        const backup = await base44.entities.Backup.get(backupId);
        if (!backup) {
          return Response.json({ error: 'Backup nicht gefunden' }, { status: 404 });
        }

        // Download file from private storage
        const signedUrl = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: backup.file_uri,
          expires_in: 300
        });

        const fileResponse = await fetch(signedUrl.signed_url);
        const content = await fileResponse.text();
        backupData = JSON.parse(content);
      } else {
        return Response.json({ error: 'Keine Datei oder Backup ID angegeben' }, { status: 400 });
      }
    } else {
      // File upload
      const formData = await req.formData();
      const file = formData.get('file');

      if (!file) {
        return Response.json({ error: 'Keine Datei hochgeladen' }, { status: 400 });
      }

      const content = await file.text();
      backupData = JSON.parse(content);
    }

    if (!backupData) {
      return Response.json({ error: 'Ungültiges Backup-Format' }, { status: 400 });
    }

    // Get user's reviere to verify ownership
    let userReviere = await base44.entities.Revier.list();
    const userRevierIds = userReviere.map(r => r.id);

    // Track restored count
    let restoredCount = 0;

    // If backup has reviere array (old format), use it. Otherwise it's the new format
    const revieresToRestore = backupData.reviere || [];

    // Restore each revier's data
    for (const revierBackup of revieresToRestore) {
      // Only restore if user has access to this revier
      if (!userRevierIds.includes(revierBackup.id)) {
        continue;
      }

      // Restore Jagdeinrichtungen
      if (revierBackup.jagdeinrichtungen && Array.isArray(revierBackup.jagdeinrichtungen)) {
        for (const item of revierBackup.jagdeinrichtungen) {
          try {
            await base44.entities.Jagdeinrichtung.create({
              tenant_id: item.tenant_id,
              revier_id: item.revier_id,
              type: item.type,
              name: item.name,
              latitude: item.latitude,
              longitude: item.longitude,
              condition: item.condition,
              orientation: item.orientation,
              notes: item.notes,
              photos: item.photos || []
            });
            restoredCount++;
          } catch (e) {
            console.error('Fehler bei Jagdeinrichtung:', e);
          }
        }
      }

      // Restore Strecken
      if (revierBackup.strecken && Array.isArray(revierBackup.strecken)) {
        for (const item of revierBackup.strecken) {
          try {
            await base44.entities.Strecke.create({
              tenant_id: item.tenant_id,
              revier_id: item.revier_id,
              species: item.species,
              gender: item.gender,
              age_class: item.age_class,
              date: item.date,
              shooter_email: item.shooter_email,
              latitude: item.latitude,
              longitude: item.longitude,
              weight_kg: item.weight_kg,
              status: item.status,
              notes: item.notes
            });
            restoredCount++;
          } catch (e) {
            console.error('Fehler bei Strecke:', e);
          }
        }
      }

      // Restore Wildkammern
      if (revierBackup.wildkammern && Array.isArray(revierBackup.wildkammern)) {
        for (const item of revierBackup.wildkammern) {
          try {
            await base44.entities.Wildkammer.create({
              tenant_id: item.tenant_id,
              revier_id: item.revier_id,
              species: item.species,
              age_class: item.age_class,
              gender: item.gender,
              eingang_datum: item.eingang_datum,
              status: item.status
            });
            restoredCount++;
          } catch (e) {
            console.error('Fehler bei Wildkammer:', e);
          }
        }
      }

      // Restore Jagdevents
      if (revierBackup.jagdevents && Array.isArray(revierBackup.jagdevents)) {
        for (const item of revierBackup.jagdevents) {
          try {
            await base44.entities.JagdEvent.create({
              tenant_id: item.tenant_id,
              revier_id: item.revier_id,
              title: item.title,
              date: item.date,
              status: item.status
            });
            restoredCount++;
          } catch (e) {
            console.error('Fehler bei JagdEvent:', e);
          }
        }
      }
    }

    return Response.json({
      success: true,
      restoredCount
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});