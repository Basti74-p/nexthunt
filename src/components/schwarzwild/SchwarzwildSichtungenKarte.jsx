import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, Plus } from "lucide-react";

const WITTERUNG_ICONS = { klar: "☀️", bewoelkt: "☁️", regen: "🌧️", nebel: "🌫️", schnee: "❄️" };
const VERHALTEN_LABELS = { ruhig: "Ruhig", fluechtig: "Flüchtig", aesend: "Äsend", wuehlend: "Wühlend", aggressiv: "Aggressiv" };
const INPUT = "w-full bg-[#111] border border-[#2a2a2a] text-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#22c55e]";
const LABEL = "block text-xs text-gray-500 mb-1";

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
    html: `<div style="width:${size}px;height:${size}px;background:#22c55e;border:2px solid #16a34a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${size < 30 ? 12 : 14}px;box-shadow:0 2px 8px rgba(0,0,0,0.5);">🐗</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createPinIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;background:#f97316;border:2px solid #ea580c;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.6);animation:pulse 1s infinite;">📍</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function FitBounds({ sichtungen, reviere }) {
  const map = useMap();
  useEffect(() => {
    const points = sichtungen
      .filter(s => s.ort_lat && s.ort_lng)
      .map(s => [parseFloat(s.ort_lat), parseFloat(s.ort_lng)]);

    reviere.forEach(r => {
      if (!r.boundary_geojson) return;
      try {
        const geo = JSON.parse(r.boundary_geojson);
        const coords = geo?.features?.[0]?.geometry?.coordinates?.[0] || geo?.coordinates?.[0];
        if (coords) coords.forEach(([lng, lat]) => points.push([lat, lng]));
      } catch {}
    });

    if (points.length > 0) map.fitBounds(points, { padding: [40, 40] });
  }, [sichtungen.length]);
  return null;
}

// Klick auf Karte → Pin setzen
function MapClickHandler({ onMapClick, active }) {
  useMapEvents({
    click(e) {
      if (active) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function SchwarzwildSichtungenKarte({ sichtungen, rotten, reviere, onSave }) {
  const withCoords = sichtungen.filter(s => s.ort_lat && s.ort_lng);
  const [pinning, setPinning] = useState(false); // Modus: Klick auf Karte setzt Pin
  const [pin, setPin] = useState(null); // { lat, lng }
  const [form, setForm] = useState(null); // Formular-State (null = geschlossen)

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
    : [51.1657, 10.4515];

  const handleMapClick = (lat, lng) => {
    setPin({ lat, lng });
    setPinning(false);
    setForm({
      datum: new Date().toISOString().slice(0, 16),
      rotte_id: "",
      anzahl_frischlinge: 0, anzahl_ueberlaeufer: 0, anzahl_bachen: 0, anzahl_keiler: 0, anzahl_unbekannt: 0,
      leitbache_gesehen: false,
      verhalten: "ruhig", witterung: "klar", wind: "windstill",
      notizen: "",
      // source: "map" — vorbereitet für spätere Übernahme aus Revierkarte
      source: "schwarzwild_karte",
    });
  };

  const handleSave = () => {
    if (!pin || !form) return;
    onSave({ ...form, ort_lat: pin.lat.toFixed(6), ort_lng: pin.lng.toFixed(6) });
    setPin(null);
    setForm(null);
  };

  const handleCancel = () => {
    setPin(null);
    setForm(null);
    setPinning(false);
  };

  return (
    <div className="relative">
      {/* Toolbar über der Karte */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => { setPinning(v => !v); setPin(null); setForm(null); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            pinning
              ? "bg-orange-500 text-white"
              : "bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 hover:border-[#22c55e]/50 hover:text-[#22c55e]"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          {pinning ? "Auf Karte klicken…" : "Sichtung auf Karte eintragen"}
        </button>
        {pinning && (
          <button onClick={handleCancel} className="text-xs text-gray-500 hover:text-gray-300">Abbrechen</button>
        )}
      </div>

      <div
        className="rounded-2xl overflow-hidden border border-[#2a2a2a]"
        style={{ height: 420, cursor: pinning ? "crosshair" : "grab" }}
      >
        <MapContainer
          center={center}
          zoom={13}
          style={{ width: "100%", height: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO'
          />
          <FitBounds sichtungen={withCoords} reviere={reviere} />
          <MapClickHandler active={pinning} onMapClick={handleMapClick} />

          {/* Revier-Grenzen */}
          {revierPolygons.map((rp, i) => (
            <Polygon key={i} positions={rp.coords}
              pathOptions={{ color: "#22c55e", weight: 2, opacity: 0.6, fillOpacity: 0.05 }}>
              <Popup>
                <div style={{ background: "#1a1a1a", color: "#e5e5e5", padding: "6px 10px", borderRadius: 8, fontSize: 13 }}>
                  <strong>{rp.name}</strong>
                </div>
              </Popup>
            </Polygon>
          ))}

          {/* Gespeicherte Sichtungs-Marker */}
          {withCoords.map(s => {
            const rotte = rotten.find(r => r.id === s.rotte_id);
            const gesamt = (s.anzahl_frischlinge || 0) + (s.anzahl_ueberlaeufer || 0) + (s.anzahl_bachen || 0) + (s.anzahl_keiler || 0) + (s.anzahl_unbekannt || 0);
            return (
              <Marker key={s.id} position={[parseFloat(s.ort_lat), parseFloat(s.ort_lng)]} icon={createBoarIcon(gesamt)}>
                <Popup>
                  <div style={{ background: "#1e1e1e", color: "#e5e5e5", borderRadius: 10, padding: "10px 14px", minWidth: 180, fontSize: 13 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>
                      {WITTERUNG_ICONS[s.witterung]} {new Date(s.datum).toLocaleDateString("de-DE")} · {new Date(s.datum).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                    </div>
                    {rotte && <div style={{ fontSize: 12, color: "#22c55e", marginBottom: 4 }}>Rotte: {rotte.name}</div>}
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>{formatStueckzahl(s)}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{VERHALTEN_LABELS[s.verhalten]}</div>
                    {s.notizen && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6, borderTop: "1px solid #2a2a2a", paddingTop: 6 }}>{s.notizen}</div>}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Neuer Pin */}
          {pin && (
            <Marker position={[pin.lat, pin.lng]} icon={createPinIcon()} />
          )}
        </MapContainer>

        {withCoords.length === 0 && !pinning && !pin && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: 40 }}>
            <div className="bg-[#1a1a1a]/90 rounded-xl px-4 py-3 text-center">
              <p className="text-sm text-gray-500">Keine Sichtungen mit GPS-Koordinaten</p>
              <p className="text-xs text-gray-600 mt-1">Klick auf "Sichtung eintragen" um direkt auf der Karte zu markieren</p>
            </div>
          </div>
        )}
      </div>

      {/* Formular-Panel unter der Karte (wenn Pin gesetzt) */}
      {pin && form && (
        <div className="mt-3 bg-[#1a1a1a] border border-[#22c55e]/40 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-200">
              📍 Sichtung bei {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
            </p>
            <button onClick={handleCancel} className="text-gray-500 hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Datum & Uhrzeit</label>
                <input type="datetime-local" className={INPUT} value={form.datum}
                  onChange={e => setForm(p => ({ ...p, datum: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Rotte</label>
                <select className={INPUT} value={form.rotte_id}
                  onChange={e => setForm(p => ({ ...p, rotte_id: e.target.value }))}>
                  <option value="">Unbekannte Rotte</option>
                  {rotten.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL}>Stückzahl</label>
              <div className="grid grid-cols-4 gap-2">
                {[["anzahl_frischlinge","Fri."],["anzahl_ueberlaeufer","Üb."],["anzahl_bachen","Bach."],["anzahl_keiler","Keil."]].map(([key, lbl]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-600 mb-1">{lbl}</label>
                    <input type="number" min={0} className={INPUT} value={form[key]}
                      onChange={e => setForm(p => ({ ...p, [key]: Number(e.target.value) }))} />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Verhalten</label>
                <select className={INPUT} value={form.verhalten} onChange={e => setForm(p => ({ ...p, verhalten: e.target.value }))}>
                  {Object.entries(VERHALTEN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Witterung</label>
                <select className={INPUT} value={form.witterung} onChange={e => setForm(p => ({ ...p, witterung: e.target.value }))}>
                  {Object.entries(WITTERUNG_ICONS).map(([v, i]) => <option key={v} value={v}>{i} {v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL}>Notizen</label>
              <textarea className={INPUT} rows={2} value={form.notizen}
                onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave}
                className="flex-1 py-2 bg-[#22c55e] text-black font-semibold rounded-xl text-sm hover:bg-[#16a34a]">
                Sichtung speichern
              </button>
              <button onClick={handleCancel}
                className="px-4 py-2 bg-[#2a2a2a] text-gray-300 rounded-xl text-sm">
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}