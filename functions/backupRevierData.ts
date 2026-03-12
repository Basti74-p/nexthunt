import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's reviere (auto-filtered to user's tenant via base44)
    let reviere = await base44.entities.Revier.list();
    
    // Get TenantMember info to check for access restrictions
    const userEmail = user.email;
    try {
      const tenantMembers = await base44.asServiceRole.entities.TenantMember.filter({ user_email: userEmail });
      if (tenantMembers && tenantMembers.length > 0) {
        const allowedReviere = tenantMembers[0].allowed_reviere;
        // Filter by allowed_reviere if user has restricted access (non-empty list means restrictions apply)
        if (allowedReviere && allowedReviere.length > 0) {
          reviere = reviere.filter(r => allowedReviere.includes(r.id));
        }
      }
    } catch (err) {
      // Continue with all reviere if TenantMember lookup fails
    }
    
    if (!reviere || reviere.length === 0) {
      return Response.json({ 
        success: false,
        error: 'Keine Reviere für Backup verfügbar' 
      }, { status: 400 });
    }
    
    const backupData = {
      timestamp: new Date().toISOString(),
      reviere: []
    };

    // For each revier, fetch all related entities and build complete backup
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

      backupData.reviere.push({
        id: revier.id,
        name: revier.name,
        region: revier.region,
        size_ha: revier.size_ha,
        notes: revier.notes,
        status: revier.status,
        jagdeinrichtungen: jagdeinrichtungen,
        strecken: strecken,
        wildkammern: wildkammern,
        jagdevents: jagdevents
      });
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

    // Create backup record in database
    const backupTenantId = reviere[0]?.tenant_id || '';
    if (backupTenantId) {
      await base44.asServiceRole.entities.Backup.create({
        tenant_id: backupTenantId,
        file_uri: uploadResult.file_uri,
        reviers_count: reviere.length,
        file_size: jsonString.length,
        is_automatic: false
      });
    }

    return Response.json({
      success: true,
      message: `Backup erfolgreich erstellt`,
      reviersCount: reviere.length,
      timestamp: now.toISOString()
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});