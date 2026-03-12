import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import RevierMapCore from "@/components/map/RevierMapCore";
import EinrichtungenLayer from "@/components/map/layers/EinrichtungenLayer";
import WildmanagementLayer from "@/components/map/layers/WildmanagementLayer";
import { Building2, Eye, ChevronDown } from "lucide-react";

const LAYERS = [
  { id: "einrichtungen", label: "Einrichtungen", icon: Building2 },
  { id: "sichtungen", label: "Sichtungen", icon: Eye },
];

export default function MobileMap() {
  const { tenant } = useAuth();
  const [activeLayers, setActiveLayers] = useState(new Set(["einrichtungen", "sichtungen"]));
  const [selectedRevierId, setSelectedRevierId] = useState(null);
  const [showRevierPicker, setShowRevierPicker] = useState(false);

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant.id }),
    enabled: !!tenant?.id,
    onSuccess: (data) => {
      if (!selectedRevierId && data.length > 0) {
        setSelectedRevierId(data[0].id);
      }
    },
  });

  const selectedRevier = reviere.find(r => r.id === selectedRevierId) || reviere[0] || null;

  const { data: einrichtungen = [] } = useQuery({
    queryKey: ["einrichtungen-map", tenant?.id],
    queryFn: () => base44.entities.Jagdeinrichtung.filter({ tenant_id: tenant.id }),
    enabled: !!tenant?.id,
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

  if (!selectedRevier) {
    return (
      <div className="fixed inset-0 top-0 bottom-20 bg-[#2d2d2d] flex items-center justify-center">
        <p className="text-gray-400">Kein Revier verfügbar</p>
      </div>
    );
  }

  return (
    // Vollbild: von Top-Bar (top-14) bis Bottom-Nav (bottom-20)
    <div className="fixed inset-0 top-0 bottom-20 z-10">
      {/* Karte füllt den gesamten Bereich */}
      <RevierMapCore
        revier={selectedRevier}
        height="100%"
        className="rounded-none border-0"
      >
        {activeLayers.has("einrichtungen") && <EinrichtungenLayer items={einrichtungen} />}
        {activeLayers.has("sichtungen") && <WildmanagementLayer items={wildmanagement} />}
      </RevierMapCore>

      {/* Revier-Auswahl oben links (nur wenn mehrere Reviere) */}
      {reviere.length > 1 && (
        <div className="absolute top-4 left-16 z-[1001]">
          <button
            onClick={() => setShowRevierPicker(!showRevierPicker)}
            className="flex items-center gap-1.5 bg-white rounded-xl shadow-md px-3 py-2 text-sm font-medium text-gray-800 border border-gray-100 active:scale-95 transition-transform"
          >
            {selectedRevier.name}
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          {showRevierPicker && (
            <div className="mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-w-[160px]">
              {reviere.map(r => (
                <button
                  key={r.id}
                  onClick={() => { setSelectedRevierId(r.id); setShowRevierPicker(false); }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    r.id === selectedRevier.id
                      ? "bg-[#0F2F23]/5 text-[#0F2F23] font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Layer-Toggle unten links, über der Bottom-Nav */}
      <div className="absolute bottom-4 left-4 z-[1001] flex flex-col gap-2">
        {LAYERS.map(layer => (
          <button
            key={layer.id}
            onClick={() => toggleLayer(layer.id)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl shadow-md text-sm font-medium border transition-all active:scale-95 ${
              activeLayers.has(layer.id)
                ? "bg-[#22c55e] text-black border-[#22c55e]"
                : "bg-white text-gray-500 border-gray-100"
            }`}
          >
            <layer.icon className="w-4 h-4" />
            {layer.label}
          </button>
        ))}
      </div>

      {/* Statistik-Pill unten mittig */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1001]">
        <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
          {einrichtungen.filter(e => e.latitude).length} Einr. · {wildmanagement.filter(w => w.latitude).length} Sich.
        </div>
      </div>
    </div>
  );
}