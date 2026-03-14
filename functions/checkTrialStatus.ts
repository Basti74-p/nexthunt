import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant – try contact_email first, then TenantMember lookup
    let tenants = await base44.entities.Tenant.filter({ contact_email: user.email });
    if (tenants.length === 0) {
      const members = await base44.entities.TenantMember.filter({ user_email: user.email });
      if (members.length > 0) {
        tenants = await base44.entities.Tenant.filter({ id: members[0].tenant_id });
      }
    }
    if (tenants.length === 0) {
      return Response.json({ error: 'No tenant found' }, { status: 404 });
    }

    const tenant = tenants[0];
    const now = new Date();
    const trialEndDate = new Date(tenant.trial_end_date);
    const daysRemaining = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

    // Check if trial has expired
    if (daysRemaining <= 0 && tenant.status === 'trial') {
      // Update tenant status to expired
      await base44.entities.Tenant.update(tenant.id, {
        status: 'expired',
        trial_days_remaining: 0
      });

      return Response.json({
        status: 'expired',
        message: 'Ihre 30-Tage-Testphase ist abgelaufen',
        tenant_id: tenant.id,
        action_required: true
      });
    }

    // Trial still active
    if (tenant.status === 'trial') {
      return Response.json({
        status: 'active',
        tenant_id: tenant.id,
        days_remaining: Math.max(0, daysRemaining),
        trial_end_date: trialEndDate.toISOString(),
        message: `${daysRemaining} Tage verbleibend`
      });
    }

    // Paid subscription
    return Response.json({
      status: tenant.status,
      tenant_id: tenant.id,
      plan: tenant.plan
    });
  } catch (error) {
    console.error('Error checking trial status:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});