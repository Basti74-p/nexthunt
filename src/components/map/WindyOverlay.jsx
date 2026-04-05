/**
 * WindyOverlay – rendert Windy-Wetterlayer direkt in die Leaflet-Karte via TileLayer.
 * Muss innerhalb von <MapContainer> gerendert werden.
 */
import React, { useState } from "react";
import { TileLayer } from "react-leaflet";
import { Wind, X, ChevronDown } from "lucide-react";

const WINDY_API_KEY = "Zey4x3XZZ3xcMdrEboNkqSPbxe6qTI0L";

const WINDY_LAYERS = [
  { id: "wind", label: "Wind", color: "#22c55e" },
  { id: "rain", label: "Regen", color: "#60a5fa" },
  { id: "temp", label: "Temperatur", color: "#f97316" },
  { id: "clouds", label: "Wolken", color: "#94a3b8" },
  { id: "snowcover", label: "Schnee", color: "#e2e8f0" },
];

// Windy tile URL format
function getWindyTileUrl(layer) {
  return `https://tiles.windy.com/tiles/v10.0/${layer}/{z}/{x}/{y}.png?key=${WINDY_API_KEY}`;
}

/**
 * WindyMapLayer – wird innerhalb von MapContainer eingebunden.
 * Zeigt den gewählten Windy-Layer als TileLayer über der Basiskarte.
 */
export function WindyMapLayer({ layer, opacity }) {
  return (
    <TileLayer
      key={layer}
      url={getWindyTileUrl(layer)}
      opacity={opacity}
      zIndex={500}
      attribution='Weather by <a href="https://www.windy.com" target="_blank">Windy</a>'
    />
  );
}

/**
 * WindyControl – UI-Panel außerhalb der Karte (absolute positioned).
 * Steuert Layer-Auswahl, Opacity und Schließen.
 */
export function WindyControl({ onClose, layer, onLayerChange, opacity, onOpacityChange }) {
  const [open, setOpen] = useState(false);
  const current = WINDY_LAYERS.find(l => l.id === layer) || WINDY_LAYERS[0];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 px-3 py-2 rounded-2xl border border-[#444] shadow-xl"
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

      {/* Opacity slider */}
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

      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-[#3a3a3a] transition-colors"
        title="Schließen"
      >
        <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-200" />
      </button>
    </div>
  );
}