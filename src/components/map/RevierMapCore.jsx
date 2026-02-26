/**
 * RevierMapCore – Die zentrale, wiederverwendbare Kartenbasis für NextHunt.
 *
 * Features:
 * - Karten-Style-Wechsel (Standard, Satellit, Topografisch)
 * - Geolocation (Nutzerstandort)
 * - Adresssuche (Nominatim/OSM)
 * - Layer-System: beliebige Marker/Layer können als children übergeben werden
 * - Revierkarte als Grundlage für alle Module
 *
 * Verwendung:
 *   <RevierMapCore revier={revier} layers={["einrichtungen", "sichtungen"]} height="500px">
 *     {({ mapRef, map }) => <CustomLayer map={map} />}
 *   </RevierMapCore>
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Locate, Layers, Search, X, Loader2, Map as MapIcon } from "lucide-react";

// Fix Leaflet default icon path issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MAP_STYLES = [
  {
    id: "osm",
    label: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  {
    id: "satellite",
    label: "Satellit",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  {
    id: "topo",
    label: "Jagdkarte (OpenTopo)",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
];

const USER_ICON = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(37,99,235,0.5)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Internal component to handle map events and expose map instance
function MapController({ onMapReady, onMapClick }) {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
  }, [map]);
  useMapEvents({
    click(e) {
      onMapClick && onMapClick(e);
    },
  });
  return null;
}

// Geocoding search component
function SearchControl({ onResult }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const search = useCallback(async (q) => {
    if (!q.trim() || q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=7&addressdetails=1&countrycodes=de,at,ch`,
        { headers: { "Accept-Language": "de" } }
      );
      const data = await res.json();
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); }
    else setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") { clearTimeout(debounceRef.current); search(query); }
    if (e.key === "Escape") setOpen(false);
  };

  const handleSelect = (r) => {
    onResult([parseFloat(r.lat), parseFloat(r.lon)], r.display_name);
    setOpen(false);
  };

  // Format result label: prefer short display
  const formatLabel = (r) => {
    const a = r.address || {};
    const parts = [
      a.road || a.pedestrian || a.path,
      a.house_number,
      a.village || a.town || a.city || a.municipality,
      a.state,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : r.display_name;
  };

  const getType = (r) => {
    const a = r.address || {};
    if (a.city || a.town || a.village) return "Ort";
    if (a.road || a.pedestrian) return "Straße";
    if (r.type === "forest" || r.type === "wood") return "Wald";
    return r.class || "";
  };

  return (
    <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1 w-80 max-w-[calc(100vw-24px)]">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-100"
          title="Ort suchen"
        >
          <Search className="w-4 h-4 text-gray-600" />
        </button>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-50">
            {loading ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" /> : <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            <input
              ref={inputRef}
              value={query}
              onChange={handleChange}
              onKeyDown={handleKey}
              placeholder="Ort, Adresse, Waldgebiet..."
              className="flex-1 text-sm outline-none text-gray-900 placeholder:text-gray-400 bg-transparent"
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}>
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
            <button onClick={() => setOpen(false)} className="ml-1">
              <X className="w-4 h-4 text-gray-300 hover:text-gray-500" />
            </button>
          </div>
          {results.length > 0 && (
            <div className="max-h-56 overflow-y-auto">
              {results.map((r) => (
                <button
                  key={r.place_id}
                  className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                  onClick={() => handleSelect(r)}
                >
                  <div className="text-sm text-gray-800 font-medium truncate">{formatLabel(r)}</div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">{r.display_name}</div>
                </button>
              ))}
            </div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="px-3 py-3 text-sm text-gray-400 text-center">Keine Ergebnisse</div>
          )}
          <div className="px-3 py-1.5 text-[10px] text-gray-300 text-right border-t border-gray-50">
            © OpenStreetMap / Nominatim
          </div>
        </div>
      )}
    </div>
  );
}

// Style switcher
function StyleControl({ currentStyle, onStyleChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute bottom-24 right-3 z-[1000]">
      {open ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-w-[140px]">
          <div className="px-3 py-2 border-b border-gray-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kartenstil</span>
            <button onClick={() => setOpen(false)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
          </div>
          {MAP_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => { onStyleChange(s); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                currentStyle.id === s.id ? "bg-[#0F2F23]/5 text-[#0F2F23] font-medium" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-100"
          title="Kartenstil wechseln"
        >
          <Layers className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>
  );
}

// Geolocation button
function GeolocationControl({ onLocate }) {
  const [loading, setLoading] = useState(false);
  const handleClick = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocate([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: true }
    );
  };
  return (
    <button
      onClick={handleClick}
      className="absolute bottom-6 right-3 z-[1000] w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-100"
      title="Meinen Standort anzeigen"
    >
      {loading ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> : <Locate className="w-4 h-4 text-gray-600" />}
    </button>
  );
}

// Map panner – pans map when center changes
function MapPanner({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || map.getZoom(), { duration: 1 });
  }, [center, zoom]);
  return null;
}

/**
 * RevierMapCore
 *
 * Props:
 * - revier: Revier object (used for default center via region name if no lat/lng available)
 * - center: [lat, lng] override
 * - zoom: initial zoom level
 * - height: CSS height string
 * - children: function ({ map }) => ReactNode  — for injecting layer components
 * - className: additional CSS classes
 */
export default function RevierMapCore({
  revier,
  center,
  zoom = 13,
  height = "500px",
  children,
  className = "",
  onMapClick,
}) {
  const [mapStyle, setMapStyle] = useState(() => {
    const saved = localStorage.getItem("nh_map_style");
    return MAP_STYLES.find(s => s.id === saved) || MAP_STYLES[0];
  });
  const [mapInstance, setMapInstance] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchResult, setSearchResult] = useState(null);

  const defaultCenter = center || [51.1657, 10.4515]; // Germany center fallback
  const [flyTarget, setFlyTarget] = useState(null);

  const handleStyleChange = (style) => {
    setMapStyle(style);
    localStorage.setItem("nh_map_style", style.id);
  };

  const handleLocate = (latlng) => {
    setUserLocation(latlng);
    setFlyTarget({ center: latlng, zoom: 15 });
  };

  const handleSearchResult = (latlng, label) => {
    setSearchResult({ latlng, label });
    setFlyTarget({ center: latlng, zoom: 14 });
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm ${className}`} style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer key={mapStyle.id} url={mapStyle.url} attribution={mapStyle.attribution} maxZoom={19} />
        <ZoomControl position="bottomright" />
        <MapController onMapReady={setMapInstance} onMapClick={onMapClick} />

        {flyTarget && <MapPanner center={flyTarget.center} zoom={flyTarget.zoom} />}

        {userLocation && (
          <Marker position={userLocation} icon={USER_ICON}>
            <Popup>Ihr Standort</Popup>
          </Marker>
        )}

        {searchResult && (
          <Marker position={searchResult.latlng}>
            <Popup>{searchResult.label}</Popup>
          </Marker>
        )}

        {/* Render external layer children */}
        {typeof children === "function" && mapInstance && children({ map: mapInstance })}
        {typeof children !== "function" && children}
      </MapContainer>

      {/* Controls (outside MapContainer to avoid Leaflet DOM conflicts with React portals) */}
      <SearchControl onResult={handleSearchResult} />
      <StyleControl currentStyle={mapStyle} onStyleChange={handleStyleChange} />
      <GeolocationControl onLocate={handleLocate} />
    </div>
  );
}