/**
 * RevierMap – Karten-Tab im Revier.
 * Verwendet die zentrale RevierMapCore-Basis mit allen verfügbaren Layern.
 */
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import RevierMapCore from "@/components/map/RevierMapCore";
import EinrichtungenLayer from "@/components/map/layers/EinrichtungenLayer";
import WildmanagementLayer from "@/components/map/layers/WildmanagementLayer";
import { Building2, Eye, Map as MapIcon } from "lucide-react";

const LAYERS = [
  { id: "einrichtungen", label: "Jagdeinrichtungen", icon: Building2 },
  { id: "sichtungen", label: "Sichtungen", icon: Eye },
];

export default function RevierMap({ revier }) {
  const [activeLayers, setActiveLayers] = useState(new Set(["einrichtungen", "sichtungen"]));

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
    <div className="space-y-3">
      {/* Layer toggles */}
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

      {/* Central map */}
      <RevierMapCore revier={revier} height="520px">
        {activeLayers.has("einrichtungen") && <EinrichtungenLayer items={einrichtungen} />}
        {activeLayers.has("sichtungen") && <WildmanagementLayer items={wildmanagement} />}
      </RevierMapCore>

      <p className="text-xs text-gray-400 text-center">
        {einrichtungen.filter(e => e.latitude).length} Einrichtungen · {wildmanagement.filter(w => w.latitude).length} Sichtungen auf der Karte
      </p>
    </div>
  );
}