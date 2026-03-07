import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crosshair, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

const SPECIES = [
  { value: "rotwild", label: "Rotwild" },
  { value: "schwarzwild", label: "Schwarzwild" },
  { value: "rehwild", label: "Rehwild" },
  { value: "damwild", label: "Damwild" },
  { value: "sikawild", label: "Sikawild" },
];

// We derive the "plan" from existing strecke entries per year/species
// and compare with simple targets the user defines (stored in localStorage for now)

function getTargetsKey(tenantId) {
  return `abschussplan_targets_${tenantId}`;
}

export default function StreckeAbschussplan() {
  const { tenant } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [targets, setTargets] = useState(() => {
    try { return JSON.parse(localStorage.getItem(getTargetsKey(tenant?.id)) || "{}"); } catch { return {}; }
  });
  const [form, setForm] = useState({ species: "", year: new Date().getFullYear(), plan: "" });
  const currentYear = new Date().getFullYear();

  const { data: strecken = [] } = useQuery({
    queryKey: ["strecke", tenant?.id],
    queryFn: () => base44.entities.Strecke.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const [filterRevier, setFilterRevier] = useState("alle");

  const filteredStrecken = strecken.filter(s => {
    if (filterRevier !== "alle" && s.revier_id !== filterRevier) return false;
    return true;
  });

  const currentYearStrecken = filteredStrecken.filter(s => {
    if (!s.date) return false;
    return new Date(s.date).getFullYear() === currentYear;
  });

  const countBySpecies = {};
  SPECIES.forEach(sp => {
    countBySpecies[sp.value] = currentYearStrecken.filter(s => s.species === sp.value).length;
  });

  const saveTarget = () => {
    const key = `${form.species}_${form.year}`;
    const updated = { ...targets, [key]: parseInt(form.plan) };
    setTargets(updated);
    localStorage.setItem(getTargetsKey(tenant?.id), JSON.stringify(updated));
    setDialogOpen(false);
    setForm({ species: "", year: currentYear, plan: "" });
  };

  const getTarget = (species) => targets[`${species}_${currentYear}`] || 0;

  const rows = SPECIES.map(sp => {
    const ist = countBySpecies[sp.value] || 0;
    const soll = getTarget(sp.value);
    const diff = ist - soll;
    return { ...sp, ist, soll, diff };
  }).filter(r => r.soll > 0 || r.ist > 0);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Abschussplan"
        subtitle={`Soll-Ist-Vergleich ${currentYear}`}
        actions={
          <Button onClick={() => setDialogOpen(true)} className="bg-[#22c55e] text-black hover:bg-[#16a34a] rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Planzahl setzen
          </Button>
        }
      />

      {reviere.length > 1 && (
        <div className="mb-4">
          <select value={filterRevier} onChange={e => setFilterRevier(e.target.value)}
            className="text-sm bg-[#2d2d2d] border border-[#3a3a3a] text-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#22c55e]">
            <option value="alle">Alle Reviere</option>
            {reviere.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="bg-[#232323] rounded-2xl border border-[#3a3a3a] p-12 text-center">
          <Crosshair className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">Keine Planzahlen gesetzt</p>
          <p className="text-gray-500 text-sm mt-1">Setzen Sie Abschussziele für die verschiedenen Wildarten.</p>
        </div>
      ) : (
        <div className="bg-[#232323] rounded-2xl border border-[#3a3a3a] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#3a3a3a]">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Wildart</th>
                <th className="text-center px-4 py-3 text-gray-400 font-medium">Soll</th>
                <th className="text-center px-4 py-3 text-gray-400 font-medium">Ist</th>
                <th className="text-center px-4 py-3 text-gray-400 font-medium">Differenz</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Fortschritt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const percent = row.soll > 0 ? Math.min((row.ist / row.soll) * 100, 100) : 0;
                return (
                  <tr key={row.value} className="border-b border-[#3a3a3a] last:border-0 hover:bg-[#2a2a2a]">
                    <td className="px-4 py-4 font-medium text-gray-100">{row.label}</td>
                    <td className="px-4 py-4 text-center text-gray-300">{row.soll}</td>
                    <td className="px-4 py-4 text-center text-gray-100 font-medium">{row.ist}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`flex items-center justify-center gap-1 font-medium ${row.diff > 0 ? "text-emerald-400" : row.diff < 0 ? "text-amber-400" : "text-gray-400"}`}>
                        {row.diff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : row.diff < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                        {row.diff > 0 ? `+${row.diff}` : row.diff}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#3a3a3a] rounded-full h-2">
                          <div className="h-2 rounded-full bg-[#22c55e] transition-all" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-8">{Math.round(percent)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Planzahl Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#2d2d2d] border-[#3a3a3a] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Planzahl setzen</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Wildart *</Label>
              <Select value={form.species} onValueChange={v => setForm({ ...form, species: v })}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                  <SelectValue placeholder="Wildart wählen" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  {SPECIES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Jahr</Label>
              <Input type="number" value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })}
                className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Planzahl *</Label>
              <Input type="number" value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}
                placeholder="z.B. 10" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 border-[#3a3a3a]">Abbrechen</Button>
              <Button onClick={saveTarget} disabled={!form.species || !form.plan}
                className="flex-1 bg-[#22c55e] text-black hover:bg-[#16a34a]">Speichern</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}