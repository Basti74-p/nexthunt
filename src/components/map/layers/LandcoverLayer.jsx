import React from "react";
import { GeoJSON } from "react-leaflet";

const LANDCOVER_STYLES = {
  forest: {
    color: '#22c55e',
    weight: 1,
    opacity: 0.7,
    fillOpacity: 0.3,
    fillColor: '#22c55e',
  },
  meadow: {
    color: '#eab308',
    weight: 1,
    opacity: 0.7,
    fillOpacity: 0.2,
    fillColor: '#eab308',
  },
};

// Validiert ob GeoJSON-Koordinaten valide sind
function isValidCoordinates(coords) {
  if (!coords || !Array.isArray(coords)) return false;
  
  if (coords[0]?.length > 0) {
    // Polygon/MultiPolygon
    return coords.every(ring =>
      ring.every(coord =>
        Array.isArray(coord) && coord.length >= 2 &&
        typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
        isFinite(coord[0]) && isFinite(coord[1])
      )
    );
  }
  // Point/LineString
  return coords.length >= 2 &&
    typeof coords[0] === 'number' && typeof coords[1] === 'number' &&
    isFinite(coords[0]) && isFinite(coords[1]);
}

// Filtert invalide Features
function filterValidFeatures(features) {
  return features.filter(feature => {
    if (!feature?.geometry?.coordinates) return false;
    return isValidCoordinates(feature.geometry.coordinates);
  });
}

export default function LandcoverLayer({ features = [] }) {
  const validFeatures = filterValidFeatures(features || []);
  
  if (!validFeatures || validFeatures.length === 0) return null;

  return validFeatures.map((feature, idx) => {
    const category = feature.properties?.category || 'forest';
    const style = LANDCOVER_STYLES[category] || LANDCOVER_STYLES.forest;

    return (
      <GeoJSON
        key={idx}
        data={feature}
        style={style}
        onEachFeature={(feature, layer) => {
          const label = category === 'forest' ? '🌲 Wald' : '🌾 Wiese';
          layer.bindPopup(`<div style="font-size: 12px; color: #1f2937;"><strong>${label}</strong></div>`);
        }}
      />
    );
  });
}