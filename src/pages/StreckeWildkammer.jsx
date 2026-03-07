import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Archive, Package, FlaskConical } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import WildkammerEingangDialog from "@/components/wildkammer/WildkammerEingangDialog";
import WildkammerAusgabeDialog from "@/components/wildkammer/WildkammerAusgabeDialog";
import WildkammerKarte from "@/components/wildkammer/WildkammerKarte";

const STATUS_ORDER = ["eingang", "verarbeitung", "lager", "ausgabe", "verkauft"];
const STATUS_LABELS = {
  eingang: "Eingang", verarbeitung: "Verarbeitung", lager: "Lager",
  ausgabe: "Ausgabe", verkauft: "Verkauft",
};

export default function StreckeWildkammer() {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();

  const [eingangOpen, setEingangOpen] = useState(false);
  const [ausgabeOpen, setAusgabeOpen] = useState(false);
  const [trichOpen, setTrichOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState("aktiv"); // "aktiv" | all statuses
  const [filterRevier, setFilterRevier] = useState("alle");
  const [trichForm, setTrichForm] = useState({ ergebnis: "negativ", datum: new Date().toISOString().split("T")[0], gewicht_kalt: "" });
  const [editForm, setEditForm] = useState({});

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: wildkammer = [] } = useQuery({
    queryKey: ["wildkammer", tenant?.id],
    queryFn: () => base44.entities.Wildkammer.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  // Strecken zum Verknüpfen
  const { data: strecken = [] } = useQuery({
    queryKey: ["strecke-wk", tenant?.id],
    queryFn: () => base44.entities.Strecke.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
    select: (data) => data.filter(s => !["archiviert", "verkauft"].includes(s.status)),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Wildkammer.create({ ...data, tenant_id: tenant.id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wildkammer"] }); setEingangOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Wildkammer.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wildkammer"] }); setAusgabeOpen(false); setTrichOpen(false); setEditOpen(false); },
  });

  const handleEingang = (form) => {
    createMutation.mutate({
      ...form,
      gewicht_aufgebrochen: form.gewicht_aufgebrochen ? parseFloat(form.gewicht_aufgebrochen) : undefined,
      kuehltemperatur: form.kuehltemperatur ? parseFloat(form.kuehltemperatur) : undefined,
      status: "eingang",
    });
  };

  const handleAction = (action, item) => {
    setActiveItem(item);
    if (action === "verarbeitung") updateMutation.mutate({ id: item.id, data: { status: "verarbeitung" } });
    else if (action === "lager") updateMutation.mutate({ id: item.id, data: { status: "lager" } });
    else if (action === "trichinen") setTrichOpen(true);
    else if (action === "ausgabe") setAusgabeOpen(true);
    else if (action === "edit") { setEditForm({ ...item }); setEditOpen(true); }
  };

  const handleTrichSave = () => {
    updateMutation.mutate({
      id: activeItem.id,
      data: {
        trichinenprobe: true,
        trichinenprobe_datum: trichForm.datum,
        trichinenprobe_ergebnis: trichForm.ergebnis,
        gewicht_kalt: trichForm.gewicht_kalt ? parseFloat(trichForm.gewicht_kalt) : undefined,
      },
    });
  };

  const handleAusgabe = (form) => {
    updateMutation.mutate({
      id: activeItem.id,
      data: {
        ...form,
        status: form.ausgabe_typ === "verkauf" ? "verkauft" : "ausgabe",
        verkaufspreis: form.verkaufspreis ? parseFloat(form.verkaufspreis) : undefined,
        freigabe: true,
        freigabe_datum: form.ausgabe_datum,
      },
    });
  };

  const handleEditSave = () => {
    const data = { ...editForm };
    if (data.gewicht_aufgebrochen) data.gewicht_aufgebrochen = parseFloat(data.gewicht_aufgebrochen);
    if (data.gewicht_kalt) data.gewicht_kalt = parseFloat(data.gewicht_kalt);
    if (data.kuehltemperatur) data.kuehltemperatur = parseFloat(data.kuehltemperatur);
    updateMutation.mutate({ id: activeItem.id, data });
  };

  const revierName = (id) => reviere.find(r => r.id === id)?.name || "";

  // Filter
  const filtered = wildkammer.filter(w => {
    if (filterRevier !== "alle" && w.revier_id !== filterRevier) return false;
    if (filterStatus === "aktiv") return !["ausgabe", "verkauft"].includes(w.status);
    if (filterStatus !== "alle") return w.status === filterStatus;
    return true;
  });

  // Stats
  const aktiv = wildkammer.filter(w => !["ausgabe", "verkauft"].includes(w.status));
  const trichinenAusstehend = wildkammer.filter(w => w.trichinenprobe_ergebnis === "ausstehend" && w.trichinenprobe && !["ausgabe", "verkauft"].includes(w.status));

  // Group by status for kanban view
  const grouped = STATUS_ORDER.reduce((acc, s) => { acc[s] = filtered.filter(w => w.status === s); return acc; }, {});

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Wildkammer"
        subtitle={`${aktiv.length} Stück im Bestand${trichinenAusstehend.length > 0 ? ` · ${trichinenAusstehend.length} Trichinenprobe ausstehend` : ""}`}
        actions={
          <Button onClick={() => setEingangOpen(true)} className="bg-[#22c55e] text-black hover:bg-[#16a34a] rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Eingang
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <div className="flex gap-1">
          {[{ v: "aktiv", l: "Aktiv" }, { v: "alle", l: "Alle" }, ...STATUS_ORDER.map(s => ({ v: s, l: STATUS_LABELS[s] }))].map(({ v, l }) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors ${filterStatus === v ? "bg-[#22c55e] text-black" : "bg-[#232323] border border-[#3a3a3a] text-gray-400 hover:text-gray-200"}`}>
              {l}
              {v !== "aktiv" && v !== "alle" && grouped[v]?.length > 0 && (
                <span className="ml-1 opacity-60">({grouped[v].length})</span>
              )}
            </button>
          ))}
        </div>
        {reviere.length > 1 && (
          <select value={filterRevier} onChange={e => setFilterRevier(e.target.value)}
            className="text-sm bg-[#2d2d2d] border border-[#3a3a3a] text-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#22c55e]">
            <option value="alle">Alle Reviere</option>
            {reviere.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        )}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="bg-[#232323] rounded-2xl border border-[#3a3a3a] p-12 text-center">
          <Archive className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">Wildkammer leer</p>
          <p className="text-gray-500 text-sm mt-1 mb-4">Buchen Sie den ersten Eingang.</p>
          <Button onClick={() => setEingangOpen(true)} className="bg-[#22c55e] text-black hover:bg-[#16a34a] rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Eingang buchen
          </Button>
        </div>
      ) : filterStatus === "alle" ? (
        // Kanban-Style by status
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {STATUS_ORDER.map(s => (
            <div key={s}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                {STATUS_LABELS[s]} <span className="text-gray-600">({(grouped[s] || []).length})</span>
              </h3>
              <div className="space-y-3">
                {(grouped[s] || []).map(item => (
                  <WildkammerKarte key={item.id} item={item} onAction={handleAction} revierName={revierName(item.revier_id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(item => (
            <WildkammerKarte key={item.id} item={item} onAction={handleAction} revierName={revierName(item.revier_id)} />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <WildkammerEingangDialog
        open={eingangOpen} onClose={() => setEingangOpen(false)}
        onSave={handleEingang} reviere={reviere} strecken={strecken}
      />

      <WildkammerAusgabeDialog
        open={ausgabeOpen} onClose={() => setAusgabeOpen(false)}
        onSave={handleAusgabe} item={activeItem}
      />

      {/* Trichinenprobe Dialog */}
      <Dialog open={trichOpen} onOpenChange={v => !v && setTrichOpen(false)}>
        <DialogContent className="bg-[#2d2d2d] border-[#3a3a3a] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-gray-100 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-blue-400" /> Trichinenprobe
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Datum</Label>
                <Input type="date" value={trichForm.datum} onChange={e => setTrichForm(f => ({ ...f, datum: e.target.value }))}
                  className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Ergebnis</Label>
                <Select value={trichForm.ergebnis} onValueChange={v => setTrichForm(f => ({ ...f, ergebnis: v }))}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    <SelectItem value="ausstehend">Ausstehend</SelectItem>
                    <SelectItem value="negativ">Negativ</SelectItem>
                    <SelectItem value="positiv">Positiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Kaltgewicht (kg)</Label>
              <Input type="number" step="0.1" value={trichForm.gewicht_kalt}
                onChange={e => setTrichForm(f => ({ ...f, gewicht_kalt: e.target.value }))}
                placeholder="z.B. 15.5" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setTrichOpen(false)} className="flex-1 border-[#3a3a3a]">Abbrechen</Button>
              <Button onClick={handleTrichSave} className="flex-1 bg-[#22c55e] text-black hover:bg-[#16a34a]">Speichern</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={v => !v && setEditOpen(false)}>
        <DialogContent className="bg-[#2d2d2d] border-[#3a3a3a] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Eintrag bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Gewicht aufgebr. (kg)</Label>
                <Input type="number" step="0.1" value={editForm.gewicht_aufgebrochen || ""}
                  onChange={e => setEditForm(f => ({ ...f, gewicht_aufgebrochen: e.target.value }))}
                  className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Kaltgewicht (kg)</Label>
                <Input type="number" step="0.1" value={editForm.gewicht_kalt || ""}
                  onChange={e => setEditForm(f => ({ ...f, gewicht_kalt: e.target.value }))}
                  className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Kühltemperatur (°C)</Label>
                <Input type="number" step="0.5" value={editForm.kuehltemperatur || ""}
                  onChange={e => setEditForm(f => ({ ...f, kuehltemperatur: e.target.value }))}
                  className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Status</Label>
                <Select value={editForm.status || "eingang"} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    {STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editForm.aufbruch_ok || false} onChange={e => setEditForm(f => ({ ...f, aufbruch_ok: e.target.checked }))}
                  className="w-4 h-4 accent-[#22c55e]" />
                <span className="text-sm text-gray-300">Aufbruch i.O.</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editForm.decke_ab || false} onChange={e => setEditForm(f => ({ ...f, decke_ab: e.target.checked }))}
                  className="w-4 h-4 accent-[#22c55e]" />
                <span className="text-sm text-gray-300">Decke ab</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editForm.freigabe || false} onChange={e => setEditForm(f => ({ ...f, freigabe: e.target.checked }))}
                  className="w-4 h-4 accent-[#22c55e]" />
                <span className="text-sm text-gray-300">Freigabe</span>
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 border-[#3a3a3a]">Abbrechen</Button>
              <Button onClick={handleEditSave} disabled={updateMutation.isPending}
                className="flex-1 bg-[#22c55e] text-black hover:bg-[#16a34a]">Speichern</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}