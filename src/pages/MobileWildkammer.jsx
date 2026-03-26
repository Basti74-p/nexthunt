import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, CheckCircle, Clock, ChevronRight, Thermometer, Weight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/ui/PageTransition";
import WildkammerEingangDialog from "@/components/wildkammer/WildkammerEingangDialog";
import { Button } from "@/components/ui/button";

const SPECIES_LABEL = {
  rotwild: "Rotwild", schwarzwild: "Schwarzwild", rehwild: "Rehwild",
  damwild: "Damwild", sikawild: "Sikawild", wolf: "Wolf",
};

const STATUS_CONFIG = {
  eingang: { label: "Eingang", color: "bg-blue-900/40 text-blue-300" },
  verarbeitung: { label: "Verarbeitung", color: "bg-yellow-900/40 text-yellow-300" },
  lager: { label: "Lager", color: "bg-green-900/40 text-green-300" },
  ausgabe: { label: "Ausgabe", color: "bg-purple-900/40 text-purple-300" },
  verkauft: { label: "Verkauft", color: "bg-gray-700 text-gray-400" },
};

export default function MobileWildkammer() {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  const [showEingang, setShowEingang] = useState(false);
  const [filterStatus, setFilterStatus] = useState("alle");

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

  if (!tenant) {
    return <div className="text-center py-12 text-gray-400">Bitte wählen Sie einen Tenant aus.</div>;
  }

  return (
    <PageTransition>
      <div className="pt-20 pb-24 px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-slate-50 text-xl font-bold select-none">Wildkammer</h2>
          <Button
            onClick={() => setShowEingang(true)}
            className="bg-[#22c55e] text-black hover:bg-[#16a34a] text-sm px-3 h-8"
          >
            + Eingang
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-[#3a3a3a] rounded-lg p-3 text-center border border-[#4a4a4a]">
            <p className="text-lg font-bold text-gray-100">{aktiv}</p>
            <p className="text-xs text-gray-400">Aktiv im Lager</p>
          </div>
          <div className="bg-green-900/30 rounded-lg p-3 text-center border border-green-900/50">
            <p className="text-lg font-bold text-green-400">{freigegeben}</p>
            <p className="text-xs text-green-400">Freigegeben</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { key: "alle", label: "Alle" },
            { key: "eingang", label: "Eingang" },
            { key: "verarbeitung", label: "Verarbeitung" },
            { key: "lager", label: "Lager" },
            { key: "ausgabe", label: "Ausgabe" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filterStatus === key
                  ? "bg-[#22c55e] text-black border-[#22c55e]"
                  : "bg-[#3a3a3a] text-gray-400 border-[#4a4a4a]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Laden...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-10 h-10 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500 text-sm">Keine Einträge</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((w) => {
              const statusCfg = STATUS_CONFIG[w.status] || { label: w.status, color: "bg-gray-700 text-gray-400" };
              return (
                <div
                  key={w.id}
                  className="bg-[#3a3a3a] rounded-lg border border-[#4a4a4a] p-3 flex items-start justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-100 text-sm">
                        {SPECIES_LABEL[w.species] || w.species}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      {w.freigabe && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{w.eingang_datum}</span>
                      {w.eingang_zeit && <span>{w.eingang_zeit}</span>}
                      <span>· {revierName(w.revier_id)}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {w.gewicht_aufgebrochen && (
                        <span className="flex items-center gap-1">
                          <Weight className="w-3 h-3" />
                          {w.gewicht_aufgebrochen} kg
                        </span>
                      )}
                      {w.kuehltemperatur != null && (
                        <span className="flex items-center gap-1">
                          <Thermometer className="w-3 h-3" />
                          {w.kuehltemperatur}°C
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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