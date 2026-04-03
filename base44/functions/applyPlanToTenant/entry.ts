import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const NAV_ALL_ON = {
  nav_dashboard: true, nav_karte: true, nav_reviere: true, nav_jagdeinrichtungen: true,
  nav_wildmanagement: true, nav_strecke: true, nav_abschussplan: true,
  nav_wildkammer: true, nav_wildprodukte: true, nav_wildverkauf: true, nav_strecke_archiv: true,
  nav_jagdkalender: true, nav_alle_jagden: true, nav_live_monitor: true,
  nav_jagdgaeste: true, nav_personal: true, nav_aufgaben: true,
  nav_personen: true, nav_berechtigungen: true, nav_oeffentlichkeit: true,
  nav_gesellschaftsjagd: true, nav_wolftrack: true,
};

export const PLAN_CONFIGS = {
  solo: {
    max_flaeche_ha: 800,
    max_mitglieder: 5,
    // nav_* flags — Solo: Karte, Einrichtungen, Sichtungen, Strecke Basic, Jagdkalender, Aufgaben
    nav_dashboard:        true,
    nav_karte:            true,
    nav_reviere:          true,
    nav_jagdeinrichtungen:true,
    nav_wildmanagement:   false,
    nav_strecke:          true,
    nav_abschussplan:     false,
    nav_wildkammer:       false,
    nav_wildprodukte:     false,
    nav_wildverkauf:      false,
    nav_strecke_archiv:   false,
    nav_jagdkalender:     true,
    nav_alle_jagden:      false,
    nav_live_monitor:     false,
    nav_jagdgaeste:       false,
    nav_personal:         false,
    nav_aufgaben:         true,
    nav_personen:         true,
    nav_berechtigungen:   true,
    nav_oeffentlichkeit:  false,
    nav_gesellschaftsjagd:false,
    nav_wolftrack:        false,
  },
  pro: {
    max_flaeche_ha: 3000,
    max_mitglieder: 15,
    nav_dashboard:        true,
    nav_karte:            true,
    nav_reviere:          true,
    nav_jagdeinrichtungen:true,
    nav_wildmanagement:   true,
    nav_strecke:          true,
    nav_abschussplan:     true,
    nav_wildkammer:       false,
    nav_wildprodukte:     false,
    nav_wildverkauf:      true,
    nav_strecke_archiv:   true,
    nav_jagdkalender:     true,
    nav_alle_jagden:      true,
    nav_live_monitor:     true,
    nav_jagdgaeste:       true,
    nav_personal:         true,
    nav_aufgaben:         true,
    nav_personen:         true,
    nav_berechtigungen:   true,
    nav_oeffentlichkeit:  false,
    nav_gesellschaftsjagd:false,
    nav_wolftrack:        false,
  },
  enterprise: {
    max_flaeche_ha: 5000,
    max_mitglieder: 50,
    ...NAV_ALL_ON,
  },
  free_trial: {
    max_flaeche_ha: 5000,
    max_mitglieder: 50,
    ...NAV_ALL_ON,
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