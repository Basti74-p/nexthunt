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
import { useMobile } from "@/components/hooks/useMobile";

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
  const isMobile = useMobile();

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

  return (
    <div className={`absolute z-[1000] flex flex-col gap-1 ${isMobile ? "top-4 left-4 w-auto" : "top-3 left-3 w-80"}`}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className={`bg-[#2d2d2d] rounded-xl shadow-md flex items-center justify-center hover:bg-[#3a3a3a] transition-colors border border-[#444] ${
            isMobile ? "w-12 h-12" : "w-10 h-10"
          }`}
          title="Ort suchen"
        >
          <Search className={`text-gray-300 ${isMobile ? "w-5 h-5" : "w-4 h-4"}`} />
        </button>
      ) : (
        <div className={`bg-[#2d2d2d] rounded-xl shadow-lg border border-[#444] overflow-hidden ${isMobile ? "fixed inset-x-4 top-24 w-auto" : "w-80"}`}>
          <div className={`flex items-center gap-2 border-b border-[#3a3a3a] ${isMobile ? "px-4 py-3" : "px-3 py-2.5"}`}>
            {loading ? <Loader2 className={`text-gray-400 animate-spin flex-shrink-0 ${isMobile ? "w-5 h-5" : "w-4 h-4"}`} /> : <Search className={`text-gray-400 flex-shrink-0 ${isMobile ? "w-5 h-5" : "w-4 h-4"}`} />}
            <input
              ref={inputRef}
              value={query}
              onChange={handleChange}
              onKeyDown={handleKey}
              placeholder="Ort, Adresse, Waldgebiet..."
              className={`flex-1 outline-none text-gray-100 placeholder:text-gray-500 bg-transparent ${isMobile ? "text-base" : "text-sm"}`}
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}>
                <X className={`text-gray-400 hover:text-gray-200 ${isMobile ? "w-5 h-5" : "w-3.5 h-3.5"}`} />
              </button>
            )}
            <button onClick={() => setOpen(false)} className="ml-1">
              <X className={`text-gray-500 hover:text-gray-300 ${isMobile ? "w-5 h-5" : "w-4 h-4"}`} />
            </button>
          </div>
          {results.length > 0 && (
            <div className={`overflow-y-auto ${isMobile ? "max-h-72" : "max-h-56"}`}>
              {results.map((r) => (
                <button
                  key={r.place_id}
                  className={`w-full text-left hover:bg-[#3a3a3a] transition-colors border-b border-[#3a3a3a] last:border-0 ${isMobile ? "px-4 py-3" : "px-3 py-2.5"}`}
                  onClick={() => handleSelect(r)}
                >
                  <div className={`text-gray-100 font-medium truncate ${isMobile ? "text-base" : "text-sm"}`}>{formatLabel(r)}</div>
                  <div className={`text-gray-500 truncate mt-0.5 ${isMobile ? "text-sm" : "text-xs"}`}>{r.display_name}</div>
                </button>
              ))}
            </div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className={`text-gray-500 text-center ${isMobile ? "px-4 py-4 text-base" : "px-3 py-3 text-sm"}`}>Keine Ergebnisse</div>
          )}
        </div>
      )}
    </div>
  );
}

// Style switcher
function StyleControl({ currentStyle, onStyleChange }) {
  const [open, setOpen] = useState(false);
  const isMobile = useMobile();
  
  return (
    <div className={`absolute z-[1000] ${isMobile ? "top-20 right-4" : "top-3 right-3"}`}>
      {open ? (
        <div className="bg-[#2d2d2d] rounded-xl shadow-lg border border-[#444] overflow-hidden min-w-[140px]">
          <div className={`border-b border-gray-50 flex items-center justify-between ${isMobile ? "px-4 py-3" : "px-3 py-2"}`}>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Kartenstil</span>
            <button onClick={() => setOpen(false)}><X className={`text-gray-400 ${isMobile ? "w-5 h-5" : "w-3.5 h-3.5"}`} /></button>
          </div>
          {MAP_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => { onStyleChange(s); setOpen(false); }}
              className={`w-full text-left transition-colors ${
                isMobile 
                  ? `px-4 py-3 text-base ${currentStyle.id === s.id ? "text-[#22c55e] font-medium bg-[#22c55e]/10" : "text-gray-300 hover:bg-[#3a3a3a]"}` 
                  : `px-3 py-2 text-sm ${currentStyle.id === s.id ? "text-[#22c55e] font-medium bg-[#22c55e]/10" : "text-gray-300 hover:bg-[#3a3a3a]"}`
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={`bg-[#2d2d2d] rounded-xl shadow-md flex items-center justify-center hover:bg-[#3a3a3a] transition-colors border border-[#444] ${
            isMobile ? "w-12 h-12" : "w-10 h-10"
          }`}
          title="Kartenstil wechseln"
        >
          <Layers className={`text-gray-300 ${isMobile ? "w-5 h-5" : "w-4 h-4"}`} />
        </button>
      )}
    </div>
  );
}

// Geolocation button
function GeolocationControl({ onLocate }) {
  const [loading, setLoading] = useState(false);
  const isMobile = useMobile();
  
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
      className={`absolute z-[1000] bg-[#2d2d2d] rounded-xl shadow-md flex items-center justify-center hover:bg-[#3a3a3a] transition-colors border border-[#444] ${
        isMobile 
          ? "bottom-20 right-4 w-12 h-12" 
          : "bottom-6 right-3 w-10 h-10"
      }`}
      title="Meinen Standort anzeigen"
    >
      {loading ? <Loader2 className={`text-[#22c55e] animate-spin ${isMobile ? "w-5 h-5" : "w-4 h-4"}`} /> : <Locate className={`text-gray-300 ${isMobile ? "w-5 h-5" : "w-4 h-4"}`} />}
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
    <div className={`relative overflow-hidden ${className.includes('!rounded-none') ? '' : 'rounded-2xl border border-gray-100 shadow-sm'} ${className}`} style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer key={mapStyle.id} url={mapStyle.url} attribution={mapStyle.attribution} maxZoom={19} />

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