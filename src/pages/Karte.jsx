import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import RevierMapCore from "@/components/map/RevierMapCore";
import EinrichtungenLayer from "@/components/map/layers/EinrichtungenLayer";
import WildmanagementLayer from "@/components/map/layers/WildmanagementLayer";
import { Building2, Eye, Map as MapIcon } from "lucide-react";

const LAYERS = [
  { id: "einrichtungen", label: "Jagdeinrichtungen", icon: Building2 },
  { id: "sichtungen", label: "Sichtungen", icon: Eye },
];

export default function Karte() {
  const { tenant } = useAuth();
  const [activeLayers, setActiveLayers] = useState(new Set(["einrichtungen", "sichtungen"]));
  const [selectedRevierId, setSelectedRevierId] = useState(null);

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant.id }),
    enabled: !!tenant?.id,
  });

  const selectedRevier = reviere.find(r => r.id === selectedRevierId) || reviere[0] || null;

  const { data: einrichtungen = [] } = useQuery({
    queryKey: ["einrichtungen", selectedRevier?.id],
    queryFn: () => base44.entities.Jagdeinrichtung.filter({ revier_id: selectedRevier.id }),
    enabled: !!selectedRevier?.id,
  });

  const { data: wildmanagement = [] } = useQuery({
    queryKey: ["wildmanagement-map", selectedRevier?.id],
    queryFn: () => base44.entities.WildManagement.filter({ revier_id: selectedRevier.id }),
    enabled: !!selectedRevier?.id,
  });

  const toggleLayer = (id) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <MapIcon className="w-5 h-5 text-[#22c55e]" />
          <h1 className="text-xl font-bold text-gray-100">Karte</h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Revier selector */}
          {reviere.length > 1 && (
            <select
              value={selectedRevier?.id || ""}
              onChange={e => setSelectedRevierId(e.target.value)}
              className="text-sm bg-[#2d2d2d] border border-[#3a3a3a] text-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#22c55e]"
            >
              {reviere.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}

          {/* Layer toggles */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Layer:</span>
            {LAYERS.map(l => (
              <button
                key={l.id}
                onClick={() => toggleLayer(l.id)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                  activeLayers.has(l.id)
                    ? "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/40"
                    : "bg-[#2d2d2d] text-gray-500 border-[#3a3a3a] hover:border-gray-500"
                }`}
              >
                <l.icon className="w-3.5 h-3.5" />
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedRevier ? (
        <>
          <RevierMapCore revier={selectedRevier} height="calc(100vh - 180px)">
            {activeLayers.has("einrichtungen") && <EinrichtungenLayer items={einrichtungen} />}
            {activeLayers.has("sichtungen") && <WildmanagementLayer items={wildmanagement} />}
          </RevierMapCore>
          <p className="text-xs text-gray-500 text-center">
            {einrichtungen.filter(e => e.latitude).length} Einrichtungen · {wildmanagement.filter(w => w.latitude).length} Sichtungen · {selectedRevier.name}
          </p>
        </>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          Kein Revier verfügbar
        </div>
      )}
    </div>
  );
}