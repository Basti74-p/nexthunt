import React from "react";
import { GeoJSON } from "react-leaflet";

export default function BoundaryLayer({ revier }) {
  if (!revier?.boundary_geojson) return null;

  let geojson;
  try {
    geojson = typeof revier.boundary_geojson === "string"
      ? JSON.parse(revier.boundary_geojson)
      : revier.boundary_geojson;
  } catch {
    return null;
  }

  return (
    <GeoJSON
      key={revier.id}
      data={geojson}
      style={{
        color: "#22c55e",
        weight: 3,
        opacity: 0.9,
        fillColor: "#22c55e",
        fillOpacity: 0.08,
      }}
    />
  );
}