import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only platform admin can delete users
    if (user?.role !== 'platform_admin' && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email } = await req.json();
    
    if (!email) {
      return Response.json({ error: 'Email erforderlich' }, { status: 400 });
    }

    // Delete all TenantMembers for this email
    const members = await base44.asServiceRole.entities.TenantMember.filter({ user_email: email });
    for (const member of members) {
      await base44.asServiceRole.entities.TenantMember.delete(member.id);
    }

    // Delete all Tenants where this email is contact_email
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ contact_email: email });
    for (const tenant of tenants) {
      await base44.asServiceRole.entities.Tenant.delete(tenant.id);
    }

    return Response.json({
      success: true,
      message: `Benutzer ${email} und alle zugehörigen Daten gelöscht`,
      deleted: {
        members: members.length,
        tenants: tenants.length
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});