import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, AlertTriangle, User, Clock, Flag } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import AufgabeProtokollView from "./AufgabeProtokollView";

const PRIO_COLOR = { low: "bg-blue-100 text-blue-700", medium: "bg-yellow-100 text-yellow-700", high: "bg-red-100 text-red-700" };
const PRIO_LABEL = { low: "Niedrig", medium: "Mittel", high: "Hoch" };
const STATUS_LABEL = { offen: "Offen", in_bearbeitung: "In Bearbeitung", erledigt: "Erledigt" };
const STATUS_COLOR = { offen: "text-blue-600", in_bearbeitung: "text-yellow-600", erledigt: "text-green-600" };

const customMarkerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function AufgabeDetailView({ aufgabe, onBack, tenantId }) {
  const { data: einrichtung } = useQuery({
    queryKey: ["aufgabe-detail-einrichtung", aufgabe?.einrichtung_id],
    queryFn: () => base44.entities.Jagdeinrichtung.filter({ id: aufgabe.einrichtung_id }),
    enabled: !!aufgabe?.einrichtung_id,
    select: (data) => data[0],
  });

  const { data: assignedMember } = useQuery({
    queryKey: ["aufgabe-member", aufgabe?.assigned_to],
    queryFn: async () => {
      if (!aufgabe?.assigned_to) return null;
      const members = await base44.entities.TenantMember.filter({ id: aufgabe.assigned_to });
      const persons = await base44.entities.Person.filter({ id: aufgabe.assigned_to });
      return members[0] || persons[0];
    },
    enabled: !!aufgabe?.assigned_to,
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{aufgabe.title}</h1>
          <p className={`text-sm font-medium ${STATUS_COLOR[aufgabe.status]}`}>{STATUS_LABEL[aufgabe.status]}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Arbeitsauftrag Details</h2>
            <div className="space-y-4">
              {aufgabe.description && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Beschreibung</p>
                  <p className="text-gray-600">{aufgabe.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                {aufgabe.due_date && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Clock className="w-4 h-4" />
                      Fällig am
                    </div>
                    <p className="text-gray-900 font-medium">{format(new Date(aufgabe.due_date), "dd. MMMM yyyy", { locale: de })}</p>
                  </div>
                )}

                {aufgabe.priority && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Flag className="w-4 h-4" />
                      Priorität
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${PRIO_COLOR[aufgabe.priority]}`}>
                      {PRIO_LABEL[aufgabe.priority]}
                    </span>
                  </div>
                )}
              </div>

              {aufgabe.assigned_to_name && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <User className="w-4 h-4" />
                    Zugewiesen an
                  </div>
                  <p className="text-gray-900 font-medium">{aufgabe.assigned_to_name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Schadensprotokolle */}
          {aufgabe.schadensprotokolle_ids?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Angehängte Schadensprotokolle
              </h2>
              <AufgabeProtokollView schadensprotokolle_ids={aufgabe.schadensprotokolle_ids} />
            </div>
          )}
        </div>

        {/* Sidebar - Einrichtung & Karte */}
        <div className="space-y-6">
          {einrichtung && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  Jagdeinrichtung
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{einrichtung.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{einrichtung.type}</p>
              </div>

              {einrichtung.latitude && einrichtung.longitude && (
                <div className="h-64 relative">
                  <MapContainer
                    center={[einrichtung.latitude, einrichtung.longitude]}
                    zoom={16}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={false}
                    dragging={false}
                    touchZoom={false}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    <Marker position={[einrichtung.latitude, einrichtung.longitude]} icon={customMarkerIcon}>
                      <Popup>
                        <div className="text-xs">
                          <p className="font-medium">{einrichtung.name}</p>
                          <p className="text-gray-600">{einrichtung.type}</p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}

              <div className="p-4 space-y-2 text-sm">
                {einrichtung.latitude && einrichtung.longitude && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Koordinaten:</span>
                    <span className="text-gray-900 font-medium">{einrichtung.latitude.toFixed(4)}, {einrichtung.longitude.toFixed(4)}</span>
                  </div>
                )}
                {einrichtung.condition && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zustand:</span>
                    <span className="text-gray-900 font-medium capitalize">{einrichtung.condition}</span>
                  </div>
                )}
                {einrichtung.notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-gray-600 text-xs">{einrichtung.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}