import React from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const SPECIES_LABEL = {
  rotwild: "Rotwild", schwarzwild: "Schwarzwild", rehwild: "Rehwild",
  damwild: "Damwild", sikawild: "Sikawild", wolf: "Wolf",
};
const GENDER_LABEL = { maennlich: "Männlich", weiblich: "Weiblich", unbekannt: "Unbekannt" };

const NEXT_STATUS = {
  wildkammer: "verkauft",
  bestaetigt: "wildkammer",
};

export default function StreckeWildkammer() {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();

  const { data: strecken = [], isLoading } = useQuery({
    queryKey: ["strecke", tenant?.id],
    queryFn: () => base44.entities.Strecke.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Strecke.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["strecke"] }),
  });

  // Show wildkammer items + bestätigt (ready to move into wildkammer)
  const items = strecken.filter(s => s.status === "wildkammer" || s.status === "bestaetigt");
  const wildkammerItems = items.filter(s => s.status === "wildkammer");
  const bereitItems = items.filter(s => s.status === "bestaetigt");

  const revierName = (id) => reviere.find(r => r.id === id)?.name || "–";

  const renderRow = (item) => (
    <tr key={item.id} className="border-b border-[#3a3a3a] last:border-0 hover:bg-[#2a2a2a] transition-colors">
      <td className="px-4 py-3 text-gray-200">{item.date ? format(new Date(item.date), "dd.MM.yyyy", { locale: de }) : "–"}</td>
      <td className="px-4 py-3 font-medium text-gray-100">{SPECIES_LABEL[item.species] || item.species}</td>
      <td className="px-4 py-3 text-gray-300">{GENDER_LABEL[item.gender] || item.gender}</td>
      <td className="px-4 py-3 text-gray-300">{item.age_class || "–"}</td>
      <td className="px-4 py-3 text-gray-300">{revierName(item.revier_id)}</td>
      <td className="px-4 py-3 text-gray-300">{item.weight_kg ? `${item.weight_kg} kg` : "–"}</td>
      <td className="px-4 py-3">
        {NEXT_STATUS[item.status] && (
          <button
            onClick={() => updateMutation.mutate({ id: item.id, data: { status: NEXT_STATUS[item.status] } })}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              item.status === "bestaetigt"
                ? "bg-purple-900/40 text-purple-300 hover:bg-purple-800/50"
                : "bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800/50"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {item.status === "bestaetigt" ? "→ Wildkammer" : "→ Verkauft"}
          </button>
        )}
      </td>
    </tr>
  );

  const tableHead = (
    <thead>
      <tr className="border-b border-[#3a3a3a]">
        <th className="text-left px-4 py-3 text-gray-400 font-medium">Datum</th>
        <th className="text-left px-4 py-3 text-gray-400 font-medium">Wildart</th>
        <th className="text-left px-4 py-3 text-gray-400 font-medium">Geschlecht</th>
        <th className="text-left px-4 py-3 text-gray-400 font-medium">Altersklasse</th>
        <th className="text-left px-4 py-3 text-gray-400 font-medium">Revier</th>
        <th className="text-left px-4 py-3 text-gray-400 font-medium">Gewicht</th>
        <th className="text-left px-4 py-3 text-gray-400 font-medium">Aktion</th>
      </tr>
    </thead>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Wildkammer" subtitle={`${wildkammerItems.length} Stück in der Kammer`} />

      {bereitItems.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Bereit für Wildkammer (Bestätigt)</h2>
          <div className="bg-[#232323] rounded-2xl border border-blue-900/40 overflow-hidden">
            <table className="w-full text-sm">
              {tableHead}
              <tbody>{bereitItems.map(renderRow)}</tbody>
            </table>
          </div>
        </div>
      )}

      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">In der Wildkammer</h2>
      {wildkammerItems.length === 0 ? (
        <EmptyState icon={Archive} title="Wildkammer leer" description="Bestätigte Einträge können in die Wildkammer verschoben werden." />
      ) : (
        <div className="bg-[#232323] rounded-2xl border border-[#3a3a3a] overflow-hidden">
          <table className="w-full text-sm">
            {tableHead}
            <tbody>{wildkammerItems.map(renderRow)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}