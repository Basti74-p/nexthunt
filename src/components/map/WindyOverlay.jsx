/**
 * WindyOverlay – reines Windy-Vollbild-Overlay (iframe).
 * Wird über der Karte angezeigt wenn der Wind-Button gedrückt wird.
 * Keine Anbindung an die Leaflet-Karte.
 */
import React from "react";
import { X } from "lucide-react";

const WINDY_KEY = "Zey4x3XZZ3xcMdrEboNkqSPbxe6qTI0L";

/**
 * WindyFullscreenOverlay – zeigt Windy als Vollbild über der Karte.
 * onClose: Callback zum Schließen.
 * defaultLat/Lng: optionale Startposition (Kartenmitte).
 */
export function WindyFullscreenOverlay({ onClose, defaultLat = 51.1657, defaultLng = 10.4515, defaultZoom = 8 }) {
  const src = `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=km/h&zoom=${defaultZoom}&overlay=wind&product=ecmwf&level=surface&lat=${defaultLat}&lon=${defaultLng}&detailLat=${defaultLat}&detailLon=${defaultLng}&marker=true&key=${WINDY_KEY}`;

  return (
    <div className="absolute inset-0 z-[2000] flex flex-col" style={{ background: "#1e1e1e" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#444] shrink-0">
        <span className="text-sm font-semibold text-gray-200">🌬️ Jagdwetter – Windy</span>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-[#3a3a3a] transition-colors"
          title="Schließen"
        >
          <X className="w-5 h-5 text-gray-400 hover:text-gray-200" />
        </button>
      </div>

      {/* Windy iframe – volle Höhe */}
      <iframe
        src={src}
        className="flex-1 w-full"
        style={{ border: "none" }}
        frameBorder="0"
        scrolling="no"
        title="Windy Wetterkarte"
        allow="geolocation"
      />
    </div>
  );
}