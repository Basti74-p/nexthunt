import React, { useState } from "react";
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
import { Building2, Plus, Pencil, Search, Users, LifeBuoy, UserPlus, Clock } from "lucide-react";

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
];

const PLAN_COLORS = {
  starter: "bg-slate-700 text-slate-300",
  pro: "bg-blue-500/20 text-blue-300",
  enterprise: "bg-purple-500/20 text-purple-300",
};

const STATUS_COLORS = {
  active: "bg-emerald-500/20 text-emerald-300",
  suspended: "bg-red-500/20 text-red-300",
};

export default function SystemAdminTenants() {
  const { isPlatformAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState("tenants");
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

  const { data: members = [] } = useQuery({
    queryKey: ["sa-members"],
    queryFn: () => base44.entities.TenantMember.list("-created_date", 500),
    enabled: isPlatformAdmin,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["sa-all-users"],
    queryFn: () => base44.entities.User.list("-created_date", 500),
    enabled: isPlatformAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editing?.id
        ? base44.entities.Tenant.update(editing.id, data)
        : base44.entities.Tenant.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sa-tenants"] });
      setDialogOpen(false);
      setEditing(null);
    },
  });

  if (!isPlatformAdmin) return <AccessDenied />;

  // Users without any tenant association
  const tenantEmails = new Set([
    ...tenants.map(t => t.contact_email).filter(Boolean),
    ...members.map(m => m.user_email).filter(Boolean),
  ]);
  const usersWithoutTenant = allUsers.filter(u => !tenantEmails.has(u.email) && u.role !== "admin" && u.role !== "platform_admin");

  const filtered = tenants.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.contact_email?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditing({
      name: "", contact_person: "", contact_email: "", phone: "", address: "",
      status: "active", plan: "starter",
      feature_dashboard: true, feature_reviere: true, feature_map: true, feature_sightings: true, feature_strecke: true,
      feature_wildkammer: false, feature_kalender: true, feature_tasks: true, feature_personen: true,
      feature_driven_hunt: false, feature_einrichtungen: true, feature_public_portal: false, feature_wildmarken: false,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const { id, created_date, updated_date, created_by, ...data } = editing;
    saveMutation.mutate(data);
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
                        {t.status === "active" ? "Aktiv" : "Gesperrt"}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PLAN_COLORS[t.plan] || "bg-slate-700 text-slate-300"}`}>
                        {t.plan}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t.contact_email}{t.contact_person ? ` • ${t.contact_person}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{memberCount}</span>
                    {openTickets > 0 && (
                      <span className="flex items-center gap-1 text-amber-400"><LifeBuoy className="w-3.5 h-3.5" />{openTickets}</span>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => { setEditing({ ...t }); setDialogOpen(true); }} className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Feature flags preview */}
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
      </div>

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
                      <SelectItem value="active" className="text-white">Aktiv</SelectItem>
                      <SelectItem value="suspended" className="text-white">Gesperrt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Paket</Label>
                  <Select value={editing.plan} onValueChange={(v) => setEditing({ ...editing, plan: v })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="starter" className="text-white">Starter</SelectItem>
                      <SelectItem value="pro" className="text-white">Pro</SelectItem>
                      <SelectItem value="enterprise" className="text-white">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-slate-300 mb-3 block">Module / Features</Label>
                <div className="space-y-3 bg-slate-800 rounded-xl p-4 border border-slate-700">
                  {FEATURES.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{label}</span>
                      <Switch
                        checked={editing[key] === true}
                        onCheckedChange={(v) => setEditing({ ...editing, [key]: v })}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
                {saveMutation.isPending ? "Speichern..." : "Speichern"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}