import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { protokollId, einrichtungId, hat_schaden, zustand_gesamt } = await req.json();

    if (!hat_schaden || !zustand_gesamt || !einrichtungId) {
      return Response.json({ success: true });
    }

    // Map protocol condition to facility condition
    const conditionMap = {
      gut: "gut",
      maessig: "maessig",
      schlecht: "schlecht",
      total: "schlecht"
    };

    const newCondition = conditionMap[zustand_gesamt] || zustand_gesamt;

    // Update facility condition
    await base44.entities.Jagdeinrichtung.update(einrichtungId, { 
      condition: newCondition 
    });

    return Response.json({ success: true, condition: newCondition });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});