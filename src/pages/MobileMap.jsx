import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import RevierMapCore from "@/components/map/RevierMapCore";
import EinrichtungenLayer from "@/components/map/layers/EinrichtungenLayer";
import WildmanagementLayer from "@/components/map/layers/WildmanagementLayer";
import BoundaryLayer, { REVIER_COLORS } from "@/components/map/layers/BoundaryLayer";
import { ChevronDown } from "lucide-react";

export default function MobileMap() {
  const { tenant } = useAuth();
  const [activeLayers] = useState(new Set(["einrichtungen", "sichtungen"]));
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

  if (!selectedRevier) {
    return (
      <div className="fixed inset-0 top-0 bottom-20 bg-[#2d2d2d] flex items-center justify-center">
        <p className="text-gray-400">Kein Revier verfügbar</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bottom-20 z-10">
      {/* Karte füllt exakt den ganzen Bereich */}
      <div className="absolute inset-0" style={{ borderRadius: 0 }}>
        <RevierMapCore
          revier={selectedRevier}
          height="100%"
          className="!rounded-none !border-0 !shadow-none"
        >
          {reviere.map((r, i) => <BoundaryLayer key={r.id} revier={r} color={REVIER_COLORS[i % REVIER_COLORS.length]} />)}
          {activeLayers.has("einrichtungen") && <EinrichtungenLayer items={einrichtungen} />}
          {activeLayers.has("sichtungen") && <WildmanagementLayer items={wildmanagement} />}
        </RevierMapCore>
      </div>




    </div>
  );
}