import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== Deno.env.get('NEXTHUNT_MOBILE_KEY')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { tenant_id, action } = body;

    if (!tenant_id) {
      return Response.json({ error: 'tenant_id required' }, { status: 400, headers: corsHeaders });
    }

    // list_members: TenantMembers (registrierte Nutzer)
    if (action === 'list_members') {
      const members = await base44.asServiceRole.entities.TenantMember.filter({ tenant_id });
      return Response.json({
        success: true,
        count: members.length,
        members,
        sync_timestamp: new Date().toISOString()
      }, { headers: corsHeaders });
    }

    // list_persons: Gäste & externe Personen
    if (action === 'list_persons') {
      const persons = await base44.asServiceRole.entities.Person.filter({ tenant_id });
      return Response.json({
        success: true,
        count: persons.length,
        persons,
        sync_timestamp: new Date().toISOString()
      }, { headers: corsHeaders });
    }

    // list_all: beides zusammen
    if (!action || action === 'list_all') {
      const [members, persons] = await Promise.all([
        base44.asServiceRole.entities.TenantMember.filter({ tenant_id }),
        base44.asServiceRole.entities.Person.filter({ tenant_id }),
      ]);
      return Response.json({
        success: true,
        members,
        persons,
        sync_timestamp: new Date().toISOString()
      }, { headers: corsHeaders });
    }

    return Response.json({ error: 'Unknown action. Use: list_members, list_persons, list_all' }, { status: 400, headers: corsHeaders });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});