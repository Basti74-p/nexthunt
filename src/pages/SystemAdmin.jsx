import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import AccessDenied from "@/components/ui/AccessDenied";
import PermissionsDebugView from "@/components/admin/PermissionsDebugView";
import { Building2, Users, LifeBuoy, TrendingUp, CheckCircle2, AlertCircle, Clock, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";

function StatCard({ icon: Icon, label, value, sub, color = "emerald" }) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    red: "bg-red-500/10 text-red-400",
    amber: "bg-amber-500/10 text-amber-400",
    blue: "bg-blue-500/10 text-blue-400",
  };
  return (
    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function SystemAdmin() {
  const { isPlatformAdmin } = useAuth();
  const [showDebugView, setShowDebugView] = useState(false);

  const { data: tenants = [] } = useQuery({
    queryKey: ["sa-tenants"],
    queryFn: () => base44.entities.Tenant.list("-created_date", 200),
    enabled: isPlatformAdmin,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["sa-tickets"],
    queryFn: () => base44.entities.SupportTicket.list("-created_date", 200),
    enabled: isPlatformAdmin,
  });

  if (!isPlatformAdmin) return <AccessDenied />;

  const active = tenants.filter(t => t.status === "active").length;
  const suspended = tenants.filter(t => t.status === "suspended").length;
  const openTickets = tickets.filter(t => t.status === "offen").length;
  const inProgress = tickets.filter(t => t.status === "in_bearbeitung").length;
  const resolved = tickets.filter(t => t.status === "geloest" || t.status === "geschlossen").length;

  const planBreakdown = ["starter", "pro", "enterprise"].map(p => ({
    plan: p,
    count: tenants.filter(t => t.plan === p).length,
  }));

  const recentTenants = [...tenants].slice(0, 5);
  const recentTickets = [...tickets].slice(0, 5);

  return (
    <AdminLayout currentPage="SystemAdmin">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">System-Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Plattform-Übersicht NextHunt</p>
          </div>
          <Button
            onClick={() => setShowDebugView(!showDebugView)}
            variant={showDebugView ? "default" : "outline"}
            className={showDebugView ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-600 text-slate-300 hover:bg-slate-800"}
          >
            <Bug className="w-4 h-4 mr-2" />
            {showDebugView ? "Dashboard anzeigen" : "Debug View"}
          </Button>
        </div>

        {showDebugView ? (
          <PermissionsDebugView />
        ) : (
          <>
        

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Kunden gesamt" value={tenants.length} color="emerald" />
          <StatCard icon={CheckCircle2} label="Aktiv" value={active} color="emerald" />
          <StatCard icon={AlertCircle} label="Gesperrt" value={suspended} color="red" />
          <StatCard icon={LifeBuoy} label="Offene Tickets" value={openTickets} sub={`${inProgress} in Bearbeitung`} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan breakdown */}
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Pakete</h2>
            <div className="space-y-3">
              {planBreakdown.map(({ plan, count }) => (
                <div key={plan} className="flex items-center gap-3">
                  <span className="text-sm text-slate-400 w-24 capitalize">{plan}</span>
                  <div className="flex-1 bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: tenants.length > 0 ? `${(count / tenants.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket summary */}
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Support-Tickets</h2>
            <div className="space-y-2">
              {[
                { label: "Offen", value: openTickets, color: "text-red-400" },
                { label: "In Bearbeitung", value: inProgress, color: "text-amber-400" },
                { label: "Gelöst / Geschlossen", value: resolved, color: "text-emerald-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className={`text-sm font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent tenants */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Zuletzt angelegte Kunden</h2>
          <div className="space-y-2">
            {recentTenants.map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b border-slate-700 last:border-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-bold">
                  {t.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.contact_email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {t.status === "active" ? "Aktiv" : "Gesperrt"}
                </span>
              </div>
            ))}
          </div>
        </div>
        </>
        )}
      </div>
    </AdminLayout>
  );
}