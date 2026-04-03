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
import { Plus, TreePine, ArrowRight, MapPin, Trash2, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { useI18n } from "@/lib/i18n";

export default function Reviere() {
  const { tenant, isTenantOwner, isPlatformAdmin } = useAuth();
  const { t } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", region: "", size_ha: "", notes: "" });
  const [limitError, setLimitError] = useState(null);
  const queryClient = useQueryClient();

  const gesamtflaeche = tenant?.gesamtflaeche_ha || 0;
  const maxFlaeche = tenant?.max_flaeche_ha;
  const isNearLimit = maxFlaeche && gesamtflaeche >= maxFlaeche * 0.9;

  const { data: reviere = [], isLoading } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Limit check: use manually entered size_ha as estimate
      if (maxFlaeche && data.size_ha) {
        const newTotal = gesamtflaeche + Number(data.size_ha);
        if (newTotal > maxFlaeche) {
          throw new Error(`Dein aktuelles Paket unterstützt maximal ${maxFlaeche.toLocaleString("de-DE")} ha. Bitte upgrade dein Paket.`);
        }
      }
      return base44.entities.Revier.create({ ...data, tenant_id: tenant.id, status: "active" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviere"] });
      setDialogOpen(false);
      setLimitError(null);
      setForm({ name: "", region: "", size_ha: "", notes: "" });
    },
    onError: (err) => {
      setLimitError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Revier.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviere"] }),
  });

  const canManage = isTenantOwner || isPlatformAdmin;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={t("reviere_titel")}
        subtitle={`${reviere.length} ${t("reviere_verwaltet")}`}
        actions={
        canManage &&
        <Button onClick={() => setDialogOpen(true)} className="bg-[#22c55e] text-[#000000] px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 hover:bg-[#1a4a36] gap-2">
              <Plus className="w-4 h-4" /> {t("reviere_neu")}
            </Button>

        } />


      {reviere.length === 0 && !isLoading ?
      <EmptyState
        icon={TreePine}
        title={t("reviere_keine")}
        description={t("reviere_keine_desc")}
        action={
        canManage &&
        <Button onClick={() => setDialogOpen(true)} className="bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-xl gap-2">
                <Plus className="w-4 h-4" /> {t("reviere_anlegen")}
              </Button>

        } /> :


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviere.map((r) =>
        <div key={r.id} className="relative bg-[#1e1e1e] rounded-2xl border border-[#2a2a2a] hover:border-[#22c55e]/40 hover:shadow-lg transition-all group">
            {canManage && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (window.confirm(`${r.name} ${t("reviere_loeschen_confirm")}`)) deleteMutation.mutate(r.id);
                }}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-[#2a2a2a] hover:bg-red-500/20 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <Link to={createPageUrl(`RevierDetail?id=${r.id}`)} className="block p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#22c55e]/10 flex items-center justify-center">
                  <TreePine className="w-5 h-5 text-[#22c55e]" />
                </div>
                <StatusBadge status={r.status} />
              </div>
              <h3 className="text-lg font-semibold text-gray-100 group-hover:text-[#22c55e] transition-colors">{r.name}</h3>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                {r.region && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.region}</span>}
                {r.flaeche_ha
                  ? <span className="text-[#22c55e] font-medium">{r.flaeche_ha.toFixed(1)} ha</span>
                  : r.size_ha
                    ? <span className="text-gray-400">{r.size_ha} ha</span>
                    : <span className="text-amber-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Grenzen noch nicht eingezeichnet</span>
                }
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs text-[#22c55e] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {t("reviere_oeffnen")} <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </div>
        )}
        </div>
      }

      {/* Limit warning banner */}
      {isNearLimit && (
        <div className="mb-4 flex items-start gap-3 bg-amber-950/30 border border-amber-500/40 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <span className="text-amber-300 font-medium">Flächenlimit fast erreicht: </span>
            <span className="text-gray-300">{gesamtflaeche.toFixed(1)} / {maxFlaeche?.toLocaleString("de-DE")} ha</span>
          </div>
          <Link to="/PaketePreise" className="text-xs text-amber-400 hover:underline shrink-0 font-medium">Upgrade →</Link>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setLimitError(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("reviere_neues_dialog")}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>{t("reviere_name")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("reviere_name_placeholder")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("reviere_region")}</Label>
                <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder={t("reviere_region_placeholder")} />
              </div>
              <div>
                <Label>{t("reviere_groesse")}</Label>
                <Input type="number" value={form.size_ha} onChange={(e) => setForm({ ...form, size_ha: e.target.value })} placeholder={t("reviere_groesse_placeholder")} />
              </div>
            </div>
            <div>
              <Label>{t("reviere_notizen")}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t("reviere_notizen_placeholder")} />
            </div>
            {limitError && (
              <div className="flex items-start gap-2 bg-red-950/30 border border-red-500/40 rounded-xl px-3 py-2.5 text-sm text-red-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{limitError} <Link to="/PaketePreise" className="underline font-medium">Pakete ansehen →</Link></span>
              </div>
            )}
            <Button
              onClick={() => { setLimitError(null); createMutation.mutate({ ...form, size_ha: form.size_ha ? Number(form.size_ha) : undefined }); }}
              disabled={!form.name || createMutation.isPending}
              className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-xl">
              {createMutation.isPending ? t("reviere_erstellen_loading") : t("reviere_erstellen")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}