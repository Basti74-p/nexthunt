import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, CheckCircle, Thermometer, Weight, Plus, Archive, ShoppingCart, Layers, ChevronRight } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";
import WildkammerEingangDialog from "@/components/wildkammer/WildkammerEingangDialog";
import WildkammerDetailSheet from "@/components/wildkammer/WildkammerDetailSheet";

const SPECIES_LABEL = {
  rotwild: "Rotwild", schwarzwild: "Schwarzwild", rehwild: "Rehwild",
  damwild: "Damwild", sikawild: "Sikawild", wolf: "Wolf",
};

const SPECIES_EMOJI = {
  rotwild: "🦌", schwarzwild: "🐗", rehwild: "🦌", damwild: "🦌", sikawild: "🦌", wolf: "🐺",
};

const STATUS_CONFIG = {
  eingang:     { label: "Eingang",     color: "bg-blue-500/20 text-blue-300 border border-blue-500/30" },
  verarbeitung:{ label: "Verarbeitung",color: "bg-amber-500/20 text-amber-300 border border-amber-500/30" },
  lager:       { label: "Lager",       color: "bg-green-500/20 text-green-300 border border-green-500/30" },
  ausgabe:     { label: "Ausgabe",     color: "bg-purple-500/20 text-purple-300 border border-purple-500/30" },
  verkauft:    { label: "Verkauft",    color: "bg-gray-600/40 text-gray-400 border border-gray-600/30" },
};

const FILTERS = [
  { key: "alle", label: "Alle" },
  { key: "eingang", label: "Eingang" },
  { key: "verarbeitung", label: "Verarbeitung" },
  { key: "lager", label: "Lager" },
  { key: "ausgabe", label: "Ausgabe" },
];

export default function MobileWildkammer() {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  const [showEingang, setShowEingang] = useState(false);
  const [filterStatus, setFilterStatus] = useState("alle");
  const [selectedItem, setSelectedItem] = useState(null);

  const { data: wildkammer = [], isLoading } = useQuery({
    queryKey: ["wildkammer-mobile", tenant?.id],
    queryFn: () => base44.entities.Wildkammer.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const revierName = (id) => reviere.find((r) => r.id === id)?.name || "–";

  const filtered = filterStatus === "alle"
    ? wildkammer
    : wildkammer.filter((w) => w.status === filterStatus);

  const aktiv = wildkammer.filter((w) => !["verkauft", "ausgabe"].includes(w.status)).length;
  const freigegeben = wildkammer.filter((w) => w.freigabe).length;
  const imLager = wildkammer.filter((w) => w.status === "lager").length;
  const verkauft = wildkammer.filter((w) => w.status === "verkauft").length;

  if (!tenant) {
    return <div className="text-center py-12 text-gray-400">Bitte wählen Sie einen Tenant aus.</div>;
  }

  return (
    <PageTransition>
      <div className="pb-28 px-4 pt-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white text-2xl font-bold tracking-tight">Wildkammer</h2>
            <p className="text-gray-500 text-xs mt-0.5">{wildkammer.length} Einträge gesamt</p>
          </div>
          <button
            onClick={() => setShowEingang(true)}
            className="flex items-center gap-2 bg-[#22c55e] text-black font-semibold text-sm px-4 py-2.5 rounded-xl active:scale-95 transition-transform shadow-lg shadow-[#22c55e]/20"
          >
            <Plus className="w-4 h-4" />
            Eingang
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className="bg-[#252525] rounded-2xl p-4 border border-[#333]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#22c55e]/15 flex items-center justify-center">
                <Layers className="w-4 h-4 text-[#22c55e]" />
              </div>
              <span className="text-xs text-gray-400">Aktiv</span>
            </div>
            <p className="text-2xl font-bold text-white">{aktiv}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">im Lager</p>
          </div>

          <div className="bg-[#252525] rounded-2xl p-4 border border-[#333]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs text-gray-400">Freigabe</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{freigegeben}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">freigegeben</p>
          </div>

          <div className="bg-[#252525] rounded-2xl p-4 border border-[#333]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Archive className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs text-gray-400">Lager</span>
            </div>
            <p className="text-2xl font-bold text-white">{imLager}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">eingelagert</p>
          </div>

          <div className="bg-[#252525] rounded-2xl p-4 border border-[#333]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xs text-gray-400">Verkauft</span>
            </div>
            <p className="text-2xl font-bold text-white">{verkauft}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">abgegeben</p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`shrink-0 text-xs px-4 py-2 rounded-full font-medium transition-all active:scale-95 ${
                filterStatus === key
                  ? "bg-[#22c55e] text-black shadow-md shadow-[#22c55e]/20"
                  : "bg-[#2a2a2a] text-gray-400 border border-[#3a3a3a]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-[#252525] rounded-2xl animate-pulse border border-[#333]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-[#252525] rounded-2xl flex items-center justify-center mb-3 border border-[#333]">
              <Package className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Keine Einträge</p>
            <p className="text-gray-600 text-xs mt-1">Noch keine Wildkammer-Einträge</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((w) => {
              const statusCfg = STATUS_CONFIG[w.status] || { label: w.status, color: "bg-gray-700 text-gray-400 border border-gray-600" };
              const emoji = SPECIES_EMOJI[w.species] || "🦌";
              return (
                <div
                  key={w.id}
                  onClick={() => setSelectedItem(w)}
                  className="bg-[#252525] rounded-2xl border border-[#333] p-4 active:bg-[#2a2a2a] transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    {/* Species icon */}
                    <div className="w-11 h-11 rounded-xl bg-[#1e1e1e] flex items-center justify-center text-xl shrink-0">
                      {emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Top row: species + status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-100 text-sm">
                          {SPECIES_LABEL[w.species] || w.species}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        {w.freigabe && (
                          <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Freigabe
                          </span>
                        )}
                      </div>

                      {/* Date & Revier */}
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                        <span>{w.eingang_datum}</span>
                        {w.eingang_zeit && <><span>·</span><span>{w.eingang_zeit}</span></>}
                        <span>·</span>
                        <span className="text-gray-400 truncate">{revierName(w.revier_id)}</span>
                      </div>

                      {/* Weight & Temp */}
                      {(w.gewicht_aufgebrochen || w.kuehltemperatur != null) && (
                        <div className="flex items-center gap-3 mt-2">
                          {w.gewicht_aufgebrochen && (
                            <span className="flex items-center gap-1 text-xs text-gray-500 bg-[#1e1e1e] px-2 py-1 rounded-lg">
                              <Weight className="w-3 h-3" />
                              {w.gewicht_aufgebrochen} kg
                            </span>
                          )}
                          {w.kuehltemperatur != null && (
                            <span className="flex items-center gap-1 text-xs text-gray-500 bg-[#1e1e1e] px-2 py-1 rounded-lg">
                              <Thermometer className="w-3 h-3" />
                              {w.kuehltemperatur}°C
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 shrink-0 self-center ml-1" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <WildkammerDetailSheet
        item={selectedItem}
        revierName={selectedItem ? revierName(selectedItem.revier_id) : ""}
        onClose={() => setSelectedItem(null)}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["wildkammer-mobile", tenant?.id] });
          setSelectedItem(null);
        }}
        onDeleted={() => {
          queryClient.invalidateQueries({ queryKey: ["wildkammer-mobile", tenant?.id] });
        }}
      />

      <WildkammerEingangDialog
        isOpen={showEingang}
        onClose={() => setShowEingang(false)}
        tenant={tenant}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["wildkammer-mobile", tenant?.id] });
          setShowEingang(false);
        }}
      />
    </PageTransition>
  );
}