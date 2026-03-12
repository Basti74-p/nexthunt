import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import RevierMapCore from "@/components/map/RevierMapCore";
import EinrichtungenLayer from "@/components/map/layers/EinrichtungenLayer";
import WildmanagementLayer from "@/components/map/layers/WildmanagementLayer";
import BoundaryLayer, { REVIER_COLORS } from "@/components/map/layers/BoundaryLayer";
import WindLayer from "@/components/map/layers/WindLayer";
import JagdWetterWidget from "@/components/map/JagdWetterWidget";
import { ChevronDown } from "lucide-react";

export default function MobileMap() {
  const { tenant } = useAuth();
  const [activeLayers] = useState(new Set(["einrichtungen", "sichtungen"]));
  const [selectedRevierId, setSelectedRevierId] = useState(null);
  const [showRevierPicker, setShowRevierPicker] = useState(false);
  const [windData, setWindData] = useState({ deg: null, speed: 0 });
  const [userPos, setUserPos] = useState(null);

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

  // Extract map center for weather (use revier center or Germany fallback)
  const mapLat = userPos?.[0] ?? 51.1657;
  const mapLng = userPos?.[1] ?? 10.4515;

  return (
    <div className="fixed inset-0 bottom-20 z-10">
      <div className="absolute inset-0" style={{ borderRadius: 0 }}>
        <RevierMapCore
          revier={selectedRevier}
          height="100%"
          className="!rounded-none !border-0 !shadow-none"
          onUserLocation={(pos) => setUserPos(pos)}
        >
          {reviere.map((r, i) => <BoundaryLayer key={r.id} revier={r} color={REVIER_COLORS[i % REVIER_COLORS.length]} />)}
          {activeLayers.has("einrichtungen") && <EinrichtungenLayer items={einrichtungen} />}
          {activeLayers.has("sichtungen") && <WildmanagementLayer items={wildmanagement} />}
          {windData.deg !== null && <WindLayer windDeg={windData.deg} windSpeed={windData.speed} />}
        </RevierMapCore>
      </div>

      {/* Weather widget overlays the map */}
      <div className="absolute inset-0 pointer-events-none z-[1000]" style={{ bottom: 0 }}>
        <div className="pointer-events-auto">
          <JagdWetterWidget
            lat={mapLat}
            lng={mapLng}
            onWeatherLoaded={(deg, speed) => setWindData({ deg, speed })}
          />
        </div>
      </div>
    </div>
  );
}