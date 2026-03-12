import React, { useState, useEffect } from "react";
import { Wind, Thermometer, Droplets, Eye, ChevronDown, ChevronUp, Clock } from "lucide-react";

const WIND_DIRS = ["N","NNO","NO","ONO","O","OSO","SO","SSO","S","SSW","SW","WSW","W","WNW","NW","NNW"];
function degToDir(deg) { return WIND_DIRS[Math.round(deg / 22.5) % 16]; }

function jagdBewertung(weather) {
  const { windSpeed, temp, humidity, precipitation } = weather;
  const hints = [];
  let score = 3; // 1=schlecht, 2=mäßig, 3=gut, 4=sehr gut

  if (precipitation > 0.5) { hints.push("🌧 Niederschlag – Wild sucht Deckung"); score = Math.min(score, 2); }
  if (windSpeed > 30) { hints.push("💨 Starker Wind – Ansitz schwierig"); score = Math.min(score, 1); }
  else if (windSpeed > 15) { hints.push("🍃 Mäßiger Wind – Witterung beachten"); score = Math.min(score, 2); }
  else if (windSpeed < 5) { hints.push("✅ Wenig Wind – ideal"); score = Math.max(score, 3); }
  if (humidity > 80) { hints.push("💧 Hohe Luftfeuchte – Wild aktiv"); score = Math.max(score, 3); }
  if (temp < 5) { hints.push("❄️ Kalt – Wild sucht Äsung"); score = Math.max(score, 3); }
  if (temp > 25) { hints.push("☀️ Warm – Tagesaktivität gering"); score = Math.min(score, 2); }

  const labels = { 1: "Schlecht", 2: "Mäßig", 3: "Gut", 4: "Sehr gut" };
  const colors = { 1: "text-red-400", 2: "text-yellow-400", 3: "text-green-400", 4: "text-emerald-300" };
  return { score, label: labels[score], color: colors[score], hints: hints.slice(0, 2) };
}

function WindRose({ deg, speed }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
      {speed > 2 && (
        <div className="absolute rounded-full border border-blue-400/20 animate-ping" style={{ width: 56, height: 56, animationDuration: "2.5s" }} />
      )}
      <div style={{ transform: `rotate(${deg}deg)`, transition: "transform 1.2s ease" }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M20 5 L24 18 L21 17 L21 35 L19 35 L19 17 L16 18 Z" fill="#60a5fa" />
        </svg>
      </div>
    </div>
  );
}

function HourBar({ hour }) {
  const windPct = Math.min(100, (hour.windSpeed / 60) * 100);
  const isNight = hour.h < 6 || hour.h >= 21;
  const isActive = hour.h >= 5 && hour.h < 9 || hour.h >= 17 && hour.h < 21;
  return (
    <div className={`flex flex-col items-center gap-1 min-w-[48px] px-1 py-1.5 rounded-lg ${isActive ? "bg-[#22c55e]/10 border border-[#22c55e]/20" : ""}`}>
      <span className={`text-[10px] font-medium ${isNight ? "text-gray-600" : "text-gray-400"}`}>{hour.h}h</span>
      {/* wind arrow mini */}
      <div style={{ transform: `rotate(${hour.windDeg}deg)`, display: "flex" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1 L9 7 L7.5 6.5 L7.5 13 L6.5 13 L6.5 6.5 L5 7 Z" fill="#60a5fa" />
        </svg>
      </div>
      {/* wind bar */}
      <div className="w-1.5 rounded-full bg-[#333]" style={{ height: 24 }}>
        <div
          className="w-full rounded-full bg-blue-400"
          style={{ height: `${windPct}%`, marginTop: `${100 - windPct}%`, transition: "height 0.5s" }}
        />
      </div>
      <span className="text-[9px] text-blue-300">{hour.windSpeed}</span>
      <span className="text-[9px] text-gray-500">{hour.temp}°</span>
      {hour.precip > 0.1 && <span className="text-[9px] text-blue-400">🌧</span>}
    </div>
  );
}

export default function JagdWetterWidget({ lat, lng, onWeatherLoaded }) {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState("aktuell"); // aktuell | prognose

  useEffect(() => {
    if (!lat || !lng) return;
    setLoading(true);
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,visibility` +
      `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation&wind_speed_unit=kmh&timezone=auto&forecast_days=1`
    )
      .then(r => r.json())
      .then(data => {
        const c = data.current;
        const w = {
          temp: Math.round(c.temperature_2m),
          humidity: c.relative_humidity_2m,
          windSpeed: Math.round(c.wind_speed_10m),
          windDeg: c.wind_direction_10m,
          precipitation: c.precipitation,
          visibility: c.visibility,
        };
        setWeather(w);
        if (onWeatherLoaded) onWeatherLoaded(w.windDeg, w.windSpeed);
        // Build 12h forecast starting from current hour
        const now = new Date();
        const curH = now.getHours();
        const hours = data.hourly;
        const fc = [];
        for (let i = 0; i < 12; i++) {
          const idx = curH + i;
          if (idx < hours.time.length) {
            fc.push({
              h: (curH + i) % 24,
              temp: Math.round(hours.temperature_2m[idx]),
              windSpeed: Math.round(hours.wind_speed_10m[idx]),
              windDeg: hours.wind_direction_10m[idx],
              precip: hours.precipitation[idx],
            });
          }
        }
        setForecast(fc);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lat, lng]);

  const bewertung = weather ? jagdBewertung(weather) : null;

  return (
    <div className="absolute z-[1000] bg-[#1a1a1a]/95 backdrop-blur-sm border border-[#3a3a3a] rounded-xl shadow-lg overflow-hidden" style={{ bottom: 16, left: 16, width: expanded ? 320 : 160 }}>
      {/* Header */}
      <button onClick={() => setExpanded(p => !p)} className="flex items-center gap-2 px-3 py-2.5 w-full hover:bg-white/5 transition-colors">
        <Wind className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-gray-200">Jagdwetter</span>
        {bewertung && <span className={`text-xs font-bold ml-1 ${bewertung.color}`}>{bewertung.label}</span>}
        <span className="ml-auto">{expanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronUp className="w-3.5 h-3.5 text-gray-500" />}</span>
      </button>

      {expanded && (
        <div>
          {loading && <div className="text-xs text-gray-500 py-4 text-center">Lade Wetterdaten...</div>}
          {!loading && !lat && <div className="text-xs text-gray-500 py-3 px-3">Standort aktivieren für Wetter</div>}
          {weather && (
            <>
              {/* Tab switcher */}
              <div className="flex border-b border-[#2a2a2a] px-3">
                {["aktuell", "prognose"].map(t => (
                  <button key={t} onClick={() => setTab(t)} className={`text-xs py-1.5 px-2 border-b-2 transition-colors capitalize ${tab === t ? "border-[#22c55e] text-[#22c55e]" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
                    {t === "prognose" ? "12h-Prognose" : "Aktuell"}
                  </button>
                ))}
              </div>

              {tab === "aktuell" && (
                <div className="px-3 py-3 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <WindRose deg={weather.windDeg} speed={weather.windSpeed} />
                    <div>
                      <div className="text-xl font-bold text-blue-300">{weather.windSpeed} km/h</div>
                      <div className="text-xs text-gray-400">aus {degToDir(weather.windDeg)} ({weather.windDeg}°)</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-xl font-bold text-orange-300">{weather.temp}°C</div>
                      <div className="text-xs text-gray-500">{weather.humidity}% rF</div>
                    </div>
                  </div>

                  {/* Jagdbewertung */}
                  <div className={`rounded-lg px-3 py-2 border ${bewertung.score >= 3 ? "bg-[#22c55e]/10 border-[#22c55e]/30" : bewertung.score === 2 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30"}`}>
                    <div className={`text-xs font-bold mb-1 ${bewertung.color}`}>🦌 Jagdeignung: {bewertung.label}</div>
                    {bewertung.hints.map((h, i) => <div key={i} className="text-xs text-gray-400">{h}</div>)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                    {weather.precipitation > 0 && (
                      <div className="flex items-center gap-1"><Droplets className="w-3 h-3 text-blue-400" />{weather.precipitation} mm</div>
                    )}
                    {weather.visibility && (
                      <div className="flex items-center gap-1"><Eye className="w-3 h-3 text-gray-400" />{(weather.visibility / 1000).toFixed(1)} km Sicht</div>
                    )}
                  </div>
                </div>
              )}

              {tab === "prognose" && (
                <div className="px-2 py-2">
                  <div className="text-[10px] text-gray-500 px-1 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Nächste 12 Stunden · <span className="text-[#22c55e]">Grün = Hauptaktivzeit Wild</span>
                  </div>
                  <div className="flex gap-0.5 overflow-x-auto pb-1">
                    {forecast.map((h, i) => <HourBar key={i} hour={h} />)}
                  </div>
                  <div className="text-[10px] text-gray-600 px-1 mt-1">Wind km/h · Temp °C</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}