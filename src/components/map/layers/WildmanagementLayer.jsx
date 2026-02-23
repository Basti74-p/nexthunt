/**
 * WildmanagementLayer – Zeigt Sichtungen/Bestandseinträge als Marker auf der Karte.
 */
import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const SPECIES_COLORS = {
  rotwild: "#b91c1c",
  schwarzwild: "#1c1c1c",
  rehwild: "#92400e",
  damwild: "#b45309",
  sikawild: "#15803d",
  wolf: "#6b21a8",
};

const SPECIES_LABELS = {
  rotwild: "Rotwild", schwarzwild: "Schwarzwild", rehwild: "Rehwild",
  damwild: "Damwild", sikawild: "Sikawild", wolf: "Wolf",
};

const TYPE_LABELS = {
  observation: "Sichtung", population: "Bestand", harvest: "Ernte",
};

function makeIcon(species) {
  const color = SPECIES_COLORS[species] || "#374151";
  return L.divIcon({
    className: "",
    html: `<div style="width:10px;height:10px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

export default function WildmanagementLayer({ items = [] }) {
  return items
    .filter(i => i.latitude && i.longitude)
    .map(i => (
      <Marker key={i.id} position={[i.latitude, i.longitude]} icon={makeIcon(i.species)}>
        <Popup>
          <div className="text-sm">
            <strong>{SPECIES_LABELS[i.species] || i.species}</strong> · {TYPE_LABELS[i.type] || i.type}<br />
            <span className="text-gray-500">Anzahl: {i.quantity}</span><br />
            <span className="text-gray-400 text-xs">{i.date}</span>
            {i.notes && <><br /><span className="text-gray-400 text-xs">{i.notes}</span></>}
          </div>
        </Popup>
      </Marker>
    ));
}