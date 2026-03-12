import React, { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

function createWindArrowIcon(deg, speed) {
  const size = speed < 10 ? 28 : speed < 25 ? 36 : 44;
  const opacity = 0.55 + Math.min(0.4, speed / 80);
  const color = speed < 10 ? "#60a5fa" : speed < 25 ? "#34d399" : speed < 40 ? "#fbbf24" : "#f87171";
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;height:${size}px;
        display:flex;align-items:center;justify-content:center;
        transform:rotate(${deg}deg);
        opacity:${opacity};
        animation:windFloat 3s ease-in-out infinite;
      ">
        <svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none">
          <path d="M20 4 L25 18 L21.5 17 L21.5 36 L18.5 36 L18.5 17 L15 18 Z" fill="${color}"/>
          <circle cx="20" cy="20" r="3" fill="${color}" opacity="0.4"/>
        </svg>
      </div>
      <style>
        @keyframes windFloat {
          0%,100% { transform: rotate(${deg}deg) translateY(0px); }
          50%      { transform: rotate(${deg}deg) translateY(-3px); }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Grid of wind arrows across the visible map bounds
export default function WindLayer({ windDeg, windSpeed }) {
  const map = useMap();
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    if (!windDeg && windDeg !== 0) return;

    // Remove old markers
    markers.forEach(m => map.removeLayer(m));

    const bounds = map.getBounds();
    const zoom = map.getZoom();
    // grid spacing depends on zoom
    const step = zoom >= 14 ? 0.015 : zoom >= 12 ? 0.04 : zoom >= 10 ? 0.1 : 0.25;

    const newMarkers = [];
    const latMin = bounds.getSouth();
    const latMax = bounds.getNorth();
    const lngMin = bounds.getWest();
    const lngMax = bounds.getEast();

    for (let lat = latMin; lat <= latMax; lat += step) {
      for (let lng = lngMin; lng <= lngMax; lng += step) {
        const m = L.marker([lat, lng], {
          icon: createWindArrowIcon(windDeg, windSpeed),
          interactive: false,
        });
        m.addTo(map);
        newMarkers.push(m);
      }
    }

    setMarkers(newMarkers);

    // Update on map move/zoom
    const update = () => {
      newMarkers.forEach(m => map.removeLayer(m));
      setMarkers([]); // triggers re-render
    };
    map.once("moveend", update);
    map.once("zoomend", update);

    return () => {
      newMarkers.forEach(m => map.removeLayer(m));
      map.off("moveend", update);
      map.off("zoomend", update);
    };
  }, [windDeg, windSpeed, map]);

  return null;
}