import React, { useEffect, useRef, useState } from "react";
import { X, Wind, Loader2 } from "lucide-react";

const WINDY_API_KEY = "Zey4x3XZZ3xcMdrEboNkqSPbxe6qTI0L";

export default function WindyOverlay({ center, onClose }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const lat = center ? center[0] : 51.1657;
  const lon = center ? center[1] : 10.4515;

  useEffect(() => {
    // Load Windy API script
    if (window.windyInit) {
      initWindy();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://api.windy.com/assets/map-forecast/libBoot.js";
    script.async = true;
    script.onload = initWindy;
    document.head.appendChild(script);

    return () => {
      // cleanup
    };
  }, []);

  const initWindy = () => {
    if (!containerRef.current) return;

    const options = {
      key: WINDY_API_KEY,
      verbose: false,
      lat,
      lon,
      zoom: 8,
    };

    window.windyInit(options, (windyAPI) => {
      setLoading(false);
    });
  };

  return (
    <div className="absolute inset-0 z-[2000] flex flex-col" style={{ background: "#1e1e1e" }}>
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

      {/* Windy Map */}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#22c55e] animate-spin" />
              <p className="text-sm text-gray-400">Wetterdaten werden geladen...</p>
            </div>
          </div>
        )}
        <div
          id="windy"
          ref={containerRef}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}