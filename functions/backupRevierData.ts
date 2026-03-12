import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant memberships to find allowed reviere
    const userEmail = user.email;
    let allowedReviere = null;
    
    try {
      const tenantMembers = await base44.asServiceRole.entities.TenantMember.filter({ user_email: userEmail });
      if (tenantMembers && tenantMembers.length > 0) {
        const member = tenantMembers[0];
        // If user has restricted allowed_reviere list, store it for filtering
        if (member.allowed_reviere && member.allowed_reviere.length > 0) {
          allowedReviere = member.allowed_reviere;
        }
      }
    } catch (err) {
      // If TenantMember lookup fails, continue with no restrictions
    }
    
    // Get all accessible reviere for the user
    let reviere = await base44.entities.Revier.list();
    
    // Filter by allowed_reviere if restrictions apply
    if (allowedReviere) {
      reviere = reviere.filter(r => allowedReviere.includes(r.id));
    }
    
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