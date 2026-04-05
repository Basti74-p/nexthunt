/**
 * WindyOverlay – Windy als animiertes iframe ÜBER der Leaflet-Karte.
 * Position + Zoom werden live von Leaflet synchronisiert.
 * pointer-events: none → Leaflet-Interaktion (Drag, Zoom) bleibt erhalten.
 */
import React, { useEffect, useRef, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { Wind, X, ChevronDown } from "lucide-react";

const WINDY_LAYERS = [
  { id: "wind", label: "Wind", color: "#22c55e" },
  { id: "rain", label: "Regen", color: "#60a5fa" },
  { id: "temp", label: "Temperatur", color: "#f97316" },
  { id: "clouds", label: "Wolken", color: "#94a3b8" },
  { id: "snow", label: "Schnee", color: "#e2e8f0" },
];

function buildWindyUrl(lat, lng, zoom, layer) {
  return `https://embed.windy.com/embed2.html?lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}&detailLat=${lat.toFixed(4)}&detailLon=${lng.toFixed(4)}&width=650&height=450&zoom=${zoom}&level=surface&overlay=${layer}&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;
}

/**
 * WindySyncLayer – innerhalb MapContainer.
 * Synchronisiert lat/lng/zoom live → gibt sie nach oben weiter.
 */
export function WindySyncLayer({ onViewChange }) {
  const map = useMap();

  const sync = () => {
    const c = map.getCenter();
    onViewChange(c.lat, c.lng, map.getZoom());
  };

  useEffect(() => { sync(); }, []);

  useMapEvents({
    move: sync,
    zoom: sync,
  });

  return null;
}

/**
 * WindyIframe – Das iframe selbst, absolut über der Karte positioniert.
 * Wird außerhalb MapContainer gerendert (als sibling im relativen Container).
 */
export function WindyIframe({ lat, lng, zoom, layer, opacity }) {
  const iframeRef = useRef(null);
  const url = buildWindyUrl(lat, lng, zoom, layer);

  return (
    <iframe
      ref={iframeRef}
      src={url}
      key={`${lat.toFixed(3)}-${lng.toFixed(3)}-${zoom}-${layer}`}
      className="absolute inset-0 w-full h-full"
      style={{
        pointerEvents: "none",
        opacity,
        zIndex: 400,
        border: "none",
      }}
      frameBorder="0"
      scrolling="no"
      title="Windy Weather"
    />
  );
}

/**
 * WindyControl – UI-Panel (Layer-Wahl, Opacity, Schließen).
 */
export function WindyControl({ layer, onLayerChange, opacity, onOpacityChange, onClose }) {
  const [open, setOpen] = useState(false);
  const current = WINDY_LAYERS.find(l => l.id === layer) || WINDY_LAYERS[0];

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 px-3 py-2 rounded-2xl border border-[#444] shadow-xl"
      style={{ background: "rgba(30,30,30,0.95)" }}
    >
      <Wind className="w-4 h-4 shrink-0" style={{ color: current.color }} />

      {/* Layer picker */}
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 text-xs text-gray-200 font-medium hover:text-white transition-colors"
        >
          {current.label}
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute bottom-8 left-0 bg-[#2d2d2d] border border-[#444] rounded-xl overflow-hidden shadow-xl min-w-[110px]">
            {WINDY_LAYERS.map(l => (
              <button
                key={l.id}
                onClick={() => { onLayerChange(l.id); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[#3a3a3a] transition-colors ${l.id === layer ? "text-white font-semibold" : "text-gray-400"}`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: l.color }} />
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-[#444]" />

      {/* Opacity */}
      <input
        type="range"
        min="0.1"
        max="1"
        step="0.05"
        value={opacity}
        onChange={e => onOpacityChange(parseFloat(e.target.value))}
        className="w-20 accent-[#22c55e]"
        title="Transparenz"
      />
      <span className="text-[10px] text-gray-500 w-6 text-right">{Math.round(opacity * 100)}%</span>

      <div className="w-px h-4 bg-[#444]" />

      <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#3a3a3a] transition-colors" title="Schließen">
        <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-200" />
      </button>
    </div>
  );
}