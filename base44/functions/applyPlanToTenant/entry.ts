import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const ENTERPRISE_FEATURES = {
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
};

export const PLAN_CONFIGS = {
  solo: {
    max_flaeche_ha: 800,
    max_mitglieder: 5,
    feature_map: true,
    feature_einrichtungen: true,
    feature_kalender: true,
    feature_sightings: true,
    feature_strecke: true,
    feature_reviere: true,
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
    addon_wildmanagement: false,
    addon_oeffentlichkeit: false,
    addon_kameras: false,
    addon_wildkammer: false,
  },
  pro: {
    max_flaeche_ha: 3000,
    max_mitglieder: 15,
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
    feature_wildkammer: false,
    feature_driven_hunt: false,
    feature_public_portal: false,
    feature_wolftrack: false,
    feature_gesellschaftsjagd: false,
    feature_schadensprotokoll: false,
    feature_wildmanagement: false,
    feature_oeffentlichkeit: false,
    feature_kameras: false,
    addon_wildmanagement: false,
    addon_oeffentlichkeit: false,
    addon_kameras: false,
    addon_wildkammer: false,
  },
  enterprise: {
    max_flaeche_ha: 5000,
    max_mitglieder: 50,
    ...ENTERPRISE_FEATURES,
  },
  free_trial: {
    max_flaeche_ha: 5000,
    max_mitglieder: 50,
    ...ENTERPRISE_FEATURES,
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