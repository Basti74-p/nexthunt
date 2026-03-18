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

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, ZoomControl } from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Locate, Layers, Search, X, Loader2, Map as MapIcon, Wind } from "lucide-react";
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

function createUserIcon(heading) {
  const coneHTML = heading !== null
    ? `<div style="
        position:absolute;
        top:50%;left:50%;
        width:0;height:0;
        transform-origin:0 0;
        transform:translate(-50%,-100%) rotate(${heading}deg);
        border-left:10px solid transparent;
        border-right:10px solid transparent;
        border-bottom:28px solid rgba(37,99,235,0.25);
        filter:drop-shadow(0 0 4px rgba(37,99,235,0.4));
        margin-left:0;
        margin-top:-2px;
      "></div>`
    : "";
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
        ${coneHTML}
        <div style="
          position:absolute;
          width:32px;height:32px;
          background:rgba(37,99,235,0.15);
          border-radius:50%;
          animation:nh-pulse 2s ease-out infinite;
        "></div>
        <div style="
          position:relative;
          width:14px;height:14px;
          background:#2563eb;
          border:2.5px solid white;
          border-radius:50%;
          box-shadow:0 2px 8px rgba(37,99,235,0.6);
          z-index:1;
        "></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

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
    <div className={`absolute z-[1000] flex flex-col gap-1 ${isMobile ? "top-4 left-4 w-auto" : "top-3 left-3 w-80"}`} style={isMobile ? { maxWidth: "calc(100% - 80px)" } : {}}>
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
        <div className={`bg-[#2d2d2d] rounded-xl shadow-lg border border-[#444] overflow-hidden ${isMobile ? "w-full" : "w-80"}`}>
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
    <div className={`absolute z-[1000] ${isMobile ? "top-4 right-4" : "top-3 right-3"}`}>
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
  const [active, setActive] = useState(false);
  const watchIdRef = useRef(null);
  const isMobile = useMobile();

  const stopWatch = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setActive(false);
  };

  const handleClick = () => {
    if (active) {
      stopWatch();
      return;
    }
    setLoading(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLoading(false);
        setActive(true);
        onLocate([pos.coords.latitude, pos.coords.longitude], pos.coords.heading);
      },
      () => { setLoading(false); setActive(false); },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  useEffect(() => () => stopWatch(), []);

  return (
    <button
      onClick={handleClick}
      className={`absolute z-[1000] rounded-xl shadow-md flex items-center justify-center transition-colors border ${
        active
          ? "bg-[#22c55e]/20 border-[#22c55e]/60 hover:bg-[#22c55e]/30"
          : "bg-[#2d2d2d] border-[#444] hover:bg-[#3a3a3a]"
      } ${isMobile ? "top-20 right-4 w-12 h-12" : "bottom-6 right-3 w-10 h-10"}`}
      title={active ? "Standortverfolgung stoppen" : "Meinen Standort anzeigen"}
    >
      {loading
        ? <Loader2 className={`text-[#22c55e] animate-spin ${isMobile ? "w-5 h-5" : "w-4 h-4"}`} />
        : <Locate className={`${active ? "text-[#22c55e]" : "text-gray-300"} ${isMobile ? "w-5 h-5" : "w-4 h-4"}`} />}
    </button>
  );
}

// Weather button
function WeatherControl({ onWeatherClick }) {
  const isMobile = useMobile();

  return (
    <button
      onClick={onWeatherClick}
      className={`absolute z-[1000] rounded-xl shadow-md flex items-center justify-center transition-colors border bg-[#2d2d2d] border-[#444] hover:bg-[#3a3a3a] ${
        isMobile ? "top-36 right-4 w-12 h-12" : "hidden"
      }`}
      title="Jagdwetter"
    >
      <Wind className={`text-gray-300 ${isMobile ? "w-5 h-5" : "w-4 h-4"}`} />
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
  onUserLocation,
  onWeatherButtonClick,
}) {
  const [mapStyle, setMapStyle] = useState(() => {
    const saved = localStorage.getItem("nh_map_style");
    return MAP_STYLES.find(s => s.id === saved) || MAP_STYLES[0];
  });
  const [mapInstance, setMapInstance] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userHeading, setUserHeading] = useState(null);
  const [searchResult, setSearchResult] = useState(null);

  // Compute center from revier boundary or fall back to Germany center
  const reviercenter = React.useMemo(() => {
    if (center) return center;
    if (revier?.boundary_geojson) {
      try {
        const gj = JSON.parse(revier.boundary_geojson);
        let rawCoords;
        if (gj.type === "FeatureCollection") rawCoords = gj.features?.[0]?.geometry?.coordinates?.[0];
        else rawCoords = gj.coordinates?.[0];
        if (rawCoords?.length > 0) {
          const lats = rawCoords.map(([, lat]) => lat);
          const lngs = rawCoords.map(([lng]) => lng);
          return [
            (Math.min(...lats) + Math.max(...lats)) / 2,
            (Math.min(...lngs) + Math.max(...lngs)) / 2,
          ];
        }
      } catch { /* ignore */ }
    }
    return null;
  }, [revier?.id, revier?.boundary_geojson, center]);

  const defaultCenter = reviercenter || [51.1657, 10.4515];
  const [flyTarget, setFlyTarget] = useState(null);

  // Fly to revier center whenever revier changes (on mount or selection change)
  useEffect(() => {
    if (reviercenter) {
      setFlyTarget({ center: reviercenter, zoom: zoom });
    }
  }, [revier?.id]);

  const handleStyleChange = (style) => {
    setMapStyle(style);
    localStorage.setItem("nh_map_style", style.id);
  };

  const handleLocate = (latlng, heading) => {
    setUserLocation(latlng);
    setUserHeading(heading ?? null);
    setFlyTarget({ center: latlng, zoom: 15 });
    if (onUserLocation) onUserLocation(latlng);
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
          <Marker position={userLocation} icon={createUserIcon(userHeading)}>
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
      <WeatherControl onWeatherClick={onWeatherButtonClick} />
    </div>
  );
}