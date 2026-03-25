import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // IDs aus dem Debug
    const oldRevierID = '69b29b19d0b3d5578c8ace0c';
    const newRevierID = '69b7fc819897d6d7c49379ef';

    // Alle Einrichtungen mit alter ID abrufen
    const einrichtungen = await base44.entities.Jagdeinrichtung.filter({ revier_id: oldRevierID });
    
    if (einrichtungen.length === 0) {
      return Response.json({ message: 'Keine Einrichtungen zum Migrieren gefunden' });
    }

    // Alle Einrichtungen zur neuen Revier-ID updaten
    const updates = einrichtungen.map(e => 
      base44.entities.Jagdeinrichtung.update(e.id, { revier_id: newRevierID })
    );

    await Promise.all(updates);

    return Response.json({ 
      success: true, 
      migratedCount: einrichtungen.length,
      message: `${einrichtungen.length} Einrichtungen von alter zu neuer Trebra 1 ID verschoben`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});