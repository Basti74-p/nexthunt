import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import AccessDenied from "@/components/ui/AccessDenied";
import { AlertCircle, RefreshCw, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SystemAdminDebug() {
  const { isPlatformAdmin } = useAuth();
  const [fixing, setFixing] = useState(false);
  const [fixed, setFixed] = useState([]);

  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ["sa-debug-users"],
    queryFn: () => base44.entities.User.list(undefined, 200),
    enabled: isPlatformAdmin,
  });

  const { data: tenantMembers = [] } = useQuery({
    queryKey: ["sa-debug-members"],
    queryFn: () => base44.entities.TenantMember.list(undefined, 500),
    enabled: isPlatformAdmin,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["sa-debug-tenants"],
    queryFn: () => base44.entities.Tenant.list(undefined, 200),
    enabled: isPlatformAdmin,
  });

  if (!isPlatformAdmin) return <AccessDenied />;

  // Find users without TenantMembers
  const memberEmails = new Set(tenantMembers.map(m => m.user_email));
  const orphanedUsers = users.filter(u => !memberEmails.has(u.email) && !u.tenant_id);

  const fixOrphanedUser = async (user) => {
    try {
      setFixing(true);

      // Check if they already have a tenant
      const existingTenants = tenants.filter(t => t.contact_email === user.email);
      
      let tenant;
      if (existingTenants.length > 0) {
        // Use existing tenant
        tenant = existingTenants[0];
      } else {
        // Create new tenant
        const now = new Date();
        const trialEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        tenant = await base44.entities.Tenant.create({
          name: `${user.full_name}'s Revier`,
          contact_person: user.full_name,
          contact_email: user.email,
          status: 'trial',
          plan: 'free_trial',
          trial_start_date: now.toISOString(),
          trial_end_date: trialEndDate.toISOString(),
          trial_days_remaining: 30,
          feature_map: true,
          feature_sightings: true,
          feature_strecke: true,
          feature_wildkammer: true,
          feature_tasks: true,
          feature_driven_hunt: true,
          feature_public_portal: true,
          feature_wildmarken: true,
          feature_dashboard: true,
          feature_reviere: true,
          feature_kalender: true,
          feature_personen: true,
          feature_einrichtungen: true
        });
      }

      // Create TenantMember
      await base44.entities.TenantMember.create({
        tenant_id: tenant.id,
        user_email: user.email,
        first_name: user.full_name?.split(' ')[0] || 'User',
        last_name: user.full_name?.split(' ').slice(1).join(' ') || 'User',
        role: 'tenant_owner',
        status: 'active',
        perm_wildmanagement: true,
        perm_strecke: true,
        perm_wildkammer: true,
        perm_kalender: true,
        perm_aufgaben: true,
        perm_personen: true,
        perm_oeffentlichkeit: true,
        perm_einrichtungen: true
      });

      setFixed([...fixed, user.email]);
      refetchUsers();
    } catch (error) {
      console.error('Error fixing user:', error);
      alert(`Fehler bei ${user.email}: ${error.message}`);
    } finally {
      setFixing(false);
    }
  };

  const deleteUserCompletely = async (email) => {
    if (!window.confirm(`Benutzer ${email} und ALLE zugehörigen Daten wirklich löschen?`)) {
      return;
    }

    try {
      setFixing(true);
      const res = await base44.functions.invoke('deleteUserCompletely', { email });
      alert(`✓ Benutzer gelöscht\nTenantMembers: ${res.data.deleted.members}\nTenants: ${res.data.deleted.tenants}`);
      refetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Fehler: ${error.message}`);
    } finally {
      setFixing(false);
    }
  };

  return (
    <AdminLayout currentPage="SystemAdmin">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Debug: Verwaiste Benutzer</h1>
          <p className="text-slate-400 text-sm mt-1">Benutzer ohne TenantMember-Einträge reparieren</p>
        </div>

        {orphanedUsers.length === 0 ? (
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-medium">Alle Benutzer haben TenantMembers!</p>
            <p className="text-slate-400 text-sm mt-1">Keine Reparaturen erforderlich</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-100">{orphanedUsers.length} verwaiste Benutzer gefunden</p>
                <p className="text-xs text-amber-200 mt-1">Diese Benutzer haben keine zugeordnete Tenant/TenantMember</p>
              </div>
            </div>

            <div className="space-y-2">
              {orphanedUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">{user.full_name}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                  {fixed.includes(user.email) ? (
                    <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                      ✓ Repariert
                    </span>
                  ) : (
                    <Button
                      onClick={() => fixOrphanedUser(user)}
                      disabled={fixing}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Reparieren
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Statistiken</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400">Gesamtbenutzer</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">TenantMembers</p>
              <p className="text-2xl font-bold text-white">{tenantMembers.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Tenants</p>
              <p className="text-2xl font-bold text-white">{tenants.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Verwaist</p>
              <p className="text-2xl font-bold text-amber-400">{orphanedUsers.length}</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}