import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SOLO_CONFIG = {
  plan: "solo",
  max_flaeche_ha: 800,
  feature_dashboard: false,
  feature_reviere: true,
  feature_map: true,
  feature_sightings: true,
  feature_strecke: true,
  feature_wildkammer: false,
  feature_kalender: true,
  feature_tasks: false,
  feature_personen: false,
  feature_driven_hunt: false,
  feature_einrichtungen: false,
  feature_public_portal: false,
  feature_wildmarken: false,
  feature_wolftrack: false,
  feature_schadensprotokoll: false,
  status: "active",
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Allow both scheduled (no user) and admin-triggered calls
    if (user && user.role !== 'admin' && user.role !== 'platform_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const tenants = await base44.asServiceRole.entities.Tenant.list();
    const trialTenants = tenants.filter(t => t.status === 'trial' && t.trial_end_date);

    let downgraded = 0;
    const results = [];

    for (const tenant of trialTenants) {
      const trialEnd = new Date(tenant.trial_end_date);
      if (trialEnd < now) {
        // Downgrade to solo
        await base44.asServiceRole.entities.Tenant.update(tenant.id, SOLO_CONFIG);

        // Send notification email
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: tenant.contact_email,
            subject: "Dein NextHunt-Testzeitraum ist abgelaufen",
            body: `Hallo ${tenant.contact_person || tenant.name},\n\ndein 7-tägiger Testzeitraum bei NextHunt ist abgelaufen. Dein Konto wurde auf das Solo-Paket zurückgesetzt.\n\nJetzt Paket wählen und alle Features freischalten:\nhttps://app.nexthunt.de/PaketePreise\n\nViele Grüße,\nDas NextHunt-Team`,
          });
        } catch (emailErr) {
          console.error('Email failed for', tenant.contact_email, emailErr.message);
        }

        downgraded++;
        results.push({ id: tenant.id, name: tenant.name, action: 'downgraded_to_solo' });
      }
    }

    return Response.json({
      success: true,
      checked: trialTenants.length,
      downgraded,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});