import React, { useState } from "react";
import { X, Wind, Eye } from "lucide-react";

export default function WindyOverlay({ center, onClose }) {
  const [opacity, setOpacity] = useState(0.85);

  const lat = center ? center[0] : 51.1657;
  const lon = center ? center[1] : 10.4515;

  const src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&zoom=8&level=surface&overlay=wind&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;

  return (
    <div
      className="absolute inset-0 z-[1500] flex flex-col pointer-events-none"
      style={{ opacity }}
    >
      {/* Iframe füllt alles – pointer-events nur für iframe an */}
      <iframe
        src={src}
        title="Windy Wetterkarte"
        className="absolute inset-0 w-full h-full border-0 pointer-events-auto"
        allowFullScreen
      />

      {/* Control Bar — immer sichtbar & klickbar */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-[#444] shadow-xl pointer-events-auto"
        style={{ background: "rgba(30,30,30,0.92)", opacity: 1 }}
      >
        <Wind className="w-4 h-4 text-[#22c55e] shrink-0" />
        <span className="text-xs text-gray-300 font-medium whitespace-nowrap">Windy Overlay</span>

        {/* Opacity slider */}
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-24 accent-[#22c55e]"
          />
          <span className="text-xs text-gray-500 w-8 text-right">{Math.round(opacity * 100)}%</span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg bg-[#3a3a3a] hover:bg-[#4a4a4a] transition-colors border border-[#555]"
          title="Schließen"
        >
          <X className="w-3.5 h-3.5 text-gray-300" />
        </button>
      </div>
    </div>
  );
}