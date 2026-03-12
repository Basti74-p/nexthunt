import React from "react";
import { GeoJSON } from "react-leaflet";

const REVIER_COLORS = [
  "#22c55e", // grün
  "#3b82f6", // blau
  "#f97316", // orange
  "#a855f7", // lila
  "#ef4444", // rot
  "#eab308", // gelb
  "#06b6d4", // cyan
  "#ec4899", // pink
];

export default function BoundaryLayer({ revier, color }) {
  if (!revier?.boundary_geojson) return null;

  let geojson;
  try {
    geojson = typeof revier.boundary_geojson === "string"
      ? JSON.parse(revier.boundary_geojson)
      : revier.boundary_geojson;
  } catch {
    return null;
  }

  const borderColor = color || "#22c55e";

  return (
    <GeoJSON
      key={revier.id + borderColor}
      data={geojson}
      style={{
        color: borderColor,
        weight: 3,
        opacity: 0.9,
        fillColor: borderColor,
        fillOpacity: 0.08,
      }}
    />
  );
}

export { REVIER_COLORS };