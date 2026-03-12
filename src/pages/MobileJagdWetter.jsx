import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import JagdWetterWidget from "@/components/map/JagdWetterWidget";

export default function MobileJagdWetter() {
  const { user } = useAuth();
  const [userPos, setUserPos] = useState(null);

  // Default to Germany center or user location
  const mapLat = userPos?.[0] ?? 51.1657;
  const mapLng = userPos?.[1] ?? 10.4515;

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <JagdWetterWidget
          lat={mapLat}
          lng={mapLng}
          onWeatherLoaded={() => {}}
        />
      </div>
    </div>
  );
}