import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Truck, RotateCcw, FileText } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const SPECIES_LABEL = {
  rotwild: "Rotwild", schwarzwild: "Schwarzwild", rehwild: "Rehwild",
  damwild: "Damwild", sikawild: "Sikawild", wolf: "Wolf",
};
const GENDER_LABEL = { maennlich: "Männlich", weiblich: "Weiblich", unbekannt: "Unbekannt" };

export default function StreckeWildverkauf() {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();

  const { data: wildkammer = [] } = useQuery({
    queryKey: ["wildkammer", tenant?.id],
    queryFn: () => base44.entities.Wildkammer.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Wildkammer.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wildkammer"] }),
  });

  const verkauftItems = wildkammer.filter(s => s.status === "verkauft");
  const revierName = (id) => reviere.find(r => r.id === id)?.name || "–";

  const handleGenerateInvoice = async (kundenName) => {
    const kundenItems = verkauftItems.filter(s => s.ausgabe_an === kundenName);
    const { data } = await base44.functions.invoke('generateInvoice', {
      tenant_id: tenant?.id,
      customer_name: kundenName,
      items: kundenItems
    });
    const blob = new Blob([data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rechnung_${kundenName}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  // Simple stats
  const totalWeight = verkauftItems.reduce((sum, s) => sum + (s.gewicht_kalt || 0), 0);
  const bySpecies = {};
  verkauftItems.forEach(s => { bySpecies[s.species] = (bySpecies[s.species] || 0) + 1; });

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Wildverkauf" subtitle={`${verkauftItems.length} Stück verkauft`} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-[#232323] rounded-2xl border border-[#3a3a3a] p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{verkauftItems.length}</p>
          <p className="text-xs text-gray-400 mt-1">Stück verkauft</p>
        </div>
        <div className="bg-[#232323] rounded-2xl border border-[#3a3a3a] p-4 text-center">
          <p className="text-2xl font-bold text-gray-100">{totalWeight > 0 ? `${totalWeight.toFixed(1)} kg` : "–"}</p>
          <p className="text-xs text-gray-400 mt-1">Gesamtgewicht</p>
        </div>
        <div className="bg-[#232323] rounded-2xl border border-[#3a3a3a] p-4 text-center">
          <p className="text-2xl font-bold text-gray-100">{Object.keys(bySpecies).length}</p>
          <p className="text-xs text-gray-400 mt-1">Wildarten</p>
        </div>
      </div>

      {verkauftItems.length === 0 ? (
        <EmptyState icon={Truck} title="Keine Verkäufe" description="Einträge mit Status 'Verkauft' erscheinen hier." />
      ) : (
        <div className="bg-[#232323] rounded-2xl border border-[#3a3a3a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#3a3a3a]">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Datum</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Wildart</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Altersklasse</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Geschlecht</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Kaltgewicht</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Käufer / Empfänger</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Preis</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {verkauftItems.map((item, i) => (
                  <tr key={item.id} className={`border-b border-[#3a3a3a] last:border-0 hover:bg-[#2a2a2a] ${i % 2 === 1 ? "bg-[#282828]" : ""}`}>
                    <td className="px-4 py-3 text-gray-200">{item.ausgabe_datum ? format(new Date(item.ausgabe_datum), "dd.MM.yyyy", { locale: de }) : "–"}</td>
                    <td className="px-4 py-3 font-medium text-gray-100">{SPECIES_LABEL[item.species] || item.species}</td>
                    <td className="px-4 py-3 text-gray-300">{item.age_class || "–"}</td>
                    <td className="px-4 py-3 text-gray-300">{GENDER_LABEL[item.gender] || item.gender}</td>
                    <td className="px-4 py-3 text-gray-300">{item.gewicht_kalt ? `${item.gewicht_kalt} kg` : "–"}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{item.ausgabe_an || "–"}</td>
                    <td className="px-4 py-3 text-gray-300 font-medium">{item.verkaufspreis ? `€ ${item.verkaufspreis.toFixed(2)}` : "–"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => updateMutation.mutate({ id: item.id, data: { status: "lager" } })}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors ml-auto"
                        title="Zurück ins Lager"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}