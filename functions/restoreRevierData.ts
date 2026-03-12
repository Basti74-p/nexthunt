import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'Keine Datei hochgeladen' }, { status: 400 });
    }

    const content = await file.text();
    let backupData;
    
    try {
      backupData = JSON.parse(content);
    } catch (e) {
      return Response.json({ error: 'Ungültiges Backup-Format' }, { status: 400 });
    }

    if (!backupData.reviere || !Array.isArray(backupData.reviere)) {
      return Response.json({ error: 'Backup-Struktur ungültig' }, { status: 400 });
    }

    // Get user's reviere to verify ownership
    let userReviere = await base44.entities.Revier.list();
    const userRevierIds = userReviere.map(r => r.id);

    // Track restored count
    let restoredCount = 0;
    const errors = [];

    // Restore each revier's data
    for (const revierBackup of backupData.reviere) {
      const revierId = revierBackup.id;

      // Verify user owns this revier
      if (!userRevierIds.includes(revierId)) {
        errors.push(`Keine Berechtigung für Revier ${revierId}`);
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
            errors.push(`Fehler bei Jagdeinrichtung: ${e.message}`);
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
            errors.push(`Fehler bei Strecke: ${e.message}`);
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
            errors.push(`Fehler bei Wildkammer: ${e.message}`);
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
            errors.push(`Fehler bei JagdEvent: ${e.message}`);
          }
        }
      }
    }

    return Response.json({
      success: true,
      message: `${restoredCount} Einträge wiederhergestellt`,
      restoredCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});