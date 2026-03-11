/**
 * RevierMap – Karten-Tab im Revier.
 * Verwendet die zentrale RevierMapCore-Basis mit allen verfügbaren Layern.
 */
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import RevierMapCore from "@/components/map/RevierMapCore";
import EinrichtungenLayer from "@/components/map/layers/EinrichtungenLayer";
import WildmanagementLayer from "@/components/map/layers/WildmanagementLayer";
import { useMobile } from "@/components/hooks/useMobile";
import { Building2, Eye, Map as MapIcon } from "lucide-react";

const LAYERS = [
  { id: "einrichtungen", label: "Jagdeinrichtungen", icon: Building2 },
  { id: "sichtungen", label: "Sichtungen", icon: Eye },
];

export default function RevierMap({ revier }) {
  const [activeLayers, setActiveLayers] = useState(new Set(["einrichtungen", "sichtungen"]));
  const isMobile = useMobile();
  const queryClient = useQueryClient();

  const deleteEinrichtung = useMutation({
    mutationFn: (id) => base44.entities.Jagdeinrichtung.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["einrichtungen", revier.id]),
  });

  const { data: einrichtungen = [] } = useQuery({
    queryKey: ["einrichtungen", revier.id],
    queryFn: () => base44.entities.Jagdeinrichtung.filter({ revier_id: revier.id }),
  });

  const { data: wildmanagement = [] } = useQuery({
    queryKey: ["wildmanagement", revier.id],
    queryFn: () => base44.entities.WildManagement.filter({ revier_id: revier.id }),
  });

  const toggleLayer = (id) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className={isMobile ? "fixed inset-0 top-14 bottom-20 bg-white flex flex-col z-40" : "space-y-3"}>
      {/* Layer toggles */}
      {isMobile ? (
        <div className={`bg-[#2d2d2d] border-b border-gray-700 px-4 py-3 space-y-3`}>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Layer:</p>
            <div className="flex gap-2 flex-wrap">
              {LAYERS.map(l => (
                <button
                  key={l.id}
                  onClick={() => toggleLayer(l.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border font-medium transition-all text-sm ${
                    activeLayers.has(l.id)
                      ? "bg-[#22c55e] text-black border-[#22c55e]"
                      : "bg-[#1a1a1a] text-gray-400 border-gray-600 hover:border-gray-500"
                  }`}
                >
                  <l.icon className="w-4 h-4" />
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Layer:</span>
          {LAYERS.map(l => (
            <button
              key={l.id}
              onClick={() => toggleLayer(l.id)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                activeLayers.has(l.id)
                  ? "bg-[#0F2F23] text-white border-[#0F2F23]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              <l.icon className="w-3.5 h-3.5" />
              {l.label}
            </button>
          ))}
        </div>
      )}

      {/* Central map */}
      <div className={isMobile ? "flex-1 overflow-hidden" : ""}>
        <RevierMapCore revier={revier} height={isMobile ? "100%" : "520px"}>
          {activeLayers.has("einrichtungen") && <EinrichtungenLayer items={einrichtungen} onDelete={(id) => deleteEinrichtung.mutate(id)} />}
          {activeLayers.has("sichtungen") && <WildmanagementLayer items={wildmanagement} />}
        </RevierMapCore>
      </div>

      {!isMobile && (
        <p className="text-xs text-gray-400 text-center">
          {einrichtungen.filter(e => e.latitude).length} Einrichtungen · {wildmanagement.filter(w => w.latitude).length} Sichtungen auf der Karte
        </p>
      )}
    </div>
  );
}