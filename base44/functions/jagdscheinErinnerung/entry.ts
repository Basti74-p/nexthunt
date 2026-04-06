import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only: called by scheduled automation
    const users = await base44.asServiceRole.entities.User.list();
    const today = new Date();
    const results = [];

    for (const user of users) {
      if (!user.jagdschein_gueltig_bis || !user.email) continue;

      const ablauf = new Date(user.jagdschein_gueltig_bis);
      const diffDays = Math.ceil((ablauf - today) / (1000 * 60 * 60 * 24));

      if (diffDays === 30 || diffDays === 7) {
        const emoji = diffDays === 30 ? "⚠️" : "🚨";
        const subject = `${emoji} Dein Jagdschein läuft in ${diffDays} Tagen ab!`;
        const body = `Hallo ${user.first_name || ''},\n\ndein Jagdschein (Nr. ${user.jagdschein_nummer || '–'}) läuft am ${new Date(user.jagdschein_gueltig_bis).toLocaleDateString('de-DE')} ab.\n\nBitte rechtzeitig verlängern!\n\nDein NextHunt Team`;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject,
          body,
          from_name: "NextHunt"
        });

        results.push({ email: user.email, days: diffDays });
      }
    }

    return Response.json({ sent: results.length, details: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});