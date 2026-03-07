import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crosshair, Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

// Jagdlich korrekte Kategorien je Wildart
const SPECIES_KATEGORIEN = {
  rehwild: [
    { value: "bock_kl1", label: "Bock Klasse I" },
    { value: "bock_kl2", label: "Bock Klasse II" },
    { value: "bock_kl3", label: "Bock Klasse III" },
    { value: "schmalreh_maennlich", label: "Schmalreh (männlich)" },
    { value: "schmalreh_weiblich", label: "Schmalreh (weiblich)" },
    { value: "ricke", label: "Ricke" },
    { value: "kitz_maennlich", label: "Kitz (männlich)" },
    { value: "kitz_weiblich", label: "Kitz (weiblich)" },
  ],
  rotwild: [
    { value: "hirsch_kl1", label: "Hirsch Klasse I" },
    { value: "hirsch_kl2", label: "Hirsch Klasse II" },
    { value: "hirsch_kl3", label: "Hirsch Klasse III" },
    { value: "tier", label: "Tier (Alttier)" },
    { value: "schmaltier", label: "Schmaltier" },
    { value: "kalb_maennlich", label: "Kalb (männlich)" },
    { value: "kalb_weiblich", label: "Kalb (weiblich)" },
  ],
  schwarzwild: [
    { value: "keiler_stark", label: "Keiler (stark)" },
    { value: "keiler_mittel", label: "Keiler (mittel)" },
    { value: "bache", label: "Bache" },
    { value: "ueberlaeufer_maennlich", label: "Überläufer (männlich)" },
    { value: "ueberlaeufer_weiblich", label: "Überläufer (weiblich)" },
    { value: "frischling_maennlich", label: "Frischling (männlich)" },
    { value: "frischling_weiblich", label: "Frischling (weiblich)" },
  ],
  damwild: [
    { value: "schaufler_kl1", label: "Schaufler Klasse I" },
    { value: "schaufler_kl2", label: "Schaufler Klasse II" },
    { value: "schaufler_kl3", label: "Schaufler Klasse III" },
    { value: "damtier", label: "Damtier (Alttier)" },
    { value: "schmaltier_dam", label: "Schmaltier" },
    { value: "kalb_dam_m", label: "Kalb (männlich)" },
    { value: "kalb_dam_w", label: "Kalb (weiblich)" },
  ],
  sikawild: [
    { value: "hirsch_sika_kl1", label: "Hirsch Klasse I" },
    { value: "hirsch_sika_kl2", label: "Hirsch Klasse II" },
    { value: "hirsch_sika_kl3", label: "Hirsch Klasse III" },
    { value: "tier_sika", label: "Tier (Alttier)" },
    { value: "schmaltier_sika", label: "Schmaltier" },
    { value: "kalb_sika_m", label: "Kalb (männlich)" },
    { value: "kalb_sika_w", label: "Kalb (weiblich)" },
  ],
};

const SPECIES_LABELS = {
  rehwild: "Rehwild", rotwild: "Rotwild", schwarzwild: "Schwarzwild",
  damwild: "Damwild", sikawild: "Sikawild",
};

// Jagdjahr aus Datum ableiten (1. April – 31. März)
function getJagdjahr(date) {
  const d = date ? new Date(date) : new Date();
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed
  return month >= 3 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

function getCurrentJagdjahr() {
  return getJagdjahr(new Date());
}

const EMPTY_FORM = {
  species: "", kategorie: "", soll: "", revier_id: "", notes: "",
};

export default function StreckeAbschussplan() {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  const currentJagdjahr = getCurrentJagdjahr();
  const [selectedJagdjahr, setSelectedJagdjahr] = useState(currentJagdjahr);
  const [filterRevier, setFilterRevier] = useState("alle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expandedSpecies, setExpandedSpecies] = useState(new Set(Object.keys(SPECIES_LABELS)));

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: plaene = [] } = useQuery({
    queryKey: ["abschussplan", tenant?.id],
    queryFn: () => base44.entities.Abschussplan.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: strecken = [] } = useQuery({
    queryKey: ["strecke", tenant?.id],
    queryFn: () => base44.entities.Strecke.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Abschussplan.create({ ...data, tenant_id: tenant.id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["abschussplan"] }); setDialogOpen(false); setForm(EMPTY_FORM); setEditItem(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Abschussplan.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["abschussplan"] }); setDialogOpen(false); setForm(EMPTY_FORM); setEditItem(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Abschussplan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["abschussplan"] }),
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM, revier_id: filterRevier !== "alle" ? filterRevier : (reviere[0]?.id || "") });
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ species: item.species, kategorie: item.kategorie, soll: item.soll, revier_id: item.revier_id, notes: item.notes || "" });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = { ...form, soll: parseInt(form.soll), jagdjahr: selectedJagdjahr };
    if (editItem) updateMutation.mutate({ id: editItem.id, data });
    else createMutation.mutate(data);
  };

  // Filter plans
  const filteredPlaene = plaene.filter(p => {
    if (p.jagdjahr !== selectedJagdjahr) return false;
    if (filterRevier !== "alle" && p.revier_id !== filterRevier) return false;
    return true;
  });

  // Strecke IST-Zahlen für das Jagdjahr
  const istStrecken = strecken.filter(s => {
    if (!s.date) return false;
    if (filterRevier !== "alle" && s.revier_id !== filterRevier) return false;
    return getJagdjahr(s.date) === selectedJagdjahr;
  });

  // Match strecke to kategorie by age_class field
  const getIst = (species, kategorie) => {
    // Count only entries with status "erfasst" for this species
    return istStrecken.filter(s => s.species === species && s.status === "erfasst").length;
  };

  // Also count all species strecke regardless of kategorie
  const getIstBySpecies = (species) => istStrecken.filter(s => s.species === species).length;
  const getSollBySpecies = (species) => filteredPlaene.filter(p => p.species === species).reduce((sum, p) => sum + (p.soll || 0), 0);

  // Available jagdjahre
  const jagdjahre = [...new Set([
    currentJagdjahr,
    ...plaene.map(p => p.jagdjahr).filter(Boolean),
  ])].sort((a, b) => b.localeCompare(a));

  const toggleSpecies = (sp) => {
    setExpandedSpecies(prev => {
      const next = new Set(prev);
      next.has(sp) ? next.delete(sp) : next.add(sp);
      return next;
    });
  };

  const speciesWithData = Object.keys(SPECIES_LABELS).filter(sp =>
    filteredPlaene.some(p => p.species === sp) || getIstBySpecies(sp) > 0
  );

  const revierName = (id) => reviere.find(r => r.id === id)?.name || "–";

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Abschussplan"
        subtitle={`Jagdjahr ${selectedJagdjahr}`}
        actions={
          <Button onClick={openCreate} className="bg-[#22c55e] text-black hover:bg-[#16a34a] rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Planposition
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Jagdjahr:</span>
          <div className="flex gap-1">
            {jagdjahre.map(jj => (
              <button key={jj} onClick={() => setSelectedJagdjahr(jj)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${selectedJagdjahr === jj ? "bg-[#22c55e] text-black" : "bg-[#232323] border border-[#3a3a3a] text-gray-300 hover:border-[#22c55e]/40"}`}>
                {jj}
              </button>
            ))}
          </div>
        </div>
        {reviere.length > 1 && (
          <select value={filterRevier} onChange={e => setFilterRevier(e.target.value)}
            className="text-sm bg-[#2d2d2d] border border-[#3a3a3a] text-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#22c55e]">
            <option value="alle">Alle Reviere</option>
            {reviere.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        )}
      </div>

      {speciesWithData.length === 0 ? (
        <div className="bg-[#232323] rounded-2xl border border-[#3a3a3a] p-12 text-center">
          <Crosshair className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">Kein Abschussplan vorhanden</p>
          <p className="text-gray-500 text-sm mt-1 mb-4">Legen Sie Planpositionen für das Jagdjahr {selectedJagdjahr} an.</p>
          <Button onClick={openCreate} className="bg-[#22c55e] text-black hover:bg-[#16a34a] rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Erste Planposition anlegen
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {speciesWithData.map(sp => {
            const spPlaene = filteredPlaene.filter(p => p.species === sp);
            const istGesamt = getIstBySpecies(sp);
            const sollGesamt = getSollBySpecies(sp);
            const percent = sollGesamt > 0 ? Math.min((istGesamt / sollGesamt) * 100, 100) : 0;
            const expanded = expandedSpecies.has(sp);

            return (
              <div key={sp} className="bg-[#232323] rounded-2xl border border-[#3a3a3a] overflow-hidden">
                {/* Species header */}
                <button
                  onClick={() => toggleSpecies(sp)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#2a2a2a] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    <span className="font-semibold text-gray-100 text-base">{SPECIES_LABELS[sp]}</span>
                    <span className="text-xs text-gray-500 bg-[#2d2d2d] border border-[#3a3a3a] rounded-full px-2 py-0.5">
                      {spPlaene.length} Positionen
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-500">Gesamt Soll / Ist</p>
                      <p className="text-sm font-medium text-gray-200">
                        {istGesamt} / {sollGesamt}
                        <span className={`ml-2 text-xs ${percent >= 100 ? "text-emerald-400" : percent >= 75 ? "text-amber-400" : "text-gray-400"}`}>
                          ({Math.round(percent)}%)
                        </span>
                      </p>
                    </div>
                    <div className="w-24 bg-[#3a3a3a] rounded-full h-2 hidden sm:block">
                      <div className={`h-2 rounded-full transition-all ${percent >= 100 ? "bg-emerald-500" : percent >= 75 ? "bg-amber-500" : "bg-[#22c55e]"}`}
                        style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </button>

                {/* Positions table */}
                {expanded && (
                  <div className="border-t border-[#3a3a3a]">
                    {spPlaene.length === 0 ? (
                      <p className="px-5 py-3 text-sm text-gray-500 italic">Keine Planpositionen für diese Wildart.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#1e1e1e]">
                            <th className="text-left px-5 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Kategorie</th>
                            {reviere.length > 1 && filterRevier === "alle" && (
                              <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Revier</th>
                            )}
                            <th className="text-center px-4 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Soll</th>
                            <th className="text-center px-4 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Ist</th>
                            <th className="text-center px-4 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Offen</th>
                            <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Fortschritt</th>
                            <th className="px-4 py-2.5"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {spPlaene.map((plan) => {
                            const ist = getIst(sp, plan.kategorie);
                            const offen = Math.max(0, plan.soll - ist);
                            const pct = plan.soll > 0 ? Math.min((ist / plan.soll) * 100, 100) : 0;
                            const katLabel = SPECIES_KATEGORIEN[sp]?.find(k => k.value === plan.kategorie)?.label || plan.kategorie;
                            return (
                              <tr key={plan.id} className="border-t border-[#3a3a3a] hover:bg-[#2a2a2a] transition-colors">
                                <td className="px-5 py-3 text-gray-200 font-medium">{katLabel}</td>
                                {reviere.length > 1 && filterRevier === "alle" && (
                                  <td className="px-4 py-3 text-gray-400 text-xs">{revierName(plan.revier_id)}</td>
                                )}
                                <td className="px-4 py-3 text-center text-gray-300">{plan.soll}</td>
                                <td className="px-4 py-3 text-center font-medium text-gray-100">{ist}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`font-medium ${offen > 0 ? "text-amber-400" : "text-emerald-400"}`}>{offen}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-[#3a3a3a] rounded-full h-1.5 min-w-[60px]">
                                      <div className={`h-1.5 rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-[#22c55e]"}`}
                                        style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-xs text-gray-500 w-7">{Math.round(pct)}%</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1 justify-end">
                                    <button onClick={() => openEdit(plan)} className="p-1.5 rounded-lg hover:bg-[#3a3a3a] text-gray-400 hover:text-gray-200 transition-colors">
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => { if (confirm("Position löschen?")) deleteMutation.mutate(plan.id); }}
                                      className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditItem(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="bg-[#2d2d2d] border-[#3a3a3a] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-100">{editItem ? "Position bearbeiten" : "Neue Planposition"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Wildart *</Label>
                <Select value={form.species} onValueChange={v => setForm({ ...form, species: v, kategorie: "" })}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                    <SelectValue placeholder="Wildart" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    {Object.entries(SPECIES_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Revier *</Label>
                <Select value={form.revier_id} onValueChange={v => setForm({ ...form, revier_id: v })}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                    <SelectValue placeholder="Revier" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    {reviere.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Kategorie *</Label>
              <Select value={form.kategorie} onValueChange={v => setForm({ ...form, kategorie: v })} disabled={!form.species}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                  <SelectValue placeholder={form.species ? "Kategorie wählen" : "Erst Wildart wählen"} />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  {(SPECIES_KATEGORIEN[form.species] || []).map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Planzahl (Soll) *</Label>
              <Input type="number" min="0" value={form.soll} onChange={e => setForm({ ...form, soll: e.target.value })}
                placeholder="z.B. 5" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>

            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Notizen</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Optionale Bemerkungen" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 resize-none h-16" />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 border-[#3a3a3a]">Abbrechen</Button>
              <Button
                onClick={handleSubmit}
                disabled={!form.species || !form.kategorie || !form.soll || !form.revier_id || createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-[#22c55e] text-black hover:bg-[#16a34a]">
                {createMutation.isPending || updateMutation.isPending ? "Speichern..." : editItem ? "Aktualisieren" : "Anlegen"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}