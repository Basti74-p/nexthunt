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
          <div style={{ minWidth: 140 }}>
            <strong style={{ fontSize: 13 }}>{i.name}</strong><br />
            <span style={{ color: "#6b7280", fontSize: 12 }}>{TYPE_LABELS[i.type] || i.type}</span>
            {i.notes && <><br /><span style={{ color: "#9ca3af", fontSize: 11 }}>{i.notes}</span></>}
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