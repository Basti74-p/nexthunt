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
import { Plus, Crosshair, Filter, Pencil, Trash2, ChevronDown } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useI18n } from "@/lib/i18n";

const SPECIES_KEYS = [
  { value: "rotwild", labelDe: "Rotwild" },
  { value: "schwarzwild", labelDe: "Schwarzwild" },
  { value: "rehwild", labelDe: "Rehwild" },
  { value: "damwild", labelDe: "Damwild" },
  { value: "sikawild", labelDe: "Sikawild" },
  { value: "wolf", labelDe: "Wolf" },
];

const AGE_CLASSES = {
  rotwild: ["Hirsch Klasse I", "Hirsch Klasse II", "Hirsch Klasse III", "Tier", "Schmaltier"],
  schwarzwild: ["Keiler (stark)", "Keiler (mittel)", "Bache", "Überläufer (m)", "Überläufer (w)", "Frischling (m)", "Frischling (w)"],
  rehwild: ["Bock Klasse I", "Bock Klasse II", "Bock Klasse III", "Schmalreh (m)", "Schmalreh (w)", "Ricke", "Kitz (m)", "Kitz (w)"],
  damwild: ["Schaufler Klasse I", "Schaufler Klasse II", "Schaufler Klasse III", "Damtier", "Schmaltier"],
  sikawild: ["Hirsch Klasse I", "Hirsch Klasse II", "Hirsch Klasse III", "Tier", "Schmaltier"],
  wolf: ["Rüde", "Fähe", "Welpe"],
};

const STATUS_COLORS = {
  erfasst: "bg-amber-100 text-amber-700",
  bestaetigt: "bg-blue-100 text-blue-700",
  wildkammer: "bg-purple-100 text-purple-700",
  verkauft: "bg-emerald-100 text-emerald-700",
  archiviert: "bg-gray-100 text-gray-500",
};

const EMPTY_FORM = {
  species: "",
  gender: "unbekannt",
  age_class: "",
  date: new Date().toISOString().split("T")[0],
  revier_id: "",
  weight_kg: "",
  wildmark_id: "",
  notes: "",
  status: "erfasst",
};

function StatusBadge({ status, t }) {
  const key = `status_${status}`;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[status] || "bg-gray-100 text-gray-500"}`}>{t(key)}</span>
  );
}

function StatusSelect({ value, onChange, t, statusKeys }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="text-xs bg-[#2d2d2d] border border-[#3a3a3a] text-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#22c55e]"
    >
      {statusKeys.map(s => (
        <option key={s} value={s}>{t(`status_${s}`)}</option>
      ))}
    </select>
  );
}

const STATUS_KEYS = ["erfasst", "bestaetigt", "wildkammer", "verkauft", "archiviert"];

export default function Strecke() {
  const { tenant } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const SPECIES = SPECIES_KEYS.map(s => ({ value: s.value, label: s.labelDe }));
  const GENDER = [
    { value: "maennlich", label: t("geschlecht_maennlich") },
    { value: "weiblich", label: t("geschlecht_weiblich") },
    { value: "unbekannt", label: t("geschlecht_unbekannt") },
  ];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterSpecies, setFilterSpecies] = useState("alle");
  const [filterRevier, setFilterRevier] = useState("alle");
  const [filterStatus, setFilterStatus] = useState("alle");

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: strecken = [], isLoading } = useQuery({
    queryKey: ["strecke", tenant?.id],
    queryFn: () => base44.entities.Strecke.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: wildmarken = [] } = useQuery({
    queryKey: ["wildmarken", tenant?.id],
    queryFn: () => base44.entities.Wildmarke.filter({ tenant_id: tenant?.id, status: "available" }),
    enabled: !!tenant?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Strecke.create({ ...data, tenant_id: tenant.id }),
    onMutate: (data) => {
      queryClient.setQueryData(["strecke", tenant?.id], old => [...(old || []), { ...data, id: "temp-" + Date.now() }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strecke"] });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Strecke.update(id, data),
    onMutate: ({ id, data }) => {
      queryClient.setQueryData(["strecke", tenant?.id], old => (old || []).map(s => s.id === id ? { ...s, ...data } : s));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strecke"] });
      setDialogOpen(false);
      setEditItem(null);
      setForm(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Strecke.delete(id),
    onMutate: (id) => {
      queryClient.setQueryData(["strecke", tenant?.id], old => (old || []).filter(s => s.id !== id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["strecke"] }),
  });

  const handleStatusChange = (item, newStatus) => {
    updateMutation.mutate({ id: item.id, data: { status: newStatus } });
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM, revier_id: reviere[0]?.id || "" });
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      species: item.species || "",
      gender: item.gender || "unbekannt",
      age_class: item.age_class || "",
      date: item.date || new Date().toISOString().split("T")[0],
      revier_id: item.revier_id || "",
      weight_kg: item.weight_kg || "",
      wildmark_id: item.wildmark_id || "",
      notes: item.notes || "",
      status: item.status || "erfasst",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...form,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
    };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = strecken.filter(s => {
    if (filterSpecies !== "alle" && s.species !== filterSpecies) return false;
    if (filterRevier !== "alle" && s.revier_id !== filterRevier) return false;
    if (filterStatus !== "alle" && s.status !== filterStatus) return false;
    return true;
  });

  const byStatus = (status) => strecken.filter(s => s.status === status).length;
  const speciesLabel = (v) => SPECIES.find(s => s.value === v)?.label || v;
  const genderLabel = (v) => GENDER.find(g => g.value === v)?.label || v;
  const revierName = (id) => reviere.find(r => r.id === id)?.name || "–";

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={t("strecke_titel")}
        subtitle={`${strecken.length} ${t("strecke_eintraege")}`}
        actions={
          <Button onClick={openCreate} className="bg-[#22c55e] text-black hover:bg-[#16a34a] rounded-xl gap-2">
            <Plus className="w-4 h-4" /> {t("strecke_neuer_eintrag")}
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {STATUS_KEYS.filter(v => v !== "archiviert").map((value) => (
          <div key={value} className="bg-[#232323] rounded-2xl border border-[#3a3a3a] p-4 text-center cursor-pointer hover:border-[#22c55e]/40 transition-colors"
            onClick={() => setFilterStatus(filterStatus === value ? "alle" : value)}>
            <p className="text-2xl font-bold text-gray-100">{byStatus(value)}</p>
            <p className="text-xs text-gray-400 mt-1">{t(`status_${value}`)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={filterSpecies}
          onChange={e => setFilterSpecies(e.target.value)}
          className="text-sm bg-[#2d2d2d] border border-[#3a3a3a] text-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#22c55e]"
        >
          <option value="alle">{t("strecke_alle_wildarten")}</option>
          {SPECIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select
          value={filterRevier}
          onChange={e => setFilterRevier(e.target.value)}
          className="text-sm bg-[#2d2d2d] border border-[#3a3a3a] text-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#22c55e]"
        >
          <option value="alle">{t("strecke_alle_reviere")}</option>
          {reviere.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="text-sm bg-[#2d2d2d] border border-[#3a3a3a] text-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#22c55e]"
        >
          <option value="alle">{t("strecke_alle_status")}</option>
          {STATUS_KEYS.map(s => <option key={s} value={s}>{t(`status_${s}`)}</option>)}
        </select>
        {(filterSpecies !== "alle" || filterRevier !== "alle" || filterStatus !== "alle") && (
          <button onClick={() => { setFilterSpecies("alle"); setFilterRevier("alle"); setFilterStatus("alle"); }}
            className="text-xs text-gray-400 hover:text-gray-200 underline">
            {t("strecke_filter_reset")}
          </button>
        )}
      </div>

      {/* Table / Card View */}
      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={Crosshair} title={t("strecke_keine_eintraege")} description={t("strecke_keine_desc")} />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block bg-[#232323] rounded-2xl border border-[#3a3a3a] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#3a3a3a]">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">{t("strecke_datum")}</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">{t("strecke_wildart")}</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">{t("strecke_geschlecht")}</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">{t("strecke_altersklasse")}</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">{t("strecke_revier")}</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">{t("strecke_wildmarke")}</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">{t("strecke_gewicht")}</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">{t("strecke_status")}</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">{t("strecke_aktionen")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => (
                    <tr key={item.id} className={`border-b border-[#3a3a3a] last:border-0 hover:bg-[#2a2a2a] transition-colors ${i % 2 === 0 ? "" : "bg-[#282828]"}`}>
                      <td className="px-4 py-3 text-gray-200">
                        {item.date ? format(new Date(item.date), "dd.MM.yyyy", { locale: de }) : "–"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-100">{speciesLabel(item.species)}</td>
                      <td className="px-4 py-3 text-gray-300">{genderLabel(item.gender)}</td>
                      <td className="px-4 py-3 text-gray-300">{item.age_class || "–"}</td>
                      <td className="px-4 py-3 text-gray-300">{revierName(item.revier_id)}</td>
                       <td className="px-4 py-3 text-gray-300 text-xs">{item.wildmark_id ? wildmarken.find(w => w.id === item.wildmark_id)?.code || "–" : "–"}</td>
                       <td className="px-4 py-3 text-gray-300">{item.weight_kg ? `${item.weight_kg} kg` : "–"}</td>
                      <td className="px-4 py-3">
                        <StatusSelect value={item.status || "erfasst"} onChange={(v) => handleStatusChange(item, v)} t={t} statusKeys={STATUS_KEYS} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-[#3a3a3a] text-gray-400 hover:text-gray-200 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { if (confirm(t("strecke_loeschen_confirm"))) deleteMutation.mutate(item.id); }}
                                    className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors">
                                     <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {filtered.map(item => (
              <div key={item.id} className="bg-[#232323] rounded-xl border border-[#3a3a3a] p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-100">{speciesLabel(item.species)}</p>
                    <p className="text-xs text-gray-400">{item.date ? format(new Date(item.date), "dd.MM.yyyy", { locale: de }) : "–"}</p>
                  </div>
                  <StatusSelect value={item.status || "erfasst"} onChange={(v) => handleStatusChange(item, v)} t={t} statusKeys={STATUS_KEYS} />
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                  <p>{t("strecke_geschlecht")}: {genderLabel(item.gender)}</p>
                  {item.age_class && <p>{t("strecke_altersklasse")}: {item.age_class}</p>}
                  <p>{t("strecke_revier")}: {revierName(item.revier_id)}</p>
                  {item.weight_kg && <p>{t("strecke_gewicht")}: {item.weight_kg} kg</p>}
                </div>
                <div className="flex gap-2 pt-2 border-t border-[#3a3a3a]">
                  <button onClick={() => openEdit(item)} className="flex-1 p-2 rounded-lg hover:bg-[#3a3a3a] text-gray-400 hover:text-gray-200 transition-colors text-sm">
                    <Pencil className="w-4 h-4 mx-auto" />
                  </button>
                  <button onClick={() => { if (confirm(t("strecke_loeschen_confirm"))) deleteMutation.mutate(item.id); }}
                    className="flex-1 p-2 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors text-sm">
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditItem(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="bg-[#2d2d2d] border-[#3a3a3a] max-w-lg sm:max-w-lg max-h-[90vh] w-[calc(100vw-2rem)] sm:w-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-100">{editItem ? t("strecke_bearbeiten_titel") : t("strecke_neu_titel")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">{t("strecke_wildart")} *</Label>
                 <Select value={form.species} onValueChange={v => setForm({ ...form, species: v })}>
                   <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                     <SelectValue placeholder={t("strecke_wildart_waehlen")} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    {SPECIES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">{t("strecke_geschlecht")}</Label>
                <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    {GENDER.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">{t("strecke_datum")} *</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Altersklasse</Label>
                <Select value={form.age_class} onValueChange={v => setForm({ ...form, age_class: v })}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                    <SelectValue placeholder="Altersklasse wählen" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    {form.species && AGE_CLASSES[form.species]?.map(ac => (
                      <SelectItem key={ac} value={ac}>{ac}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Revier</Label>
                <Select value={form.revier_id} onValueChange={v => setForm({ ...form, revier_id: v })}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                    <SelectValue placeholder="Revier wählen" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    {reviere.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Wildmarke</Label>
                <Select value={form.wildmark_id} onValueChange={v => setForm({ ...form, wildmark_id: v })}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                    <SelectValue placeholder="Marke wählen" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    {wildmarken.map(w => <SelectItem key={w.id} value={w.id}>{w.code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Gewicht (kg)</Label>
                <Input type="number" step="0.1" value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })}
                  placeholder="z.B. 24.5" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              </div>
              <div>
              <Label className="text-gray-300 text-xs mb-1 block">Notizen</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Optionale Anmerkungen" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 resize-none h-16" />
              </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 border-[#3a3a3a]">Abbrechen</Button>
              <Button
                onClick={handleSubmit}
                disabled={!form.species || !form.date || createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-[#22c55e] text-black hover:bg-[#16a34a]">
                {createMutation.isPending || updateMutation.isPending ? "Speichern..." : editItem ? "Aktualisieren" : "Erfassen"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}