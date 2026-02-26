import React, { useState, useEffect } from "react";
import { Wind, Thermometer, Droplets } from "lucide-react";

const WIND_DIRS = ["N", "NNO", "NO", "ONO", "O", "OSO", "SO", "SSO", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

function degToDir(deg) {
  const idx = Math.round(deg / 22.5) % 16;
  return WIND_DIRS[idx];
}

function WindArrow({ deg, animated }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 48, height: 48 }}>
      {/* Animated wind rings */}
      {animated && (
        <>
          <div
            className="absolute rounded-full border border-blue-400/30"
            style={{
              width: 48, height: 48,
              animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite",
            }}
          />
          <div
            className="absolute rounded-full border border-blue-400/20"
            style={{
              width: 36, height: 36,
              animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite 0.5s",
            }}
          />
        </>
      )}
      {/* Arrow */}
      <div
        style={{
          transform: `rotate(${deg}deg)`,
          transition: "transform 1s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          {/* Arrow pointing up = wind coming FROM that direction */}
          <path d="M16 4 L20 14 L17 13 L17 28 L15 28 L15 13 L12 14 Z" fill="#60a5fa" />
        </svg>
      </div>
    </div>
  );
}

export default function WindWidget({ lat, lng }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!lat || !lng) return;
    setLoading(true);
    setError(null);
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation&wind_speed_unit=kmh&timezone=auto`
    )
      .then(r => r.json())
      .then(data => {
        const c = data.current;
        setWeather({
          temp: c.temperature_2m,
          humidity: c.relative_humidity_2m,
          windSpeed: c.wind_speed_10m,
          windDeg: c.wind_direction_10m,
          precipitation: c.precipitation,
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Wetterdaten nicht verfügbar");
        setLoading(false);
      });
  }, [lat, lng]);

  return (
    <div
      className="absolute z-[1000] bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#3a3a3a] rounded-xl shadow-lg overflow-hidden"
      style={{ bottom: 90, left: 12, minWidth: 160 }}
    >
      <button
        onClick={() => setExpanded(p => !p)}
        className="flex items-center gap-2 px-3 py-2 w-full hover:bg-white/5 transition-colors"
      >
        <Wind className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-xs font-semibold text-gray-300">Wind & Wetter</span>
        <span className="ml-auto text-gray-500 text-xs">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3">
          {loading && (
            <div className="text-xs text-gray-500 py-2 text-center">Laden...</div>
          )}
          {error && (
            <div className="text-xs text-red-400 py-1">{error}</div>
          )}
          {weather && (
            <div className="flex flex-col items-center gap-2">
              {/* Wind arrow animation */}
              <WindArrow deg={weather.windDeg} animated={weather.windSpeed > 2} />

              <div className="text-center">
                <div className="text-lg font-bold text-blue-300">{weather.windSpeed} km/h</div>
                <div className="text-xs text-gray-400">aus {degToDir(weather.windDeg)} ({weather.windDeg}°)</div>
              </div>

              <div className="w-full border-t border-[#3a3a3a] pt-2 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Thermometer className="w-3 h-3 text-orange-400" />
                  <span>{weather.temp} °C</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Droplets className="w-3 h-3 text-blue-400" />
                  <span>{weather.humidity}% Luftfeuchte</span>
                </div>
                {weather.precipitation > 0 && (
                  <div className="flex items-center gap-2 text-xs text-blue-300">
                    <span>🌧 {weather.precipitation} mm</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}