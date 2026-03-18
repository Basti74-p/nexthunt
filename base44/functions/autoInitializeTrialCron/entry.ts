import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    // Service role call - runs as admin
    const base44 = createClientFromRequest(req);
    
    // Get all users without a tenant (check both tenant_id and TenantMember entries)
    // This is a workaround since we can't directly access User entity
    // Instead, we check TenantMember for users without entries
    
    // Get all existing tenant members
    const allMembers = await base44.asServiceRole.entities.TenantMember.list();
    const usersWithTenants = new Set(allMembers.map(m => m.user_email));
    
    // Get all tenants by contact_email (owners)
    const allTenants = await base44.asServiceRole.entities.Tenant.list();
    const ownerEmails = new Set(allTenants.map(t => t.contact_email));
    usersWithTenants.forEach(email => ownerEmails.add(email));
    
    console.log(`Found ${usersWithTenants.size} users with tenants via TenantMember`);
    console.log(`Found ${allTenants.length} tenants total`);
    
    return Response.json({
      success: true,
      message: 'Cron job completed',
      usersWithTenants: usersWithTenants.size,
      tenantsTotal: allTenants.length
    });
  } catch (error) {
    console.error('Error in autoInitializeTrialCron:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});