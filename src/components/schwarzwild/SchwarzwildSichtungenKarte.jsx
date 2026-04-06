import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const WITTERUNG_ICONS = { klar: "☀️", bewoelkt: "☁️", regen: "🌧️", nebel: "🌫️", schnee: "❄️" };
const VERHALTEN_LABELS = { ruhig: "Ruhig", fluechtig: "Flüchtig", aesend: "Äsend", wuehlend: "Wühlend", aggressiv: "Aggressiv" };

function formatStueckzahl(s) {
  const parts = [];
  if (s.anzahl_frischlinge > 0) parts.push(`${s.anzahl_frischlinge}F`);
  if (s.anzahl_ueberlaeufer > 0) parts.push(`${s.anzahl_ueberlaeufer}Ü`);
  if (s.anzahl_bachen > 0) parts.push(`${s.anzahl_bachen}B`);
  if (s.anzahl_keiler > 0) parts.push(`${s.anzahl_keiler}K`);
  if (s.anzahl_unbekannt > 0) parts.push(`${s.anzahl_unbekannt}?`);
  return parts.join(" / ") || "—";
}

function createBoarIcon(count) {
  const size = count > 5 ? 36 : count > 2 ? 30 : 24;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:#22c55e;
      border:2px solid #16a34a;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${size < 30 ? 12 : 14}px;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
      font-weight:bold;
      color:#000;
    ">🐗</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitBounds({ sichtungen, revierBoundary }) {
  const map = useMap();

  useEffect(() => {
    const points = sichtungen
      .filter(s => s.ort_lat && s.ort_lng)
      .map(s => [parseFloat(s.ort_lat), parseFloat(s.ort_lng)]);

    if (revierBoundary) {
      try {
        const geo = JSON.parse(revierBoundary);
        const coords = geo?.features?.[0]?.geometry?.coordinates?.[0] || geo?.coordinates?.[0];
        if (coords) coords.forEach(([lng, lat]) => points.push([lat, lng]));
      } catch {}
    }

    if (points.length > 0) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [sichtungen.length]);

  return null;
}

export default function SchwarzwildSichtungenKarte({ sichtungen, rotten, reviere }) {
  const withCoords = sichtungen.filter(s => s.ort_lat && s.ort_lng);

  // Parse Revier-Grenzen
  const revierPolygons = reviere.flatMap(r => {
    if (!r.boundary_geojson) return [];
    try {
      const geo = JSON.parse(r.boundary_geojson);
      const coords = geo?.features?.[0]?.geometry?.coordinates?.[0] || geo?.coordinates?.[0];
      if (!coords) return [];
      return [{ name: r.name, coords: coords.map(([lng, lat]) => [lat, lng]) }];
    } catch { return []; }
  });

  const center = withCoords.length > 0
    ? [parseFloat(withCoords[0].ort_lat), parseFloat(withCoords[0].ort_lng)]
    : revierPolygons.length > 0
    ? revierPolygons[0].coords[0]
    : [51.1657, 10.4515]; // Deutschland Mitte

  return (
    <div className="rounded-2xl overflow-hidden border border-[#2a2a2a]" style={{ height: 420 }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: "100%", height: "100%", background: "#1a1a1a" }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        <FitBounds sichtungen={withCoords} revierBoundary={reviere[0]?.boundary_geojson} />

        {/* Revier-Grenzen */}
        {revierPolygons.map((rp, i) => (
          <Polygon
            key={i}
            positions={rp.coords}
            pathOptions={{ color: "#22c55e", weight: 2, opacity: 0.6, fillOpacity: 0.05 }}
          >
            <Popup className="dark-popup">
              <div style={{ background: "#1a1a1a", color: "#e5e5e5", padding: "6px 10px", borderRadius: 8, fontSize: 13 }}>
                <strong>{rp.name}</strong>
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* Sichtungs-Marker */}
        {withCoords.map(s => {
          const rotte = rotten.find(r => r.id === s.rotte_id);
          const gesamt = (s.anzahl_frischlinge || 0) + (s.anzahl_ueberlaeufer || 0) + (s.anzahl_bachen || 0) + (s.anzahl_keiler || 0) + (s.anzahl_unbekannt || 0);
          return (
            <Marker
              key={s.id}
              position={[parseFloat(s.ort_lat), parseFloat(s.ort_lng)]}
              icon={createBoarIcon(gesamt)}
            >
              <Popup>
                <div style={{ background: "#1e1e1e", color: "#e5e5e5", borderRadius: 10, padding: "10px 14px", minWidth: 180, fontSize: 13 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    {WITTERUNG_ICONS[s.witterung]} {new Date(s.datum).toLocaleDateString("de-DE")} · {new Date(s.datum).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                  </div>
                  {rotte && (
                    <div style={{ fontSize: 12, color: "#22c55e", marginBottom: 4 }}>Rotte: {rotte.name}</div>
                  )}
                  <div style={{ fontFamily: "monospace", fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>
                    {formatStueckzahl(s)}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{VERHALTEN_LABELS[s.verhalten]}</div>
                  {s.notizen && (
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6, borderTop: "1px solid #2a2a2a", paddingTop: 6 }}>
                      {s.notizen}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {withCoords.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-[#1a1a1a]/90 rounded-xl px-4 py-3 text-center">
            <p className="text-sm text-gray-500">Keine Sichtungen mit GPS-Koordinaten</p>
            <p className="text-xs text-gray-600 mt-1">Erfasse Sichtungen mit Standort um sie auf der Karte zu sehen</p>
          </div>
        </div>
      )}
    </div>
  );
}