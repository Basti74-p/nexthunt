import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'platform_admin' && user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { email } = body;

    // Get tenant members for this email
    const members = await base44.asServiceRole.entities.TenantMember.filter({ user_email: email });
    
    if (members.length === 0) {
      return Response.json({ error: 'User not found in any tenant', email }, { status: 404 });
    }

    const member = members[0];
    
    // Get reviere for this tenant
    const reviere = await base44.asServiceRole.entities.Revier.filter({ tenant_id: member.tenant_id });
    
    // Get all einrichtungen for this tenant
    const allEinrichtungen = await base44.asServiceRole.entities.Jagdeinrichtung.filter({ tenant_id: member.tenant_id });
    
    // Get einrichtungen filtered by allowed_reviere (if any)
    const filtered = member.allowed_reviere?.length > 0 
      ? allEinrichtungen.filter(e => member.allowed_reviere.includes(e.revier_id))
      : allEinrichtungen;

    return Response.json({
      user: { email, id: user.id },
      tenantMember: {
        id: member.id,
        role: member.role,
        allowed_reviere: member.allowed_reviere,
        allowed_reviere_count: member.allowed_reviere?.length || 0
      },
      reviere: reviere.map(r => ({ id: r.id, name: r.name })),
      einrichtungen_total: allEinrichtungen.length,
      einrichtungen_by_revier: Object.fromEntries(
        reviere.map(r => [r.name, allEinrichtungen.filter(e => e.revier_id === r.id).length])
      ),
      einrichtungen_visible: filtered.length,
      einrichtungen_sample: filtered.slice(0, 3).map(e => ({ name: e.name, revier_id: e.revier_id }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});