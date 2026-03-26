import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    const mainApiKey = Deno.env.get('NEXTHUNT_API_KEY');
    const nextHuntOSKey = Deno.env.get('NextHuntOS');

    const isAuthorized = authHeader === `Bearer ${mainApiKey}` || authHeader === `Bearer ${nextHuntOSKey}`;

    if (!isAuthorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event_type, customer } = payload;

    if (!customer || !event_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const contactData = {
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email,
      phone: customer.phone || '',
      company: customer.company || '',
      notes: customer.notes || '',
    };

    if (event_type === 'create') {
      await base44.asServiceRole.entities.Contact.create(contactData);
    } else if (event_type === 'update') {
      const existing = await base44.asServiceRole.entities.Contact.filter({ email: customer.email });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Contact.update(existing[0].id, contactData);
      } else {
        await base44.asServiceRole.entities.Contact.create(contactData);
      }
    } else if (event_type === 'delete') {
      const existing = await base44.asServiceRole.entities.Contact.filter({ email: customer.email });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Contact.delete(existing[0].id);
      }
    }

    return Response.json({ success: true, message: `Customer ${event_type}d` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});