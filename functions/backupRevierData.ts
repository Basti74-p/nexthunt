import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant membership to determine their primary tenant
    const tenantMembers = await base44.asServiceRole.entities.TenantMember.filter({
      user_email: user.email
    });
    
    if (!tenantMembers || tenantMembers.length === 0) {
      return Response.json({ error: 'User has no tenant membership' }, { status: 403 });
    }
    
    // Use first tenant membership as primary tenant
    const primaryTenant = tenantMembers[0];
    const userTenantId = primaryTenant.tenant_id;
    
    // Get ONLY reviere from user's primary tenant
    let reviere = await base44.asServiceRole.entities.Revier.filter({
      tenant_id: userTenantId
    });
    
    const debugInfo = {
      user_email: user.email,
      user_tenant_id: userTenantId,
      reviere_count: reviere.length,
      revier_names: reviere.map(r => r.name),
      all_tenant_memberships: tenantMembers.length
    };
    
    // For tenant members with restricted access, filter by allowed_reviere
    const tenantMembers = await base44.asServiceRole.entities.TenantMember.filter({ user_email: user.email });
    if (tenantMembers && tenantMembers.length > 0) {
      const allowedReviere = tenantMembers[0].allowed_reviere;
      // Filter by allowed_reviere if user has restricted access (non-empty list means restrictions apply)
      if (allowedReviere && allowedReviere.length > 0) {
        reviere = reviere.filter(r => allowedReviere.includes(r.id));
      }
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
      timestamp: now.toISOString(),
      debug: debugInfo
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});