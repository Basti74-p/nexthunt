/**
 * BoundaryEditor – Erlaubt das Bearbeiten (Bewegen von Punkten, Löschen von Punkten,
 * oder komplettes Löschen) einer bestehenden Reviergrenze direkt auf der Karte.
 */
import React, { useState, useCallback } from "react";
import { Polygon, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Save, Trash2, X, GripVertical, MousePointer, PlusCircle } from "lucide-react";

// Draggable vertex icon
const vertexIcon = (active) => L.divIcon({
  className: "",
  html: `<div style="
    width:14px;height:14px;
    background:${active ? "#22c55e" : "white"};
    border:2.5px solid #22c55e;
    border-radius:50%;
    cursor:grab;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const midpointIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:10px;height:10px;
    background:rgba(34,197,94,0.4);
    border:2px dashed #22c55e;
    border-radius:50%;
    cursor:pointer;
  "></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

// Captures map drag end for a vertex
function DraggableVertex({ position, index, onDragEnd, onRightClick }) {
  return (
    <Marker
      position={position}
      icon={vertexIcon(false)}
      draggable={true}
      eventHandlers={{
        dragend: (e) => onDragEnd(index, e.target.getLatLng()),
        contextmenu: (e) => {
          L.DomEvent.preventDefault(e);
          onRightClick(index);
        },
      }}
    />
  );
}

// Midpoint marker for inserting new vertices
function MidpointVertex({ position, onClick }) {
  return (
    <Marker
      position={position}
      icon={midpointIcon}
      eventHandlers={{ click: () => onClick() }}
    />
  );
}

function getMidpoint(a, b) {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/**
 * BoundaryEditor – inside MapContainer
 * Props:
 *   coords: [[lat, lng], ...]
 *   color: string
 *   onChange: (coords) => void
 */
export function BoundaryEditorLayer({ coords, color, onChange }) {
  const handleDragEnd = useCallback((index, latlng) => {
    const next = [...coords];
    next[index] = [latlng.lat, latlng.lng];
    onChange(next);
  }, [coords, onChange]);

  const handleRightClick = useCallback((index) => {
    if (coords.length <= 3) return; // minimum 3 points
    const next = coords.filter((_, i) => i !== index);
    onChange(next);
  }, [coords, onChange]);

  const handleInsert = useCallback((afterIndex) => {
    const a = coords[afterIndex];
    const b = coords[(afterIndex + 1) % coords.length];
    const mid = getMidpoint(a, b);
    const next = [
      ...coords.slice(0, afterIndex + 1),
      mid,
      ...coords.slice(afterIndex + 1),
    ];
    onChange(next);
  }, [coords, onChange]);

  if (!coords || coords.length < 3) return null;

  return (
    <>
      <Polygon
        positions={coords}
        pathOptions={{ color, weight: 2.5, fillColor: color, fillOpacity: 0.12 }}
      />
      {/* Midpoints for inserting new vertices */}
      {coords.map((p, i) => {
        const next = coords[(i + 1) % coords.length];
        const mid = getMidpoint(p, next);
        return (
          <MidpointVertex
            key={`mid-${i}`}
            position={mid}
            onClick={() => handleInsert(i)}
          />
        );
      })}
      {/* Draggable vertices */}
      {coords.map((p, i) => (
        <DraggableVertex
          key={`v-${i}`}
          position={p}
          index={i}
          onDragEnd={handleDragEnd}
          onRightClick={handleRightClick}
        />
      ))}
    </>
  );
}

/**
 * BoundaryEditorControls – absolute panel outside MapContainer
 */
export function BoundaryEditorControls({ coords, color, onSave, onDelete, onCancel, saving }) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-auto">
      <div className="bg-[#1e1e1e]/95 backdrop-blur-sm border border-[#22c55e]/40 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-[#22c55e]">Grenze bearbeiten</span>
          <span className="text-[10px] text-gray-400 mt-0.5">
            Punkte ziehen · Rechtsklick = Punkt löschen · Grüne Punkte = neuer Punkt
          </span>
        </div>
        <div className="h-8 w-px bg-[#333] mx-1" />
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Löschen
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2a2a2a] border border-[#444] text-gray-300 hover:bg-[#333] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Abbrechen
        </button>
        <button
          disabled={saving || coords.length < 3}
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#22c55e] text-black hover:bg-[#16a34a] disabled:opacity-50 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Speichern..." : "Speichern"}
        </button>
      </div>
    </div>
  );
}