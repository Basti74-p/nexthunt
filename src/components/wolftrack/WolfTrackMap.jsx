import React, { useEffect, useRef, useState } from "react";

const SCALP_COLORS = {
  "C1 Eindeutiger Nachweis": "#8B0000",
  "C2 Bestätigter Hinweis": "#FF6600",
  "C3a Wahrscheinlich": "#FFD700",
  "C3c Unwahrscheinlich": "#888888",
};

const POINT_COLORS = {
  Sichtung: "#22c55e",
  Riss: "#ef4444",
  Probe: "#a855f7",
  Totfund: "#111111",
  Jagdeintrag: "#92400e",
  Wildkamera: "#eab308",
  Fährte: "#06b6d4",
  Heulpunkt: "#6366f1",
};

export default function WolfTrackMap({ sightings = [], risse = [], samples = [], cameras = [], territories = [], hunts = [], onQuickAdd }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const layerGroups = useRef({});
  const [layers, setLayers] = useState({
    sightings: true, risse: true, proben: true, kameras: true, totfunde: true, jagd: true, gebiete: true
  });
  const [basemap, setBasemap] = useState("osm");
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const tileLayerRef = useRef(null);

  useEffect(() => {
    if (window.L) { setLeafletLoaded(true); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!leafletLoaded || leafletMap.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, { center: [51.5, 10.5], zoom: 6 });
    tileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    }).addTo(map);

    layerGroups.current = {
      sightings: L.layerGroup().addTo(map),
      risse: L.layerGroup().addTo(map),
      proben: L.layerGroup().addTo(map),
      kameras: L.layerGroup().addTo(map),
      totfunde: L.layerGroup().addTo(map),
      jagd: L.layerGroup().addTo(map),
      gebiete: L.layerGroup().addTo(map),
    };

    map.on("click", (e) => {
      if (onQuickAdd) onQuickAdd({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    leafletMap.current = map;
  }, [leafletLoaded]);

  // Switch basemap
  useEffect(() => {
    if (!leafletLoaded || !leafletMap.current) return;
    const L = window.L;
    if (tileLayerRef.current) tileLayerRef.current.remove();
    if (basemap === "osm") {
      tileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(leafletMap.current);
    } else {
      tileLayerRef.current = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "© Esri" }).addTo(leafletMap.current);
    }
  }, [basemap, leafletLoaded]);

  function makeIcon(color, symbol = "●") {
    const L = window.L;
    return L.divIcon({
      html: `<div style="background:${color};width:24px;height:24px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:10px;color:white;box-shadow:0 2px 4px rgba(0,0,0,0.5)">${symbol}</div>`,
      className: "", iconSize: [24, 24], iconAnchor: [12, 12]
    });
  }

  // Populate layers whenever data changes
  useEffect(() => {
    if (!leafletLoaded || !leafletMap.current) return;
    const L = window.L;
    const lg = layerGroups.current;

    lg.sightings.clearLayers();
    sightings.filter(s => s.location_lat && s.location_lng).forEach(s => {
      const color = SCALP_COLORS[s.scalp_category] || POINT_COLORS.Sichtung;
      const marker = L.marker([s.location_lat, s.location_lng], { icon: makeIcon(color, "S") });
      marker.bindPopup(`<b>Sichtung</b><br>${s.sighting_type || ""}<br>${s.scalp_category || ""}<br>${s.location_name || ""}<br><small>${s.sighting_date ? new Date(s.sighting_date).toLocaleDateString("de") : ""}</small><br><em>${s.description || ""}</em>`);
      lg.sightings.addLayer(marker);
    });

    lg.risse.clearLayers();
    risse.filter(r => r.location_lat && r.location_lng).forEach(r => {
      const marker = L.marker([r.location_lat, r.location_lng], { icon: makeIcon(POINT_COLORS.Riss, "R") });
      marker.bindPopup(`<b>Riss</b><br>${r.animal_species || ""}<br>${r.location_name || ""}<br><small>${r.incident_date || ""}</small>`);
      lg.risse.addLayer(marker);
    });

    lg.proben.clearLayers();
    samples.filter(s => s.location_lat && s.location_lng).forEach(s => {
      const marker = L.marker([s.location_lat, s.location_lng], { icon: makeIcon(POINT_COLORS.Probe, "P") });
      marker.bindPopup(`<b>Probe</b> ${s.sample_id || ""}<br>${s.sample_type || ""}<br>${s.location_name || ""}<br>Status: ${s.status || ""}`);
      lg.proben.addLayer(marker);
    });

    lg.kameras.clearLayers();
    cameras.filter(c => c.location_lat && c.location_lng).forEach(c => {
      const marker = L.marker([c.location_lat, c.location_lng], { icon: makeIcon(POINT_COLORS.Wildkamera, "📷") });
      marker.bindPopup(`<b>Wildkamera</b><br>${c.camera_name}<br>Akku: ${c.battery_status || "?"}<br>Detektionen: ${c.wolf_detections_count || 0}`);
      lg.kameras.addLayer(marker);
    });

    lg.jagd.clearLayers();
    hunts.filter(h => h.location_lat && h.location_lng).forEach(h => {
      const marker = L.marker([h.location_lat, h.location_lng], { icon: makeIcon(POINT_COLORS.Jagdeintrag, "J") });
      marker.bindPopup(`<b>Jagdeintrag</b><br>${h.hunt_type || ""}<br>Ergebnis: ${h.result || ""}<br><small>${h.hunt_date || ""}</small>`);
      lg.jagd.addLayer(marker);
    });

    lg.gebiete.clearLayers();
    territories.forEach(t => {
      // Placeholder circles for territories
      if (t.territory_name) {
        const circle = L.circle([51.5 + Math.random() * 3, 10 + Math.random() * 4], {
          radius: 8000, color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.1, weight: 2
        });
        circle.bindPopup(`<b>${t.territory_name}</b><br>${t.territory_status || ""}<br>~${t.wolf_count_estimated || "?"} Wölfe`);
        lg.gebiete.addLayer(circle);
      }
    });
  }, [leafletLoaded, sightings, risse, samples, cameras, hunts, territories]);

  // Toggle layer visibility
  useEffect(() => {
    if (!leafletLoaded || !leafletMap.current) return;
    const map = leafletMap.current;
    const lg = layerGroups.current;
    const mapping = { sightings: "sightings", risse: "risse", proben: "proben", kameras: "kameras", jagd: "jagd", gebiete: "gebiete" };
    Object.entries(mapping).forEach(([key, lgKey]) => {
      if (layers[key]) { if (!map.hasLayer(lg[lgKey])) map.addLayer(lg[lgKey]); }
      else { if (map.hasLayer(lg[lgKey])) map.removeLayer(lg[lgKey]); }
    });
  }, [layers, leafletLoaded]);

  const layerButtons = [
    { key: "sightings", label: "Sichtungen", color: "#22c55e" },
    { key: "risse", label: "Risse", color: "#ef4444" },
    { key: "proben", label: "Proben", color: "#a855f7" },
    { key: "kameras", label: "Wildkameras", color: "#eab308" },
    { key: "jagd", label: "Jagdeinträge", color: "#92400e" },
    { key: "gebiete", label: "Wolfsgebiete DE", color: "#3b82f6" },
  ];

  function locateMe() {
    if (!leafletMap.current) return;
    navigator.geolocation?.getCurrentPosition(pos => {
      leafletMap.current.setView([pos.coords.latitude, pos.coords.longitude], 13);
    });
  }

  return (
    <div className="relative w-full" style={{ height: "85vh" }}>
      {/* Map container */}
      <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: "12px", overflow: "hidden" }} />

      {/* Layer controls */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1">
        {layerButtons.map(btn => (
          <button
            key={btn.key}
            onClick={() => setLayers(l => ({ ...l, [btn.key]: !l[btn.key] }))}
            className="flex items-center gap-2 px-2 py-1 rounded text-xs font-medium shadow-lg transition-all"
            style={{
              background: layers[btn.key] ? btn.color : "#444",
              color: "white",
              opacity: layers[btn.key] ? 1 : 0.6,
              border: `1px solid ${layers[btn.key] ? btn.color : "#666"}`
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "white", display: "inline-block" }} />
            {btn.label}
          </button>
        ))}
      </div>

      {/* Right controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        <button onClick={() => setBasemap(b => b === "osm" ? "satellite" : "osm")}
          className="px-3 py-2 rounded-lg text-xs font-bold shadow-lg"
          style={{ background: "#1e1e1e", color: "#22c55e", border: "1px solid #22c55e" }}>
          {basemap === "osm" ? "🛰️ Satellit" : "🗺️ Karte"}
        </button>
        <button onClick={locateMe}
          className="px-3 py-2 rounded-lg text-xs font-bold shadow-lg"
          style={{ background: "#1e1e1e", color: "#60a5fa", border: "1px solid #60a5fa" }}>
          📍 Standort
        </button>
      </div>

      {!leafletLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] rounded-xl">
          <div className="text-gray-400 text-sm">Karte wird geladen...</div>
        </div>
      )}
    </div>
  );
}