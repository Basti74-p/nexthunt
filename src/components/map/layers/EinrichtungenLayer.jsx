/**
 * EinrichtungenLayer – Zeigt Jagdeinrichtungen als Marker auf der Karte.
 * Wird als Layer in RevierMapCore eingebettet.
 */
import React from "react";
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

function makeIcon(type) {
  const color = TYPE_COLORS[type] || "#0F2F23";
  return L.divIcon({
    className: "",
    html: `<div style="width:12px;height:12px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
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

export default function EinrichtungenLayer({ items = [], onDelete }) {
  return items
    .filter(i => i.latitude && i.longitude)
    .map(i => (
      <Marker key={i.id} position={[i.latitude, i.longitude]} icon={makeIcon(i.type)}>
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

            {/* Löschen Button */}
            {onDelete && (
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => { if (window.confirm(`"${i.name}" wirklich löschen?`)) onDelete(i.id); }}
                  style={{ background: "#dc2626", color: "white", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", width: "100%" }}
                >
                  🗑 Löschen
                </button>
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    ));
}