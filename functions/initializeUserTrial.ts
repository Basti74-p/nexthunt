import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a tenant
    const existingTenants = await base44.entities.Tenant.filter({ contact_email: user.email });
    if (existingTenants.length > 0) {
      return Response.json({ message: 'User already has a tenant', tenant_id: existingTenants[0].id });
    }

    // Create new trial tenant
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const newTenant = await base44.entities.Tenant.create({
      name: `${user.full_name}'s Revier`,
      contact_person: user.full_name,
      contact_email: user.email,
      status: 'trial',
      plan: 'free_trial',
      trial_start_date: now.toISOString(),
      trial_end_date: trialEndDate.toISOString(),
      trial_days_remaining: 30,
      // All features enabled for trial
      feature_map: true,
      feature_sightings: true,
      feature_strecke: true,
      feature_wildkammer: true,
      feature_tasks: true,
      feature_driven_hunt: true,
      feature_public_portal: true,
      feature_wildmarken: true,
      feature_dashboard: true,
      feature_reviere: true,
      feature_kalender: true,
      feature_personen: true,
      feature_einrichtungen: true
    });

    // Create TenantMember entry for the user
    await base44.entities.TenantMember.create({
      tenant_id: newTenant.id,
      user_email: user.email,
      first_name: user.full_name.split(' ')[0],
      last_name: user.full_name.split(' ').slice(1).join(' ') || 'User',
      role: 'tenant_owner',
      status: 'active',
      perm_wildmanagement: true,
      perm_strecke: true,
      perm_wildkammer: true,
      perm_kalender: true,
      perm_aufgaben: true,
      perm_personen: true,
      perm_oeffentlichkeit: true,
      perm_einrichtungen: true
    });

    return Response.json({
      success: true,
      tenant_id: newTenant.id,
      trial_end_date: trialEndDate.toISOString(),
      message: '30-Tage-Testphase gestartet'
    });
  } catch (error) {
    console.error('Error initializing trial:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});