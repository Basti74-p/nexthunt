import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// CRM Webhook URL (aus der anderen Base44-App)
const CRM_WEBHOOK_URL = "https://api.base44.com/apps/{69c478dc8a6beacd9c36aad1}/functions/syncCustomersWebhook";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Nur für authentifizierte Benutzer
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Payload aus Entity Automation
    const { event, data, old_data } = await req.json();

    if (!data) {
      return Response.json({ error: 'No data provided' }, { status: 400 });
    }

    // Bestimme Event-Typ basierend auf event.type
    let eventType = 'update';
    if (event.type === 'create') {
      eventType = 'create';
    } else if (event.type === 'delete') {
      eventType = 'delete';
    }

    // Sende an CRM-Webhook
    const response = await fetch(CRM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        customer: {
          id: data.id,
          tenant_id: data.tenant_id,
          name: data.name,
          contact_person: data.contact_person,
          email: data.email,
          phone: data.phone,
          address: data.address,
          type: data.type,
          notes: data.notes,
          created_by: data.created_by,
          created_date: data.created_date,
          updated_date: data.updated_date
        }
      })
    });

    if (!response.ok) {
      throw new Error(`CRM-Webhook failed: ${response.status}`);
    }

    return Response.json({ success: true, event_type: eventType });
  } catch (error) {
    console.error('Error syncing to CRM:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});