import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

const PLAN_CONFIGS = {
  solo: {
    max_flaeche_ha: 800,
    max_mitglieder: 5,
    nav_dashboard: true, nav_karte: true, nav_reviere: true, nav_jagdeinrichtungen: true,
    nav_wildmanagement: false, nav_strecke: true, nav_abschussplan: false,
    nav_wildkammer: false, nav_wildprodukte: false, nav_wildverkauf: false,
    nav_strecke_archiv: false, nav_jagdkalender: true, nav_alle_jagden: false,
    nav_live_monitor: false, nav_jagdgaeste: false, nav_personal: false,
    nav_aufgaben: true, nav_personen: false, nav_berechtigungen: false,
    nav_oeffentlichkeit: false, nav_gesellschaftsjagd: false, nav_wolftrack: false,
  },
  pro: {
    max_flaeche_ha: 3000,
    max_mitglieder: 15,
    nav_dashboard: true, nav_karte: true, nav_reviere: true, nav_jagdeinrichtungen: true,
    nav_wildmanagement: true, nav_strecke: true, nav_abschussplan: true,
    nav_wildkammer: false, nav_wildprodukte: false, nav_wildverkauf: true,
    nav_strecke_archiv: true, nav_jagdkalender: true, nav_alle_jagden: true,
    nav_live_monitor: true, nav_jagdgaeste: true, nav_personal: true,
    nav_aufgaben: true, nav_personen: true, nav_berechtigungen: true,
    nav_oeffentlichkeit: false, nav_gesellschaftsjagd: false, nav_wolftrack: false,
  },
  enterprise: {
    max_flaeche_ha: 5000,
    max_mitglieder: 50,
    nav_dashboard: true, nav_karte: true, nav_reviere: true, nav_jagdeinrichtungen: true,
    nav_wildmanagement: true, nav_strecke: true, nav_abschussplan: true,
    nav_wildkammer: true, nav_wildprodukte: true, nav_wildverkauf: true,
    nav_strecke_archiv: true, nav_jagdkalender: true, nav_alle_jagden: true,
    nav_live_monitor: true, nav_jagdgaeste: true, nav_personal: true,
    nav_aufgaben: true, nav_personen: true, nav_berechtigungen: true,
    nav_oeffentlichkeit: true, nav_gesellschaftsjagd: true, nav_wolftrack: true,
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // API Key auth
  const apiKey = req.headers.get('x-api-key');
  const validKey = Deno.env.get('NEXTHUNT_API_KEY');
  if (!apiKey || apiKey !== validKey) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action, email, plan, expires_at, product_id, price, currency, store } = body;

    if (!action || !email) {
      return Response.json({ error: 'action and email are required' }, { status: 400, headers: corsHeaders });
    }

    // Find tenant by contact_email
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ contact_email: email });
    const tenant = tenants[0];

    // --- GET STATUS ---
    if (action === 'get_status') {
      if (!tenant) {
        return Response.json({
          plan: 'solo',
          addons: [],
          expires_at: null,
          status: 'active',
        }, { headers: corsHeaders });
      }
      return Response.json({
        plan: tenant.plan || 'solo',
        addons: tenant.addons || [],
        expires_at: tenant.plan_expires_at || null,
        status: tenant.plan_status || 'active',
      }, { headers: corsHeaders });
    }

    if (!tenant) {
      return Response.json({ error: `No tenant found for email: ${email}` }, { status: 404, headers: corsHeaders });
    }

    const now = new Date().toISOString();
    let updateData = { plan_updated_at: now };

    if (action === 'activate' || action === 'change_plan') {
      const planConfig = PLAN_CONFIGS[plan] || PLAN_CONFIGS['solo'];
      updateData = {
        ...updateData,
        ...planConfig,
        plan: plan || 'solo',
        plan_status: 'active',
        plan_expires_at: expires_at || null,
        plan_product_id: product_id || null,
        plan_store: store || 'APP_STORE',
        plan_price: price || null,
        plan_currency: currency || 'EUR',
        status: 'active',
      };

    } else if (action === 'renew') {
      updateData = {
        ...updateData,
        plan_expires_at: expires_at,
        plan_status: 'active',
        status: 'active',
      };

    } else if (action === 'cancel') {
      updateData = {
        ...updateData,
        plan_status: 'cancelled',
        plan_expires_at: expires_at || null,
        // Plan stays active until expires_at — no nav changes yet
      };

    } else if (action === 'expire') {
      const soloConfig = PLAN_CONFIGS['solo'];
      updateData = {
        ...updateData,
        ...soloConfig,
        plan: 'solo',
        plan_status: 'expired',
        plan_expires_at: null,
        plan_store: tenant.plan_store || 'manual',
        status: 'active',
      };

    } else if (action === 'billing_issue') {
      updateData = {
        ...updateData,
        plan_status: 'billing_issue',
      };
      // Optional: send email notification
      base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: 'NextHunt – Zahlungsproblem bei deinem Abo',
        body: `Hallo,\n\nes gibt ein Problem mit deiner Zahlung für das NextHunt ${plan?.toUpperCase()}-Paket. Bitte überprüfe deine Zahlungsmethode im App Store.\n\nDas NextHunt-Team`,
      }).catch(() => {});

    } else {
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400, headers: corsHeaders });
    }

    await base44.asServiceRole.entities.Tenant.update(tenant.id, updateData);

    return Response.json({
      success: true,
      action,
      tenant_id: tenant.id,
      plan: updateData.plan || tenant.plan,
      plan_status: updateData.plan_status,
    }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});