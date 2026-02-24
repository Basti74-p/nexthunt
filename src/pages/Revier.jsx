import React from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, TreePine, ArrowRight, MapPin, Map, Building, Layers } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";

export default function Revier() {
  const { tenant, isTenantOwner, isPlatformAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", region: "", size_ha: "", notes: "" });
  const [selectedTenantId, setSelectedTenantId] = React.useState("");
  const queryClient = useQueryClient();

  // Load all tenants for platform admins
  const { data: allTenants = [] } = useQuery({
    queryKey: ["all-tenants"],
    queryFn: () => base44.entities.Tenant.list(),
    enabled: isPlatformAdmin
  });

  const activeTenantId = isPlatformAdmin ? selectedTenantId : tenant?.id;

  const { data: reviere = [], isLoading } = useQuery({
    queryKey: ["reviere", activeTenantId],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: activeTenantId }),
    enabled: !!activeTenantId
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const tid = activeTenantId;
      if (!tid) throw new Error("Kein Tenant gefunden");
      return base44.entities.Revier.create({ ...data, tenant_id: tid, status: "active" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviere"] });
      setDialogOpen(false);
      setForm({ name: "", region: "", size_ha: "", notes: "" });
    },
    onError: (err) => {
      console.error("Fehler beim Erstellen:", err);
      alert("Fehler: " + err.message);
    }
  });

  const canManage = isTenantOwner || isPlatformAdmin;

  const quickLinks = [
  { label: "Karte", page: "Reviere", icon: Map, desc: "Revierkarte und Grenzen" },
  { label: "Jagdeinrichtungen", page: "Jagdeinrichtungen", icon: Building, desc: "Hochsitze, Kirrungen, etc." },
  { label: "Abteilungen", page: "Abteilungen", icon: Layers, desc: "Reviereinteilung" }];


  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Revier"
        subtitle={`${reviere.length} Revier${reviere.length !== 1 ? "e" : ""} verwaltet`}
        actions={
        canManage &&
        <Button onClick={() => setDialogOpen(true)} className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Neues Revier
            </Button>

        } />


      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {quickLinks.map(({ label, page, icon: Icon, desc }) =>
        <Link key={page} to={createPageUrl(page)}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-[#0F2F23]/20 hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#0F2F23]/5 flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#0F2F23]" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm group-hover:text-[#0F2F23]">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Reviere List */}
      {reviere.length === 0 && !isLoading ?
      <EmptyState icon={TreePine} title="Keine Reviere vorhanden" description="Legen Sie Ihr erstes Revier an."
      action={canManage && <Button onClick={() => setDialogOpen(true)} className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl gap-2"><Plus className="w-4 h-4" /> Revier anlegen</Button>} /> :


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviere.map((r) =>
        <Link key={r.id} to={createPageUrl(`RevierDetail?id=${r.id}`)}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-[#0F2F23]/20 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TreePine className="w-5 h-5 text-emerald-600" />
                </div>
                <StatusBadge status={r.status} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#0F2F23]">{r.name}</h3>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                {r.region && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.region}</span>}
                {r.size_ha && <span>{r.size_ha} ha</span>}
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs text-[#0F2F23] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Öffnen <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
        )}
        </div>
      }

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neues Revier</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            {isPlatformAdmin && (
              <div>
                <Label>Tenant *</Label>
                <select value={selectedTenantId} onChange={(e) => setSelectedTenantId(e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="">Tenant auswählen...</option>
                  {allTenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Reviername" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Region</Label><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="z.B. Harz" /></div>
              <div><Label>Größe (ha)</Label><Input type="number" value={form.size_ha} onChange={(e) => setForm({ ...form, size_ha: e.target.value })} placeholder="z.B. 500" /></div>
            </div>
            <div><Label>Notizen</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optionale Bemerkungen" /></div>
            <Button onClick={() => createMutation.mutate({ ...form, size_ha: form.size_ha ? Number(form.size_ha) : undefined })}
            disabled={!form.name || createMutation.isPending} className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] rounded-xl">
              {createMutation.isPending ? "Erstellen..." : "Revier erstellen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}