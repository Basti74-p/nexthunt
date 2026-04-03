import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Plan definitions — single source of truth
export const PLAN_CONFIGS = {
  solo: {
    max_reviere: 1,
    max_mitglieder: 5,
    // Core features
    feature_map: true,
    feature_einrichtungen: true,
    feature_kalender: true,
    feature_sightings: true,
    feature_strecke: true,
    feature_reviere: true,
    // Disabled for solo
    feature_dashboard: false,
    feature_wildmarken: false,
    feature_tasks: false,
    feature_personen: false,
    feature_wildkammer: false,
    feature_driven_hunt: false,
    feature_public_portal: false,
    feature_wolftrack: false,
    feature_gesellschaftsjagd: false,
    feature_schadensprotokoll: false,
    feature_wildmanagement: false,
    feature_oeffentlichkeit: false,
    feature_kameras: false,
    // No add-ons
    addon_wildmanagement: false,
    addon_oeffentlichkeit: false,
    addon_kameras: false,
    addon_wildkammer: false,
  },
  pro: {
    max_reviere: 3,
    max_mitglieder: 15,
    // All solo features
    feature_map: true,
    feature_einrichtungen: true,
    feature_kalender: true,
    feature_sightings: true,
    feature_strecke: true,
    feature_reviere: true,
    // Pro extras
    feature_dashboard: true,
    feature_wildmarken: true,
    feature_tasks: true,
    feature_personen: true,
    feature_gesellschaftsjagd: true,
    feature_schadensprotokoll: true,
    // Still off by default (add-ons)
    feature_wildkammer: false,
    feature_driven_hunt: false,
    feature_public_portal: false,
    feature_wolftrack: false,
    feature_wildmanagement: false,
    feature_oeffentlichkeit: false,
    feature_kameras: false,
    // Add-ons off by default, can be enabled separately
    addon_wildmanagement: false,
    addon_oeffentlichkeit: false,
    addon_kameras: false,
    addon_wildkammer: false,
  },
  enterprise: {
    max_reviere: 999,
    max_mitglieder: 999,
    feature_map: true,
    feature_einrichtungen: true,
    feature_kalender: true,
    feature_sightings: true,
    feature_strecke: true,
    feature_reviere: true,
    feature_dashboard: true,
    feature_wildmarken: true,
    feature_tasks: true,
    feature_personen: true,
    feature_wildkammer: true,
    feature_driven_hunt: true,
    feature_public_portal: true,
    feature_wolftrack: true,
    feature_gesellschaftsjagd: true,
    feature_schadensprotokoll: true,
    feature_wildmanagement: true,
    feature_oeffentlichkeit: true,
    feature_kameras: true,
    addon_wildmanagement: true,
    addon_oeffentlichkeit: true,
    addon_kameras: true,
    addon_wildkammer: true,
  },
  free_trial: {
    max_reviere: 999,
    max_mitglieder: 999,
    feature_map: true,
    feature_einrichtungen: true,
    feature_kalender: true,
    feature_sightings: true,
    feature_strecke: true,
    feature_reviere: true,
    feature_dashboard: true,
    feature_wildmarken: true,
    feature_tasks: true,
    feature_personen: true,
    feature_wildkammer: true,
    feature_driven_hunt: true,
    feature_public_portal: true,
    feature_wolftrack: true,
    feature_gesellschaftsjagd: true,
    feature_schadensprotokoll: true,
    feature_wildmanagement: true,
    feature_oeffentlichkeit: true,
    feature_kameras: true,
    addon_wildmanagement: true,
    addon_oeffentlichkeit: true,
    addon_kameras: true,
    addon_wildkammer: true,
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const { tenantId, plan } = body;

    if (!tenantId || !plan) {
      return Response.json({ error: 'tenantId and plan are required' }, { status: 400, headers: corsHeaders });
    }

    const planConfig = PLAN_CONFIGS[plan];
    if (!planConfig) {
      return Response.json({
        error: `Unknown plan "${plan}". Valid plans: ${Object.keys(PLAN_CONFIGS).join(', ')}`
      }, { status: 400, headers: corsHeaders });
    }

    const updateData = { plan, ...planConfig };

    // For free_trial: set trial_end_date to 7 days from now
    if (plan === 'free_trial') {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);
      updateData.trial_end_date = trialEnd.toISOString();
      updateData.trial_start_date = new Date().toISOString();
      updateData.trial_days_remaining = 7;
      updateData.status = 'trial';
    }

    const updated = await base44.asServiceRole.entities.Tenant.update(tenantId, updateData);

    return Response.json({
      success: true,
      tenantId,
      plan,
      applied_config: planConfig,
      updated_tenant: updated,
    }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});