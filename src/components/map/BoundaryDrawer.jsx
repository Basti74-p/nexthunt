/**
 * BoundaryDrawer – Zeichnet Reviergrenzen auf der Karte und speichert sie als GeoJSON am Revier.
 * Wird als Layer in RevierMapCore verwendet.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMap, Polygon, Marker, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { base44 } from "@/api/base44Client";
import { Pencil, Trash2, Save, X, Check, MapPin } from "lucide-react";

const VERTEX_ICON = L.divIcon({
  className: "",
  html: `<div style="width:10px;height:10px;background:white;border:2px solid #22c55e;border-radius:50%;cursor:pointer;"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

// Zeichenmodus – fängt Klicks auf der Karte ab
function DrawingCapture({ onPoint, active }) {
  useMapEvents({
    click(e) {
      if (active) onPoint([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function BoundaryDrawer({ reviere = [], onSaved }) {
  const map = useMap();
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [saved, setSaved] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedRevierId, setSelectedRevierId] = useState("");
  const [saving, setSaving] = useState(false);

  // Load existing boundaries
  const [boundaries, setBoundaries] = useState(() => {
    return reviere
      .filter(r => r.boundary_geojson)
      .map(r => {
        try {
          const gj = JSON.parse(r.boundary_geojson);
          const coords = gj.coordinates[0].map(([lng, lat]) => [lat, lng]);
          return { revierId: r.id, revierName: r.name, coords };
        } catch { return null; }
      })
      .filter(Boolean);
  });

  // Reload when reviere changes
  useEffect(() => {
    setBoundaries(
      reviere
        .filter(r => r.boundary_geojson)
        .map(r => {
          try {
            const gj = JSON.parse(r.boundary_geojson);
            const coords = gj.coordinates[0].map(([lng, lat]) => [lat, lng]);
            return { revierId: r.id, revierName: r.name, coords };
          } catch { return null; }
        })
        .filter(Boolean)
    );
  }, [reviere]);

  const startDrawing = () => {
    setDrawing(true);
    setPoints([]);
    setSaved(false);
    map.getContainer().style.cursor = "crosshair";
  };

  const cancelDrawing = () => {
    setDrawing(false);
    setPoints([]);
    setShowAssign(false);
    map.getContainer().style.cursor = "";
  };

  const undoLast = () => {
    setPoints(prev => prev.slice(0, -1));
  };

  const finishDrawing = () => {
    if (points.length < 3) return;
    setDrawing(false);
    setShowAssign(true);
    map.getContainer().style.cursor = "";
    if (reviere.length === 1) setSelectedRevierId(reviere[0].id);
  };

  const handleSave = async () => {
    if (!selectedRevierId || points.length < 3) return;
    setSaving(true);
    // Build GeoJSON polygon (close the ring)
    const coords = [...points, points[0]].map(([lat, lng]) => [lng, lat]);
    const geojson = JSON.stringify({
      type: "Polygon",
      coordinates: [coords],
    });
    await base44.entities.Revier.update(selectedRevierId, { boundary_geojson: geojson });
    setSaving(false);
    setShowAssign(false);
    setPoints([]);
    // Add to local boundaries
    const revier = reviere.find(r => r.id === selectedRevierId);
    setBoundaries(prev => [
      ...prev.filter(b => b.revierId !== selectedRevierId),
      { revierId: selectedRevierId, revierName: revier?.name || "", coords: points },
    ]);
    onSaved?.();
  };

  const deleteBoundary = async (revierId) => {
    await base44.entities.Revier.update(revierId, { boundary_geojson: null });
    setBoundaries(prev => prev.filter(b => b.revierId !== revierId));
    onSaved?.();
  };

  return (
    <>
      {/* Existing boundaries */}
      {boundaries.map(b => (
        <Polygon
          key={b.revierId}
          positions={b.coords}
          pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.08, weight: 2, dashArray: "6 3" }}
        />
      ))}

      {/* Current drawing */}
      {points.length >= 2 && (
        <Polyline positions={[...points, points[0]]} pathOptions={{ color: "#22c55e", weight: 2, dashArray: "5 5" }} />
      )}
      {points.map((p, i) => (
        <Marker key={i} position={p} icon={VERTEX_ICON} />
      ))}

      {/* Drawing capture */}
      <DrawingCapture active={drawing} onPoint={(p) => setPoints(prev => [...prev, p])} />

      {/* UI Controls – rendered outside map via portal-like absolute div */}
    </>
  );
}

// Separate UI panel rendered inside the parent (not inside MapContainer)
export function BoundaryDrawerControls({ drawing, points, onStart, onFinish, onUndo, onCancel, showAssign, reviere, selectedRevierId, onSelectRevier, onSave, saving, boundaries, onDeleteBoundary }) {
  return (
    <div className="absolute bottom-16 left-3 z-[1000] flex flex-col gap-2 max-w-[260px]">
      {!drawing && !showAssign && (
        <div className="flex flex-col gap-1.5">
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-[#22c55e]" />
            Reviergrenze einzeichnen
          </button>
          {/* List of existing boundaries */}
          {boundaries.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                Eingezeichnete Grenzen
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
          <p className="text-xs text-gray-500">{points.length} Punkte gesetzt. Auf die Karte klicken um Punkte hinzuzufügen.</p>
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
            <button onClick={onCancel} className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
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