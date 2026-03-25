/**
 * EinrichtungenLayer – Zeigt Jagdeinrichtungen als Marker auf der Karte.
 * Wird als Layer in RevierMapCore eingebettet.
 */
import React, { useEffect } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const TYPE_COLORS = {
  hochsitz: "#dc2626",
  leiter: "#dc2626",
  erdsitz: "#374151",
  drueckjagdbock: "#dc2626",
  ansitzdrueckjagdleiter: "#166534",
  kirrung: "#92400e",
  salzlecke: "#1d4ed8",
  suhle: "#5b21b6",
  wildacker: "#15803d",
  fuetterung: "#b45309",
  fanganlage: "#be123c",
};

function makeIcon(type, suitability) {
  let color = TYPE_COLORS[type] || "#0F2F23";
  
  // Override color based on KI-Analyse
  if (suitability === 'green') color = '#22c55e';
  else if (suitability === 'red') color = '#dc2626';
  else if (suitability === 'yellow') color = '#eab308';
  
  const blink = suitability ? `animation: blink 1s infinite;` : '';
  const html = `<div style="width:14px;height:14px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);${blink}"></div>`;
  
  return L.divIcon({
    className: "",
    html,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

const TYPE_LABELS = {
  hochsitz: "Hochsitz",
  leiter: "Leiter",
  erdsitz: "Erdsitz",
  drueckjagdbock: "Drückjagdbock",
  ansitzdrueckjagdleiter: "Ansitzdrückjagdleiter",
  kirrung: "Kirrung",
  salzlecke: "Salzlecke",
  suhle: "Suhle",
  wildacker: "Wildacker",
  fuetterung: "Fütterung",
  fanganlage: "Fanganlage",
};

const CONDITION_LABELS = {
  gut: "Gut",
  maessig: "Mäßig",
  schlecht: "Schlecht",
  neu: "Neu",
};

const CONDITION_COLORS = {
  gut: "#15803d",
  maessig: "#f59e0b",
  schlecht: "#dc2626",
  neu: "#3b82f6",
};

export default function EinrichtungenLayer({ items = [], onDelete, onEdit, analyzeResults = [] }) {
  // CSS für Blinking Animation
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return items
    .filter(i => i.latitude && i.longitude)
    .map(i => {
      const result = analyzeResults.find(r => r.einrichtung_id === i.id);
      return (
      <Marker key={i.id} position={[i.latitude, i.longitude]} icon={makeIcon(i.type, result?.suitability)}>
        <Popup>
          <div style={{ minWidth: 220, maxWidth: 280 }}>
            {/* Header mit Name und Typ */}
            <strong style={{ fontSize: 13, color: "#1f2937" }}>{i.name}</strong><br />
            <span style={{ color: "#6b7280", fontSize: 12 }}>{TYPE_LABELS[i.type] || i.type}</span>
            
            {/* Zustand Badge */}
            {i.condition && (
              <div style={{ marginTop: 6, marginBottom: 6 }}>
                <span style={{
                  background: CONDITION_COLORS[i.condition],
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: "bold",
                  display: "inline-block"
                }}>
                  {CONDITION_LABELS[i.condition]}
                </span>
              </div>
            )}

            {/* Orientierung */}
            {i.orientation && (
              <div style={{ fontSize: 11, color: "#4b5563", marginBottom: 4 }}>
                <strong>Ausrichtung:</strong> {i.orientation.toUpperCase()}
              </div>
            )}

            {/* Notizen */}
            {i.notes && (
              <div style={{ fontSize: 11, color: "#4b5563", marginBottom: 6, fontStyle: "italic" }}>
                {i.notes}
              </div>
            )}

            {/* Foto */}
            {i.photos && i.photos.length > 0 && (
              <div style={{ marginTop: 8, marginBottom: 8 }}>
                <img
                  src={i.photos[0]}
                  alt="Einrichtung"
                  style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 4, border: "1px solid #e5e7eb" }}
                />
                {i.photos.length > 1 && (
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                    +{i.photos.length - 1} weitere Foto{i.photos.length > 2 ? "s" : ""}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
              {onEdit && (
                <button
                  onClick={() => { onEdit(i); }}
                  style={{ background: "#3b82f6", color: "white", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", flex: 1 }}
                >
                  ✏️ Bearbeiten
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { if (window.confirm(`"${i.name}" wirklich löschen?`)) onDelete(i.id); }}
                  style={{ background: "#dc2626", color: "white", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", flex: 1 }}
                >
                  🗑 Löschen
                </button>
              )}
            </div>
          </div>
        </Popup>
      </Marker>
    );
    });
}