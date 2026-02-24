/**
 * BoundaryDrawer – Zeichnet Reviergrenzen auf der Karte (Polygon-Layer + Klick-Capture).
 * State wird vom Parent (Karte.js) verwaltet und via Props übergeben.
 */
import React from "react";
import { Polygon, Marker, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Pencil, Trash2, Save, X, Check, MapPin } from "lucide-react";

const VERTEX_ICON = L.divIcon({
  className: "",
  html: `<div style="width:10px;height:10px;background:white;border:2px solid #22c55e;border-radius:50%;"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

// Captures map clicks when drawing
function DrawingCapture({ active, onPoint }) {
  useMapEvents({
    click(e) {
      if (active) onPoint([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

/**
 * BoundaryDrawer – inside MapContainer
 * Props: reviere, drawing, points, onPoint, boundaries
 */
export default function BoundaryDrawer({ drawing, points = [], onPoint, boundaries = [] }) {
  return (
    <>
      {/* Existing saved boundaries */}
      {boundaries.map(b => (
        <Polygon
          key={b.revierId}
          positions={b.coords}
          pathOptions={{ color: b.color || "#22c55e", fillColor: b.color || "#22c55e", fillOpacity: 0.08, weight: 2, dashArray: "6 3" }}
        />
      ))}

      {/* Current drawing preview */}
      {points.length >= 2 && (
        <Polyline
          positions={[...points, points[0]]}
          pathOptions={{ color: previewColor || "#22c55e", weight: 2, dashArray: "5 5", opacity: 0.8 }}
        />
      )}
      {points.map((p, i) => (
        <Marker key={i} position={p} icon={VERTEX_ICON} />
      ))}

      <DrawingCapture active={drawing} onPoint={onPoint} />
    </>
  );
}

/**
 * BoundaryDrawerControls – outside MapContainer (absolute positioned panel)
 */
const COLORS = [
  { hex: "#22c55e", label: "Grün" },
  { hex: "#ef4444", label: "Rot" },
  { hex: "#3b82f6", label: "Blau" },
  { hex: "#f59e0b", label: "Orange" },
  { hex: "#a855f7", label: "Lila" },
  { hex: "#ffffff", label: "Weiß" },
];

export function BoundaryDrawerControls({
  drawing, points, onStart, onFinish, onUndo, onCancel,
  showAssign, reviere, selectedRevierId, onSelectRevier, onSave, saving,
  boundaries, onDeleteBoundary, boundaryColor, onColorChange,
}) {
  return (
    <div className="absolute bottom-16 left-3 z-[1000] flex flex-col gap-2 w-64">
      {!drawing && !showAssign && (
        <div className="flex flex-col gap-1.5">
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-[#22c55e]" />
            Reviergrenze einzeichnen
          </button>

          {boundaries.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                Gespeicherte Grenzen
              </div>
              {boundaries.map(b => (
                <div key={b.revierId} className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50">
                  <span className="text-xs text-gray-700 truncate">{b.revierName}</span>
                  <button onClick={() => onDeleteBoundary(b.revierId)} className="ml-2 text-red-400 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {drawing && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#22c55e]" />
            <span className="text-sm font-medium text-gray-700">Grenze zeichnen</span>
          </div>
          <p className="text-xs text-gray-500">
            {points.length} Punkte gesetzt. Auf die Karte klicken um Punkte hinzuzufügen.
          </p>
          <div className="flex gap-2">
            <button
              disabled={points.length === 0}
              onClick={onUndo}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              Rückgängig
            </button>
            <button
              disabled={points.length < 3}
              onClick={onFinish}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-[#22c55e] text-white font-medium hover:bg-[#16a34a] disabled:opacity-40"
            >
              Fertig
            </button>
            <button onClick={onCancel} className="px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {showAssign && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-[#22c55e]" />
            <span className="text-sm font-medium text-gray-700">Revier zuweisen</span>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1.5">Grenzfarbe</div>
            <div className="flex gap-1.5 flex-wrap items-center">
              {COLORS.map(c => (
                <button
                  key={c.hex}
                  title={c.label}
                  onClick={() => onColorChange(c.hex)}
                  className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ background: c.hex, borderColor: boundaryColor === c.hex ? "#1a1a1a" : "#d1d5db" }}
                />
              ))}
              <input
                type="color"
                value={boundaryColor}
                onChange={e => onColorChange(e.target.value)}
                title="Eigene Farbe"
                className="w-5 h-5 rounded cursor-pointer border border-gray-300 p-0"
              />
            </div>
          </div>
          <select
            value={selectedRevierId}
            onChange={e => onSelectRevier(e.target.value)}
            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#22c55e] text-gray-800"
          >
            <option value="">— Revier wählen —</option>
            {reviere.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              disabled={!selectedRevierId || saving}
              onClick={onSave}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-[#22c55e] text-white font-medium hover:bg-[#16a34a] disabled:opacity-40 flex items-center justify-center gap-1"
            >
              <Save className="w-3 h-3" />
              {saving ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}