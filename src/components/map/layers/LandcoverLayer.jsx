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

export default function LandcoverLayer({ features = [] }) {
  if (!features || features.length === 0) return null;

  return features.map((feature, idx) => {
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