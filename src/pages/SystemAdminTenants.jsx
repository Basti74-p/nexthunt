import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import AccessDenied from "@/components/ui/AccessDenied";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Plus, Pencil, Search, Users, LifeBuoy, UserPlus, Clock, Trash2, AlertTriangle, CheckCircle, XCircle, Info, RefreshCw } from "lucide-react";

const FEATURES = [
  { key: "feature_dashboard", label: "Dashboard" },
  { key: "feature_reviere", label: "Reviere" },
  { key: "feature_map", label: "Karte" },
  { key: "feature_sightings", label: "Sichtungen / Wildmanagement" },
  { key: "feature_strecke", label: "Strecke" },
  { key: "feature_wildkammer", label: "Wildkammer" },
  { key: "feature_kalender", label: "Jagdkalender" },
  { key: "feature_tasks", label: "Aufgaben" },
  { key: "feature_personen", label: "Personen" },
  { key: "feature_driven_hunt", label: "Gesellschaftsjagd" },
  { key: "feature_einrichtungen", label: "Jagdeinrichtungen" },
  { key: "feature_public_portal", label: "Öffentliches Portal" },
  { key: "feature_wildmarken", label: "Wildmarken" },
  { key: "feature_wolftrack", label: "WolfTrack" },
  { key: "feature_schadensprotokoll", label: "Schadensprotokoll" },
];

// Plan → feature defaults
const PLAN_CONFIGS = {
  solo: {
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
  },
  pro: {
    max_flaeche_ha: 3000,
    feature_dashboard: true,
    feature_reviere: true,
    feature_map: true,
    feature_sightings: true,
    feature_strecke: true,
    feature_wildkammer: false,
    feature_kalender: true,
    feature_tasks: true,
    feature_personen: true,
    feature_driven_hunt: false,
    feature_einrichtungen: true,
    feature_public_portal: false,
    feature_wildmarken: true,
    feature_wolftrack: false,
    feature_schadensprotokoll: false,
  },
  enterprise: {
    max_flaeche_ha: 5000,
    feature_dashboard: true,
    feature_reviere: true,
    feature_map: true,
    feature_sightings: true,
    feature_strecke: true,
    feature_wildkammer: true,
    feature_kalender: true,
    feature_tasks: true,
    feature_personen: true,
    feature_driven_hunt: true,
    feature_einrichtungen: true,
    feature_public_portal: true,
    feature_wildmarken: true,
    feature_wolftrack: true,
    feature_schadensprotokoll: true,
  },
  free_trial: {
    max_flaeche_ha: 5000,
    feature_dashboard: true,
    feature_reviere: true,
    feature_map: true,
    feature_sightings: true,
    feature_strecke: true,
    feature_wildkammer: true,
    feature_kalender: true,
    feature_tasks: true,
    feature_personen: true,
    feature_driven_hunt: true,
    feature_einrichtungen: true,
    feature_public_portal: true,
    feature_wildmarken: true,
    feature_wolftrack: true,
    feature_schadensprotokoll: true,
  },
};

const PLAN_COLORS = {
  solo: "bg-slate-700 text-slate-300",
  starter: "bg-slate-700 text-slate-300",
  pro: "bg-blue-500/20 text-blue-300",
  enterprise: "bg-purple-500/20 text-purple-300",
  free_trial: "bg-amber-500/20 text-amber-300",
};

const STATUS_COLORS = {
  active: "bg-emerald-500/20 text-emerald-300",
  trial: "bg-amber-500/20 text-amber-300",
  suspended: "bg-red-500/20 text-red-300",
  expired: "bg-red-500/20 text-red-300",
};

const STATUS_LABELS = {
  active: "Aktiv",
  trial: "Testphase",
  suspended: "Gesperrt",
  expired: "Abgelaufen",
};

function getTrialDaysRemaining(tenant) {
  if (!tenant.trial_end_date) return null;
  const diff = Math.ceil((new Date(tenant.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

function AreaBar({ used, max }) {
  if (!max || max === 0) return null;
  const usedVal = used || 0;
  if (usedVal === 0) {
    return (
      <p className="text-[10px] text-slate-500 mt-1.5">Noch keine Flächen eingezeichnet</p>
    );
  }
  const pct = Math.min(100, (usedVal / max) * 100);
  const isRed = pct >= 100;
  const isYellow = pct >= 80 && pct < 100;
  const barColor = isRed ? "bg-red-500" : isYellow ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="mt-1.5">
      <div className="flex justify-between text-[10px] mb-1">
        {isRed ? (
          <span className="text-red-400 font-medium">🔴 Limit erreicht — {usedVal.toFixed(0)} ha / {max.toLocaleString("de-DE")} ha</span>
        ) : isYellow ? (
          <span className="text-amber-400">⚠️ {usedVal.toFixed(0)} ha von {max.toLocaleString("de-DE")} ha</span>
        ) : (
          <span className="text-slate-500">{usedVal.toFixed(0)} ha / {max.toLocaleString("de-DE")} ha</span>
        )}
        <span className={isRed ? "text-red-400" : isYellow ? "text-amber-400" : "text-slate-500"}>{pct.toFixed(0)}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SystemAdminTenants() {
  const { isPlatformAdmin, user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin" || user?.role === "platform_admin";
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState("tenants");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activateConfirm, setActivateConfirm] = useState(null);
  const [activatePlan, setActivatePlan] = useState("pro");
  const [actionLoading, setActionLoading] = useState(false);
  const qc = useQueryClient();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["sa-tenants"],
    queryFn: () => base44.entities.Tenant.list("-created_date", 200),
    enabled: isPlatformAdmin,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["sa-tickets"],
    queryFn: () => base44.entities.SupportTicket.list("-created_date", 500),
    enabled: isPlatformAdmin,
  });

  const { data: members = [], refetch: refetchMembers } = useQuery({
    queryKey: ["sa-members"],
    queryFn: () => base44.entities.TenantMember.list("-created_date", 500),
    enabled: isPlatformAdmin,
  });

  const { data: allUsers = [], refetch: refetchUsers } = useQuery({
    queryKey: ["sa-all-users"],
    queryFn: () => base44.entities.User.list("-created_date", 500),
    enabled: isPlatformAdmin,
  });

  // Auto-downgrade expired trials (run once per tenant ID, not on every render)
  const processedTrials = useRef(new Set());
  const expiredTrials = tenants.filter(t =>
    t.status === "trial" && t.trial_end_date && new Date(t.trial_end_date) < new Date()
  );
  useEffect(() => {
    const unprocessed = expiredTrials.filter(t => !processedTrials.current.has(t.id));
    if (unprocessed.length === 0) return;
    unprocessed.forEach(t => processedTrials.current.add(t.id));
    const soloConfig = { ...PLAN_CONFIGS["solo"], plan: "solo", status: "active" };
    Promise.all(unprocessed.map(async (t) => {
      await base44.entities.Tenant.update(t.id, soloConfig);
      base44.integrations.Core.SendEmail({
        to: t.contact_email,
        subject: "Dein NextHunt-Testzeitraum ist abgelaufen",
        body: `Hallo ${t.contact_person || t.name},\n\nDein 7-tägiger Testzeitraum ist abgelaufen. Wähle jetzt dein Paket um NextHunt weiter zu nutzen:\nhttps://app.nexthunt-portal.de/PaketePreise\n\nDas NextHunt-Team`,
      }).catch(() => {});
    })).then(() => qc.invalidateQueries({ queryKey: ["sa-tenants"] }));
  }, [expiredTrials.map(t => t.id).join(",")]);

  // Manual plan re-sync: fix a tenant whose features don't match their plan
  const handleResyncPlan = async (t) => {
    const config = PLAN_CONFIGS[t.plan];
    if (!config) return;
    await base44.entities.Tenant.update(t.id, { ...config, plan: t.plan });
    qc.invalidateQueries({ queryKey: ["sa-tenants"] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Tenant.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sa-tenants"] });
      setDeleteConfirm(null);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editing?.id) {
        return base44.entities.Tenant.update(editing.id, data);
      } else {
        const newTenant = await base44.entities.Tenant.create(data);
        if (data.contact_email) {
          await base44.entities.TenantMember.create({
            tenant_id: newTenant.id,
            user_email: data.contact_email,
            first_name: data.contact_person || data.name || "",
            last_name: "",
            role: "tenant_owner",
            status: "active",
            perm_wildmanagement: true,
            perm_strecke: true,
            perm_wildkammer: true,
            perm_kalender: true,
            perm_aufgaben: true,
            perm_personen: true,
            perm_oeffentlichkeit: true,
            perm_einrichtungen: true,
          });
        }
        return newTenant;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sa-tenants"] });
      qc.invalidateQueries({ queryKey: ["sa-members"] });
      setDialogOpen(false);
      setEditing(null);
    },
  });

  if (!isPlatformAdmin) return <AccessDenied />;

  // Apply plan config to editing state
  const applyPlanConfig = (plan, current) => {
    const config = PLAN_CONFIGS[plan];
    if (!config) return current;
    return { ...current, plan, ...config };
  };

  const memberEmails = new Set(members.map(m => m.user_email).filter(Boolean));
  const usersWithoutTenant = allUsers.filter(u => !memberEmails.has(u.email) && u.role !== "admin" && u.role !== "platform_admin");

  const filtered = tenants.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.contact_email?.toLowerCase().includes(search.toLowerCase())
  );

  const defaultEditing = (overrides = {}) => ({
    name: "", contact_person: "", contact_email: "", phone: "", address: "",
    status: "active", plan: "pro",
    ...PLAN_CONFIGS["pro"],
    ...overrides,
  });

  const openNew = () => {
    setEditing(defaultEditing());
    setDialogOpen(true);
  };

  const handleSave = () => {
    const { id, created_date, updated_date, created_by, ...data } = editing;
    saveMutation.mutate(data);
  };

  const handleActivateUser = async (u) => {
    setActionLoading(true);
    try {
      const config = PLAN_CONFIGS[activatePlan] || PLAN_CONFIGS["pro"];
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);

      const newTenant = await base44.entities.Tenant.create({
        name: u.full_name || u.email,
        contact_email: u.email,
        contact_person: u.full_name || "",
        status: activatePlan === "free_trial" ? "trial" : "active",
        plan: activatePlan,
        ...config,
        ...(activatePlan === "free_trial" ? {
          trial_start_date: new Date().toISOString(),
          trial_end_date: trialEnd.toISOString(),
          trial_days_remaining: 7,
        } : {}),
      });

      await base44.entities.TenantMember.create({
        tenant_id: newTenant.id,
        user_email: u.email,
        first_name: u.full_name?.split(" ")[0] || "",
        last_name: u.full_name?.split(" ").slice(1).join(" ") || "",
        role: "tenant_owner",
        status: "active",
        perm_wildmanagement: true, perm_strecke: true, perm_wildkammer: true,
        perm_kalender: true, perm_aufgaben: true, perm_personen: true,
        perm_oeffentlichkeit: true, perm_einrichtungen: true,
      });

      // Welcome email
      await base44.integrations.Core.SendEmail({
        to: u.email,
        subject: "Willkommen bei NextHunt – Dein Zugang ist aktiviert!",
        body: `Hallo ${u.full_name || ""},\n\nWillkommen bei NextHunt! Dein Paket ${activatePlan.charAt(0).toUpperCase() + activatePlan.slice(1).replace("_", " ")} ist jetzt aktiv.\n\nDu kannst dich jetzt anmelden und loslegen: https://app.nexthunt-portal.de\n\nViel Erfolg auf der Jagd!\nDas NextHunt-Team`,
      });

      qc.invalidateQueries({ queryKey: ["sa-tenants"] });
      qc.invalidateQueries({ queryKey: ["sa-members"] });
      refetchUsers();
      refetchMembers();
      setActivateConfirm(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectUser = async (u) => {
    setActionLoading(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: u.email,
        subject: "Deine NextHunt-Registrierung",
        body: `Hallo ${u.full_name || ""},\n\nDeine Registrierung wurde leider nicht genehmigt. Bei Fragen melde dich unter info@nexthunt-portal.de\n\nDas NextHunt-Team`,
      });
      setActivateConfirm(null);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout currentPage="SystemAdminTenants">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Kunden</h1>
            <p className="text-slate-400 text-sm mt-1">{tenants.length} Mandant{tenants.length !== 1 ? "en" : ""}</p>
          </div>
          <Button onClick={openNew} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Neuer Kunde
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
          <button
            onClick={() => setActiveTab("tenants")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "tenants" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"}`}
          >
            <Building2 className="w-4 h-4" />
            Kunden ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "users" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"}`}
          >
            <UserPlus className="w-4 h-4" />
            Neue Registrierungen
            {usersWithoutTenant.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === "users" ? "bg-white/20 text-white" : "bg-amber-500/20 text-amber-400"}`}>
                {usersWithoutTenant.length}
              </span>
            )}
          </button>
        </div>

        {/* === Tab: Neue Registrierungen === */}
        {activeTab === "users" && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => { refetchUsers(); refetchMembers(); }} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Aktualisieren
              </Button>
            </div>
            {usersWithoutTenant.length === 0 ? (
              <div className="text-center py-16 text-slate-500">Keine neuen Registrierungen ohne Tenant.</div>
            ) : (
              usersWithoutTenant.map((u) => (
                <div key={u.id} className="bg-slate-800 rounded-2xl border border-slate-700 p-5 hover:border-slate-600 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold text-lg shrink-0">
                      {u.full_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white">{u.full_name || "Kein Name"}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Ausstehend
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                      {u.created_date && (
                        <p className="text-xs text-slate-600 mt-0.5">
                          Registriert: {new Date(u.created_date).toLocaleDateString("de-DE")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => { setActivateConfirm(u); setActivatePlan("pro"); }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl gap-1"
                      >
                        <CheckCircle className="w-4 h-4" /> Aktivieren
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRejectUser(u)}
                        className="text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl gap-1"
                      >
                        <XCircle className="w-4 h-4" /> Ablehnen
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* === Tab: Kunden === */}
        {activeTab === "tenants" && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Kunden suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl"
              />
            </div>
            <div className="space-y-3">
              {filtered.map((t) => {
                const memberCount = members.filter(m => m.tenant_id === t.id).length;
                const openTickets = tickets.filter(tk => tk.tenant_id === t.id && tk.status === "offen").length;
                const trialDays = getTrialDaysRemaining(t);
                const isTrialActive = t.status === "trial" && trialDays !== null && trialDays > 0;
                const isTrialExpired = t.status === "trial" && trialDays !== null && trialDays <= 0;
                const usedHa = t.gesamtflaeche_ha || 0;
                const maxHa = t.max_flaeche_ha;
                const areaPct = maxHa ? Math.min(100, (usedHa / maxHa) * 100) : 0;

                return (
                  <div key={t.id} className="bg-slate-800 rounded-2xl border border-slate-700 p-5 hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-lg shrink-0">
                        {t.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-white">{t.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status] || "bg-slate-700 text-slate-300"}`}>
                            {STATUS_LABELS[t.status] || t.status}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PLAN_COLORS[t.plan] || "bg-slate-700 text-slate-300"}`}>
                            {t.plan}
                          </span>
                          {isTrialActive && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-500/20 text-yellow-300 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Trial: {trialDays}d
                            </span>
                          )}
                          {isTrialExpired && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-500/20 text-red-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Trial abgelaufen
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t.contact_email}{t.contact_person ? ` • ${t.contact_person}` : ""}
                        </p>
                        {maxHa && <AreaBar used={usedHa} max={maxHa} />}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{memberCount}</span>
                        {openTickets > 0 && (
                          <span className="flex items-center gap-1 text-amber-400"><LifeBuoy className="w-3.5 h-3.5" />{openTickets}</span>
                        )}
                        {PLAN_CONFIGS[t.plan] && FEATURES.some(f => PLAN_CONFIGS[t.plan][f.key] !== undefined && t[f.key] !== PLAN_CONFIGS[t.plan][f.key]) && (
                          <Button variant="ghost" size="icon" onClick={() => handleResyncPlan(t)} title="Features mit Plan synchronisieren" className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl">
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => { setEditing({ ...t }); setDialogOpen(true); }} className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(t)} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {FEATURES.filter(f => t[f.key]).map(f => (
                        <span key={f.key} className="text-[10px] px-2 py-0.5 bg-slate-700 text-slate-400 rounded-full">{f.label}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
              {!isLoading && filtered.length === 0 && (
                <div className="text-center py-16 text-slate-500">Keine Kunden gefunden.</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* === Kunde bearbeiten / anlegen Dialog === */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{editing?.id ? "Kunde bearbeiten" : "Neuer Kunde"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300">Name *</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300">Kontaktperson</Label>
                  <Input value={editing.contact_person || ""} onChange={(e) => setEditing({ ...editing, contact_person: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300">E-Mail *</Label>
                  <Input value={editing.contact_email} onChange={(e) => setEditing({ ...editing, contact_email: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300">Telefon</Label>
                  <Input value={editing.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Adresse</Label>
                <Input value={editing.address || ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300">Status</Label>
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="trial" className="text-white">Testphase</SelectItem>
                      <SelectItem value="active" className="text-white">Aktiv</SelectItem>
                      <SelectItem value="suspended" className="text-white">Gesperrt</SelectItem>
                      <SelectItem value="expired" className="text-white">Abgelaufen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Paket</Label>
                  <Select
                    value={editing.plan}
                    onValueChange={(v) => setEditing(applyPlanConfig(v, editing))}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="solo" className="text-white">Solo</SelectItem>
                      <SelectItem value="pro" className="text-white">Pro</SelectItem>
                      <SelectItem value="enterprise" className="text-white">Enterprise</SelectItem>
                      <SelectItem value="free_trial" className="text-white">Free Trial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Flächenlimit Info */}
              {editing.max_flaeche_ha && (
                <div className="flex items-center justify-between text-xs bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    Flächenlimit: <span className="text-emerald-400 font-semibold">{editing.max_flaeche_ha.toLocaleString("de-DE")} ha</span>
                  </span>
                  <span className="text-slate-500">
                    Aktuell genutzt: <span className="text-slate-300 font-medium">{(editing.gesamtflaeche_ha || 0).toFixed(1)} ha</span>
                  </span>
                </div>
              )}

              {/* Trial */}
              <div>
                <Label className="text-slate-300 mb-3 block">Trial-Verwaltung</Label>
                <div className="space-y-3 bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Trial-Startdatum</label>
                    <Input
                      type="date"
                      value={editing.trial_start_date ? editing.trial_start_date.split('T')[0] : ""}
                      onChange={(e) => {
                        const startDate = e.target.value;
                        if (!startDate) { setEditing({ ...editing, trial_start_date: "", trial_end_date: "" }); return; }
                        const endDate = new Date(startDate);
                        endDate.setDate(endDate.getDate() + 7);
                        setEditing({
                          ...editing,
                          trial_start_date: new Date(startDate).toISOString(),
                          trial_end_date: endDate.toISOString(),
                        });
                      }}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Trial-Enddatum (auto: +7 Tage)</label>
                    <Input
                      type="date"
                      value={editing.trial_end_date ? editing.trial_end_date.split('T')[0] : ""}
                      onChange={(e) => setEditing({ ...editing, trial_end_date: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Toggles */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-slate-300">Module / Features</Label>
                  {!isSuperAdmin && (
                    <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">Automatisch durch Paket</span>
                  )}
                </div>
                <div className="space-y-3 bg-slate-800 rounded-xl p-4 border border-slate-700">
                  {FEATURES.map(({ key, label }) => (
                    <div key={key} className={`flex items-center justify-between ${!isSuperAdmin ? "opacity-60" : ""}`}>
                      <span className="text-sm text-slate-300">{label}</span>
                      <Switch
                        checked={editing[key] === true}
                        onCheckedChange={(v) => isSuperAdmin && setEditing({ ...editing, [key]: v })}
                        disabled={!isSuperAdmin}
                      />
                    </div>
                  ))}
                  {!isSuperAdmin && (
                    <p className="text-[11px] text-slate-500 pt-1 flex items-center gap-1">
                      <Info className="w-3 h-3" /> Nur Superadmin kann Features manuell überschreiben.
                    </p>
                  )}
                </div>
              </div>

              <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
                {saveMutation.isPending ? "Speichern..." : "Speichern"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* === Aktivieren Dialog === */}
      <Dialog open={!!activateConfirm} onOpenChange={() => setActivateConfirm(null)}>
        <DialogContent className="max-w-sm bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Nutzer aktivieren</DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 text-sm mt-2">
            Paket für <span className="text-white font-semibold">{activateConfirm?.full_name || activateConfirm?.email}</span> wählen:
          </p>
          <Select value={activatePlan} onValueChange={setActivatePlan}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-3"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="solo" className="text-white">Solo (800 ha)</SelectItem>
              <SelectItem value="pro" className="text-white">Pro (3.000 ha)</SelectItem>
              <SelectItem value="enterprise" className="text-white">Enterprise (5.000 ha)</SelectItem>
              <SelectItem value="free_trial" className="text-white">Free Trial (7 Tage)</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Eine Willkommens-E-Mail wird automatisch versendet.
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="ghost" onClick={() => setActivateConfirm(null)} className="flex-1 border border-slate-700 text-slate-300 hover:bg-slate-800">
              Abbrechen
            </Button>
            <Button
              onClick={() => handleActivateUser(activateConfirm)}
              disabled={actionLoading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {actionLoading ? "Aktivieren..." : "Aktivieren & E-Mail senden"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* === Löschen Dialog === */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Kunde löschen?</DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 text-sm mt-2">
            Möchten Sie <span className="text-white font-semibold">{deleteConfirm?.name}</span> wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="flex-1 border border-slate-700 text-slate-300 hover:bg-slate-800">
              Abbrechen
            </Button>
            <Button
              onClick={() => deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteMutation.isPending ? "Löschen..." : "Löschen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}