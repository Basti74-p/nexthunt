import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Plus, Pencil, Building2, Search } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

const FEATURES = [
  { key: "feature_map", label: "Karte" },
  { key: "feature_sightings", label: "Sichtungen" },
  { key: "feature_strecke", label: "Strecke" },
  { key: "feature_wildkammer", label: "Wildkammer" },
  { key: "feature_tasks", label: "Aufgaben" },
  { key: "feature_driven_hunt", label: "Gesellschaftsjagd" },
  { key: "feature_public_portal", label: "Öffentliches Portal" },
  { key: "feature_wildmarken", label: "Wildmarken" },
];

export default function PlatformAdmin() {
  const { isPlatformAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["all-tenants"],
    queryFn: () => base44.entities.Tenant.list("-created_date", 100),
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editingTenant?.id
        ? base44.entities.Tenant.update(editingTenant.id, data)
        : base44.entities.Tenant.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tenants"] });
      setDialogOpen(false);
      setEditingTenant(null);
    },
  });

  if (!isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Shield className="w-12 h-12 text-red-300 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Zugriff verweigert</h2>
          <p className="text-sm text-gray-500">Nur Plattform-Administratoren haben Zugriff.</p>
        </div>
      </div>
    );
  }

  const filtered = tenants.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.contact_email?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditingTenant({
      name: "", contact_person: "", contact_email: "", phone: "", address: "",
      status: "active", plan: "starter",
      feature_map: true, feature_sightings: true, feature_strecke: true,
      feature_wildkammer: false, feature_tasks: true, feature_driven_hunt: false,
      feature_public_portal: false, feature_wildmarken: false,
    });
    setDialogOpen(true);
  };

  const openEdit = (t) => {
    setEditingTenant({ ...t });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const { id, created_date, updated_date, created_by, ...data } = editingTenant;
    saveMutation.mutate(data);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Plattform-Administration"
        subtitle="Mandanten und Lizenzen verwalten"
        actions={
          <Button onClick={openNew} className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Neuer Mandant
          </Button>
        }
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Mandanten suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white rounded-xl border-gray-200"
        />
      </div>

      {/* Tenants list */}
      <div className="space-y-3">
        {filtered.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:border-gray-200 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-[#0F2F23]/5 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#0F2F23]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{t.name}</h3>
                <StatusBadge status={t.status} />
                <StatusBadge status={t.plan} />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{t.contact_email} {t.contact_person ? `• ${t.contact_person}` : ""}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => openEdit(t)} className="rounded-xl">
              <Pencil className="w-4 h-4 text-gray-400" />
            </Button>
          </div>
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">Keine Mandanten gefunden.</div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTenant?.id ? "Mandant bearbeiten" : "Neuer Mandant"}</DialogTitle>
          </DialogHeader>
          {editingTenant && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input value={editingTenant.name} onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })} />
                </div>
                <div>
                  <Label>Kontaktperson</Label>
                  <Input value={editingTenant.contact_person || ""} onChange={(e) => setEditingTenant({ ...editingTenant, contact_person: e.target.value })} />
                </div>
                <div>
                  <Label>E-Mail *</Label>
                  <Input value={editingTenant.contact_email} onChange={(e) => setEditingTenant({ ...editingTenant, contact_email: e.target.value })} />
                </div>
                <div>
                  <Label>Telefon</Label>
                  <Input value={editingTenant.phone || ""} onChange={(e) => setEditingTenant({ ...editingTenant, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Adresse</Label>
                <Input value={editingTenant.address || ""} onChange={(e) => setEditingTenant({ ...editingTenant, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={editingTenant.status} onValueChange={(v) => setEditingTenant({ ...editingTenant, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="suspended">Gesperrt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Plan</Label>
                  <Select value={editingTenant.plan} onValueChange={(v) => setEditingTenant({ ...editingTenant, plan: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="mb-3 block">Feature-Flags</Label>
                <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                  {FEATURES.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{label}</span>
                      <Switch
                        checked={editingTenant[key] === true}
                        onCheckedChange={(v) => setEditingTenant({ ...editingTenant, [key]: v })}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] rounded-xl">
                {saveMutation.isPending ? "Speichern..." : "Speichern"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}