import React, { useState } from "react";
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
import { Plus, TreePine, ArrowRight, MapPin, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";

export default function Reviere() {
  const { tenant, isTenantOwner, isPlatformAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", region: "", size_ha: "", notes: "" });
  const queryClient = useQueryClient();

  const { data: reviere = [], isLoading } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Revier.create({ ...data, tenant_id: tenant.id, status: "active" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviere"] });
      setDialogOpen(false);
      setForm({ name: "", region: "", size_ha: "", notes: "" });
    }
  });

  const canManage = isTenantOwner || isPlatformAdmin;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Reviere"
        subtitle={`${reviere.length} Revier${reviere.length !== 1 ? "e" : ""} verwaltet`}
        actions={
        canManage &&
        <Button onClick={() => setDialogOpen(true)} className="bg-[#22c55e] text-[#000000] px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 hover:bg-[#1a4a36] gap-2">
              <Plus className="w-4 h-4" /> Neues Revier
            </Button>

        } />


      {reviere.length === 0 && !isLoading ?
      <EmptyState
        icon={TreePine}
        title="Keine Reviere vorhanden"
        description="Legen Sie Ihr erstes Revier an, um die Verwaltung zu starten."
        action={
        canManage &&
        <Button onClick={() => setDialogOpen(true)} className="bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-xl gap-2">
                <Plus className="w-4 h-4" /> Revier anlegen
              </Button>

        } /> :


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviere.map((r) =>
        <Link
          key={r.id}
          to={createPageUrl(`RevierDetail?id=${r.id}`)}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-[#0F2F23]/20 hover:shadow-md transition-all group">

              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TreePine className="w-5 h-5 text-emerald-600" />
                </div>
                <StatusBadge status={r.status} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#0F2F23] transition-colors">{r.name}</h3>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                {r.region &&
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.region}</span>
            }
                {r.size_ha && <span>{r.size_ha} ha</span>}
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs text-[#0F2F23] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Öffnen <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
        )}
        </div>
      }

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neues Revier</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Reviername" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Region</Label>
                <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="z.B. Harz" />
              </div>
              <div>
                <Label>Größe (ha)</Label>
                <Input type="number" value={form.size_ha} onChange={(e) => setForm({ ...form, size_ha: e.target.value })} placeholder="z.B. 500" />
              </div>
            </div>
            <div>
              <Label>Notizen</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optionale Bemerkungen" />
            </div>
            <Button
              onClick={() => createMutation.mutate({ ...form, size_ha: form.size_ha ? Number(form.size_ha) : undefined })}
              disabled={!form.name || createMutation.isPending}
              className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-xl">

              {createMutation.isPending ? "Erstellen..." : "Revier erstellen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}