import React from "react";
import { X, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";

export default function EventDetailDialog({ isOpen, onClose, event }) {
  if (!isOpen || !event) return null;

  const isJagd = event.jagdform !== undefined;
  const statusColors = {
    aktiv: "bg-green-900 text-green-300",
    planung: "bg-gray-700 text-gray-300",
    bereit: "bg-blue-900 text-blue-300",
    abgeschlossen: "bg-gray-600 text-gray-300",
    geplant: "bg-gray-700 text-gray-300",
  };

  const dateStr = event.datum ? format(new Date(event.datum), "dd. MMM yyyy", { locale: de }) : "";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] rounded-2xl border border-[#2d2d2d] max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#2d2d2d]">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-100">{event.titel}</h2>
            <span className={`inline-block text-xs px-2 py-1 rounded-full mt-2 ${statusColors[event.status] || "bg-gray-700 text-gray-300"}`}>
              {event.status}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Datum & Zeit */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-[#22c55e] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Datum</p>
              <p className="text-sm text-gray-100">{dateStr}</p>
              {event.uhrzeit_start && (
                <p className="text-sm text-gray-300 mt-1">
                  {event.uhrzeit_start} {event.uhrzeit_ende ? `- ${event.uhrzeit_ende}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Ort / Treffpunkt */}
          {(event.ort || event.treffpunkt) && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#22c55e] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Ort</p>
                <p className="text-sm text-gray-100">{event.ort || event.treffpunkt}</p>
              </div>
            </div>
          )}

          {/* Beschreibung */}
          {event.beschreibung && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Beschreibung</p>
              <p className="text-sm text-gray-300 bg-[#2d2d2d] rounded-lg p-3">{event.beschreibung}</p>
            </div>
          )}

          {/* Jagdleiter */}
          {event.jagdleiter_name && (
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-[#22c55e] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Jagdleiter</p>
                <p className="text-sm text-gray-100">{event.jagdleiter_name}</p>
              </div>
            </div>
          )}

          {/* Jagdform */}
          {event.jagdform && (
            <div>
              <p className="text-xs text-gray-500">Jagdform</p>
              <p className="text-sm text-gray-100 capitalize">{event.jagdform}</p>
            </div>
          )}

          {/* Gäste */}
          {event.gast_ids?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500">{event.gast_ids.length} Person{event.gast_ids.length > 1 ? "en" : ""} eingeladen</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#2d2d2d] p-6">
          <Button onClick={onClose} className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black">
            Schließen
          </Button>
        </div>
      </div>
    </div>
  );
}