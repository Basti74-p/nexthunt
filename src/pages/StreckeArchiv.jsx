import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, Trash2, RotateCcw } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SPECIES_LABEL = {
  rotwild: "Rotwild", schwarzwild: "Schwarzwild", rehwild: "Rehwild",
  damwild: "Damwild", sikawild: "Sikawild", wolf: "Wolf",
};
const SPECIES_COLORS = {
  rotwild: "#ef4444", schwarzwild: "#1f2937", rehwild: "#84cc16",
  damwild: "#f59e0b", sikawild: "#8b5cf6", wolf: "#64748b",
};

export default function StreckeArchiv() {
  const { tenant } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editDialog, setEditDialog] = useState(null);
  const queryClient = useQueryClient();

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

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Strecke.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strecke"] });
      setEditDialog(null);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id) => base44.entities.Strecke.update(id, { status: "erfasst" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strecke"] });
      setEditDialog(null);
    },
  });

  const years = [...new Set(strecken.map(s => s.date ? new Date(s.date).getFullYear() : null).filter(Boolean))].sort((a, b) => b - a);
  if (!years.includes(selectedYear) && years.length > 0) { /* no-op, user can select */ }

  const yearStrecken = strecken.filter(s => s.date && new Date(s.date).getFullYear() === selectedYear);
  const revierName = (id) => reviere.find(r => r.id === id)?.name || "–";

  // Monthly chart data
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthData = { month: format(new Date(selectedYear, i, 1), "MMM", { locale: de }) };
    Object.keys(SPECIES_LABEL).forEach(sp => {
      monthData[sp] = yearStrecken.filter(s => new Date(s.date).getMonth() === i && s.species === sp).length;
    });
    return monthData;
  });

  const speciesInYear = Object.keys(SPECIES_LABEL).filter(sp => yearStrecken.some(s => s.species === sp));

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Archiv" subtitle={`${yearStrecken.length} Stück in ${selectedYear}`} />

      {/* Year filter */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {years.length > 0 ? years.map(y => (
          <button key={y} onClick={() => setSelectedYear(y)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedYear === y ? "bg-[#22c55e] text-black" : "bg-[#232323] border border-[#3a3a3a] text-gray-300 hover:border-[#22c55e]/40"}`}>
            {y}
          </button>
        )) : (
          <p className="text-gray-500 text-sm">Keine Daten vorhanden</p>
        )}
      </div>

      {yearStrecken.length === 0 ? (
        <EmptyState icon={Archive} title="Keine Daten" description={`Für ${selectedYear} sind keine Streckeneinträge vorhanden.`} />
      ) : (
        <>
          {/* Summary by species */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
            {speciesInYear.map(sp => (
              <div key={sp} className="bg-[#232323] rounded-2xl border border-[#3a3a3a] p-3 text-center">
                <p className="text-xl font-bold text-gray-100">{yearStrecken.filter(s => s.species === sp).length}</p>
                <p className="text-xs text-gray-400 mt-0.5">{SPECIES_LABEL[sp]}</p>
              </div>
            ))}
          </div>

          {/* Monthly chart */}
          <div className="bg-[#232323] rounded-2xl border border-[#3a3a3a] p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Monatliche Strecke {selectedYear}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={months} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #3a3a3a", borderRadius: 8, color: "#e5e5e5" }} />
                <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 11 }} />
                {speciesInYear.map(sp => (
                  <Bar key={sp} dataKey={sp} name={SPECIES_LABEL[sp]} stackId="a" fill={SPECIES_COLORS[sp] || "#22c55e"} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="bg-[#232323] rounded-2xl border border-[#3a3a3a] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#3a3a3a]">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Datum</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Wildart</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Geschlecht</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Altersklasse</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Revier</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Gewicht</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                   {yearStrecken.sort((a, b) => new Date(b.date) - new Date(a.date)).map((item, i) => (
                     <tr key={item.id} className={`border-b border-[#3a3a3a] last:border-0 hover:bg-[#2a2a2a] cursor-pointer ${i % 2 === 1 ? "bg-[#282828]" : ""}`} onClick={() => setEditDialog(item)}>
                       <td className="px-4 py-3 text-gray-200">{format(new Date(item.date), "dd.MM.yyyy", { locale: de })}</td>
                       <td className="px-4 py-3 font-medium text-gray-100">{SPECIES_LABEL[item.species] || item.species}</td>
                       <td className="px-4 py-3 text-gray-300">{item.gender === "maennlich" ? "Männlich" : item.gender === "weiblich" ? "Weiblich" : "Unbekannt"}</td>
                       <td className="px-4 py-3 text-gray-300">{item.age_class || "–"}</td>
                       <td className="px-4 py-3 text-gray-300">{revierName(item.revier_id)}</td>
                       <td className="px-4 py-3 text-gray-300">{item.weight_kg ? `${item.weight_kg} kg` : "–"}</td>
                       <td className="px-4 py-3">
                         <span className="text-xs text-gray-400 capitalize">{item.status}</span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
              </table>
            </div>
          </div>
        </>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editDialog} onOpenChange={(open) => !open && setEditDialog(null)}>
          <DialogContent className="bg-[#232323] border-[#3a3a3a]">
            <DialogHeader>
              <DialogTitle className="text-gray-100">Archiveintrag bearbeiten</DialogTitle>
              <DialogDescription className="text-gray-400">
                {SPECIES_LABEL[editDialog?.species]} • {editDialog?.age_class} • {editDialog?.date ? format(new Date(editDialog.date), "dd.MM.yyyy", { locale: de }) : "–"}
              </DialogDescription>
            </DialogHeader>
         <div className="space-y-4">
           <div className="bg-[#1a1a1a] rounded-lg p-3 text-sm text-gray-300">
             <p><strong>Revier:</strong> {revierName(editDialog?.revier_id)}</p>
             <p><strong>Gewicht:</strong> {editDialog?.weight_kg ? `${editDialog?.weight_kg} kg` : "–"}</p>
             <p><strong>Geschlecht:</strong> {editDialog?.gender === "maennlich" ? "Männlich" : editDialog?.gender === "weiblich" ? "Weiblich" : "Unbekannt"}</p>
           </div>
           <div className="flex gap-2">
             <Button
               variant="outline"
               className="flex-1 gap-2 border-[#3a3a3a] hover:bg-[#2a2a2a]"
               onClick={() => restoreMutation.mutate(editDialog?.id)}
               disabled={restoreMutation.isPending}
             >
               <RotateCcw className="w-4 h-4" />
               Zur Wildkammer zurück
             </Button>
             <Button
               variant="destructive"
               className="flex-1 gap-2"
               onClick={() => deleteMutation.mutate(editDialog?.id)}
               disabled={deleteMutation.isPending}
             >
               <Trash2 className="w-4 h-4" />
               Löschen
             </Button>
           </div>
         </div>
        </DialogContent>
        </Dialog>
        </div>
        );
        }