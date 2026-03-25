import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import PageHeader from "@/components/ui/PageHeader";
import { AlertCircle, MapPin, Clock } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";

// Custom marker icon
const personIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function AdminPersonTracking() {
  const { user, tenant, isPlatformAdmin } = useAuth();
  const [personLocations, setPersonLocations] = useState([]);
  const [mapCenter, setMapCenter] = useState([51.1657, 10.4515]); // Germany center

  // Fetch all persons with location data
  const { data: persons = [] } = useQuery({
    queryKey: ["personsWithLocation", tenant?.id],
    queryFn: () => {
      if (!tenant) return [];
      return base44.entities.Person.filter({ tenant_id: tenant.id });
    },
    enabled: !!tenant && isPlatformAdmin,
  });

  // Filter persons with valid coordinates and sort by latest update
  useEffect(() => {
    const withLocation = persons
      .filter(p => p.latitude !== null && p.latitude !== undefined && p.longitude !== null && p.longitude !== undefined)
      .sort((a, b) => new Date(b.last_location_update || 0) - new Date(a.last_location_update || 0));
    
    setPersonLocations(withLocation);

    // Center map on first person if exists
    if (withLocation.length > 0) {
      setMapCenter([withLocation[0].latitude, withLocation[0].longitude]);
    }
  }, [persons]);

  if (!isPlatformAdmin) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 p-4 bg-red-950 border border-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-200">Nur Administratoren können diese Funktion nutzen.</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 p-4 bg-yellow-950 border border-yellow-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <p className="text-sm text-yellow-200">Kein Tenant ausgewählt.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#2d2d2d]">
      <div className="p-8 border-b border-[#555]">
        <PageHeader
          title="Person Tracking"
          subtitle={`${personLocations.length} Personen mit GPS-Position`}
        />
      </div>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Karte */}
        <div className="flex-1 rounded-lg overflow-hidden border border-[#555]">
          <MapContainer center={mapCenter} zoom={7} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {personLocations.map(person => (
              <Marker key={person.id} position={[person.latitude, person.longitude]} icon={personIcon}>
                <Popup>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">{person.name}</p>
                    {person.email && <p className="text-sm text-gray-600">{person.email}</p>}
                    {person.phone && <p className="text-sm text-gray-600">{person.phone}</p>}
                    {person.last_location_update && (
                      <p className="text-xs text-gray-500">
                        {new Date(person.last_location_update).toLocaleString("de-DE")}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Personen-Liste */}
        <div className="w-80 bg-[#3a3a3a] rounded-lg border border-[#555] overflow-y-auto">
          <div className="sticky top-0 p-4 bg-[#2d2d2d] border-b border-[#555]">
            <h3 className="font-medium text-gray-100">Personen</h3>
          </div>

          <div className="divide-y divide-[#555]">
            {personLocations.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">Keine Personen mit GPS-Daten</div>
            ) : (
              personLocations.map(person => (
                <div key={person.id} className="p-4 hover:bg-[#444] transition-colors">
                  <p className="font-medium text-gray-100">{person.name}</p>
                  {person.email && <p className="text-xs text-gray-400">{person.email}</p>}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span>{person.latitude.toFixed(4)}, {person.longitude.toFixed(4)}</span>
                  </div>
                  {person.last_location_update && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(person.last_location_update).toLocaleString("de-DE")}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}