import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all reviere for this tenant
    const reviere = await base44.entities.Revier.list();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      reviere: []
    };

    // For each revier, fetch all related entities
    for (const revier of reviere) {
      const revierBackup = {
        revier: revier,
        jagdeinrichtungen: [],
        gesellschaftsjagden: [],
        schadensprotokelle: [],
        strecken: [],
        wildmarken: [],
        wildprodukte: [],
        wildkammern: [],
        abschusspläne: [],
        jagdevents: [],
        wildmanagement: [],
        jagdeventassignments: []
      };

      // Fetch all entities filtered by revier_id
      const [
        jagdeinrichtungen,
        gesellschaftsjagden,
        schadensprotokelle,
        strecken,
        wildmarken,
        wildprodukte,
        wildkammern,
        abschusspläne,
        jagdevents,
        wildmanagement,
        jagdeventassignments
      ] = await Promise.all([
        base44.entities.Jagdeinrichtung.filter({ revier_id: revier.id }),
        base44.entities.GesellschaftsJagd.filter({ revier_id: revier.id }),
        base44.entities.Schadensprotokoll.filter({ revier_id: revier.id }),
        base44.entities.Strecke.filter({ revier_id: revier.id }),
        base44.entities.Wildmarke.filter({ revier_id: revier.id }),
        base44.entities.WildProdukt.filter({ revier_id: revier.id }),
        base44.entities.Wildkammer.filter({ revier_id: revier.id }),
        base44.entities.Abschussplan.filter({ revier_id: revier.id }),
        base44.entities.JagdEvent.filter({ revier_id: revier.id }),
        base44.entities.WildManagement.filter({ revier_id: revier.id }),
        base44.entities.JagdEventAssignment.filter({})
      ]);

      revierBackup.jagdeinrichtungen = jagdeinrichtungen;
      revierBackup.gesellschaftsjagden = gesellschaftsjagden;
      revierBackup.schadensprotokelle = schadensprotokelle;
      revierBackup.strecken = strecken;
      revierBackup.wildmarken = wildmarken;
      revierBackup.wildprodukte = wildprodukte;
      revierBackup.wildkammern = wildkammern;
      revierBackup.abschusspläne = abschusspläne;
      revierBackup.jagdevents = jagdevents;
      revierBackup.wildmanagement = wildmanagement;
      
      // Filter JagdEventAssignments for this revier's events
      revierBackup.jagdeventassignments = jagdeventassignments.filter(a => 
        jagdevents.some(e => e.id === a.jagd_event_id)
      );

      backupData.reviere.push(revierBackup);
    }

    // Convert to JSON and upload
    const jsonString = JSON.stringify(backupData, null, 2);
    const jsonBlob = new Blob([jsonString], { type: 'application/json' });
    
    // Create filename with date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `revier-backup-${dateStr}.json`;

    // Upload to private file storage
    const uploadResult = await base44.integrations.Core.UploadPrivateFile({
      file: jsonBlob
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