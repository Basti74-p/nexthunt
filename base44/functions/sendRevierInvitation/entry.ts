import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { user_email, first_name, revier_name, tenant_name } = body;

    if (!user_email || !revier_name || !tenant_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const invitationLink = `${new URL(req.url).origin}/login`;

    const emailBody = `
Hallo ${first_name || 'there'},

Sie wurden eingeladen, dem Revier "${revier_name}" in NextHunt beizutreten!

Tenant: ${tenant_name}

Klicken Sie hier um zur Anwendung zu gehen:
${invitationLink}

Mit freundlichen Grüßen,
NextHunt Team
    `.trim();

    await base44.integrations.Core.SendEmail({
      to: user_email,
      subject: `Einladung: ${revier_name} in ${tenant_name}`,
      body: emailBody,
      from_name: 'NextHunt',
    });

    return Response.json({ success: true, message: 'Invitation email sent' });
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});