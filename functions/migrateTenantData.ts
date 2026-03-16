import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { oldTenantId, newTenantId } = await req.json();

    if (!oldTenantId || !newTenantId) {
      return Response.json({ error: 'Missing tenant IDs' }, { status: 400 });
    }

    const entities = [
      'Revier', 'Jagdeinrichtung', 'Strecke', 'Wildmarke', 'Wildkammer',
      'WildProdukt', 'Verkauf', 'Kunde', 'Aufgabe', 'Termin', 'GesellschaftsJagd',
      'JagdTeilnehmer', 'JagdMeldung', 'Schadensprotokoll', 'Person',
      'Abschussplan'
    ];

    let migratedCount = 0;

    for (const entityName of entities) {
      try {
        const records = await base44.asServiceRole.entities[entityName].filter({ 
          tenant_id: oldTenantId 
        });

        for (const record of records) {
          const { id, created_date, updated_date, created_by, ...data } = record;
          data.tenant_id = newTenantId;
          await base44.asServiceRole.entities[entityName].create(data);
          migratedCount++;
        }
      } catch (e) {
        console.log(`Skipping ${entityName}:`, e.message);
      }
    }

    // Delete old TenantMember
    const members = await base44.asServiceRole.entities.TenantMember.filter({ 
      tenant_id: oldTenantId 
    });
    for (const member of members) {
      await base44.asServiceRole.entities.TenantMember.delete(member.id);
    }

    // Delete old Tenant
    await base44.asServiceRole.entities.Tenant.delete(oldTenantId);

    return Response.json({ 
      success: true, 
      migratedRecords: migratedCount,
      deletedTenant: oldTenantId
    });
  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});