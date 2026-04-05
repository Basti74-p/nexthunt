import React from "react";
import { X, Wind } from "lucide-react";

const WINDY_API_KEY = "Zey4x3XZZ3xcMdrEboNkqSPbxe6qTI0L";

export default function WindyOverlay({ center, onClose }) {
  const lat = center ? center[0] : 51.1657;
  const lon = center ? center[1] : 10.4515;

  const src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=650&height=450&zoom=8&level=surface&overlay=wind&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;

  return (
    <div className="absolute inset-0 z-[2000] flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1e1e1e] border-b border-[#3a3a3a] shrink-0">
        <div className="flex items-center gap-2">
          <Wind className="w-5 h-5 text-[#22c55e]" />
          <span className="text-white font-semibold text-sm">Jagdwetter (Windy)</span>
          <span className="text-xs text-gray-500">Wind · Regen · Fronten · Temperatur</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-[#2d2d2d] hover:bg-[#3a3a3a] transition-colors border border-[#444]"
        >
          <X className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      {/* Windy Embed */}
      <iframe
        src={src}
        title="Windy Wetterkarte"
        className="flex-1 w-full border-0"
        allowFullScreen
      />
    </div>
  );
}