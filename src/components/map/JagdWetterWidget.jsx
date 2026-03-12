import React, { useState, useEffect } from "react";
import { Wind, Thermometer, Droplets, Eye, ChevronDown, ChevronUp, Clock, Gauge, Sunrise, Sunset, X } from "lucide-react";

const WIND_DIRS = ["N","NNO","NO","ONO","O","OSO","SO","SSO","S","SSW","SW","WSW","W","WNW","NW","NNW"];
function degToDir(deg) { return WIND_DIRS[Math.round(deg / 22.5) % 16]; }

// Moon phase calculation
function getMoonPhase(date) {
  const d = new Date(date);
  const known = new Date(2000, 0, 6); // known new moon
  const diff = (d - known) / (1000 * 60 * 60 * 24);
  const cycle = 29.53058867;
  const phase = ((diff % cycle) + cycle) % cycle;
  if (phase < 1.85) return { icon: "🌑", label: "Neumond", jagd: 3 };
  if (phase < 7.38) return { icon: "🌒", label: "Zunehmend", jagd: 3 };
  if (phase < 9.22) return { icon: "🌓", label: "Halbmond", jagd: 3 };
  if (phase < 14.77) return { icon: "🌔", label: "Zunehmend", jagd: 4 };
  if (phase < 16.61) return { icon: "🌕", label: "Vollmond", jagd: 2 };
  if (phase < 22.15) return { icon: "🌖", label: "Abnehmend", jagd: 3 };
  if (phase < 23.99) return { icon: "🌗", label: "Halbmond", jagd: 3 };
  if (phase < 27.68) return { icon: "🌘", label: "Abnehmend", jagd: 4 };
  return { icon: "🌑", label: "Neumond", jagd: 3 };
}

// Sunrise / sunset approximation
function getSunTimes(lat, lng) {
  const now = new Date();
  const J = (now - new Date(now.getFullYear(), 0, 0)) / 86400000;
  const M = (357.5291 + 0.98560028 * J) * Math.PI / 180;
  const C = (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M)) * Math.PI / 180;
  const sunDec = Math.asin(Math.sin(-23.45 * Math.PI / 180) * Math.cos(M + C + (102.9372 + 180) * Math.PI / 180));
  const ha = Math.acos((Math.cos(90.833 * Math.PI / 180) - Math.sin(lat * Math.PI / 180) * Math.sin(sunDec)) / (Math.cos(lat * Math.PI / 180) * Math.cos(sunDec)));
  const haDeg = ha * 180 / Math.PI;
  const tz = now.getTimezoneOffset() / -60;
  const noon = 12 - (lng / 15) + tz;
  const rise = noon - haDeg / 15;
  const set = noon + haDeg / 15;
  const fmt = (h) => {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${hh}:${mm.toString().padStart(2, "0")}`;
  };
  return { rise: fmt(rise), set: fmt(set) };
}

function jagdBewertung(weather) {
  const { windSpeed, temp, humidity, precipitation, pressure } = weather;
  const hints = [];
  let score = 3;

  // Wind
  if (windSpeed > 35) { hints.push({ icon: "💨", text: "Sturm – Ansitz nicht empfohlen" }); score = Math.min(score, 1); }
  else if (windSpeed > 20) { hints.push({ icon: "🍃", text: "Mäßiger Wind – Witterung beachten" }); score = Math.min(score, 2); }
  else if (windSpeed < 8) { hints.push({ icon: "✅", text: "Wenig Wind – ideal für Ansitz" }); }

  // Precipitation
  if (precipitation > 2) { hints.push({ icon: "🌧", text: "Starker Regen – Wild in Deckung" }); score = Math.min(score, 1); }
  else if (precipitation > 0.3) { hints.push({ icon: "🌦", text: "Leichter Regen – Wild mäßig aktiv" }); score = Math.min(score, 2); }
  else { hints.push({ icon: "☀️", text: "Kein Niederschlag – günstig" }); }

  // Temperature
  if (temp < -5) { hints.push({ icon: "🥶", text: "Strenger Frost – Wild sucht Äsung" }); score = Math.max(score, 3); }
  else if (temp < 5) { hints.push({ icon: "❄️", text: "Kalt – Wild aktiv auf Einstand" }); score = Math.max(score, 3); }
  else if (temp > 20) { hints.push({ icon: "☀️", text: "Warm – Tagesaktivität gering" }); score = Math.min(score, 2); }

  // Humidity
  if (humidity > 80) { hints.push({ icon: "💧", text: "Hohe Luftfeuchte – Witterung gut" }); }

  // Pressure (if available)
  if (pressure) {
    if (pressure > 1020) { hints.push({ icon: "📈", text: "Hoher Druck – Stabilwetter" }); }
    else if (pressure < 1000) { hints.push({ icon: "📉", text: "Tiefdruck – Wetterfront möglich" }); score = Math.min(score, 2); }
  }

  // Time-based active periods
  const h = new Date().getHours();
  const isMorning = h >= 5 && h < 9;
  const isEvening = h >= 17 && h < 21;
  if (isMorning) hints.push({ icon: "🌅", text: "Morgendliche Hauptaktivzeit" });
  if (isEvening) hints.push({ icon: "🌆", text: "Abendliche Hauptaktivzeit" });

  const labels = { 1: "Schlecht", 2: "Mäßig", 3: "Gut", 4: "Sehr gut" };
  const colors = { 1: "text-red-400", 2: "text-yellow-400", 3: "text-green-400", 4: "text-emerald-300" };
  const bgColors = { 1: "bg-red-500/10 border-red-500/30", 2: "bg-yellow-500/10 border-yellow-500/30", 3: "bg-[#22c55e]/10 border-[#22c55e]/30", 4: "bg-emerald-500/15 border-emerald-400/40" };
  return { score, label: labels[score], color: colors[score], bg: bgColors[score], hints: hints.slice(0, 4) };
}

function WindRose({ deg, speed }) {
  const color = speed > 30 ? "#f87171" : speed > 15 ? "#fbbf24" : "#60a5fa";
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 80, height: 80 }}>
      <style>{`
        @keyframes windPulse {
          0% { r: 35px; opacity: 0.6; }
          100% { r: 55px; opacity: 0; }
        }
        .wind-pulse {
          animation: windPulse 1.5s ease-out infinite;
        }
      `}</style>
      {speed > 5 && (
        <svg className="absolute inset-0 wind-pulse" width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="35" stroke={color} strokeWidth="2" />
        </svg>
      )}
      <circle cx="40" cy="40" r="40" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
      <circle cx="40" cy="40" r="28" fill="none" stroke={color} strokeWidth="1" opacity="0.15" />
      <g style={{ transform: `rotate(${deg}deg)`, transformOrigin: "40px 40px", transition: "transform 1.2s ease" }}>
        <svg x="20" y="5" width="40" height="40" viewBox="0 0 36 36" fill="none">
          <path d="M18 4 L22 16 L19.5 15 L19.5 32 L16.5 32 L16.5 15 L14 16 Z" fill={color} />
        </svg>
      </g>
    </div>
  );
}

function WindSpeedBar({ speed }) {
  const pct = Math.min(100, (speed / 60) * 100);
  const color = speed > 30 ? "#f87171" : speed > 15 ? "#fbbf24" : "#60a5fa";
  return (
    <div className="w-full h-1 bg-[#333] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function HourBar({ hour }) {
  const windPct = Math.min(100, (hour.windSpeed / 60) * 100);
  const windColor = hour.windSpeed > 30 ? "#f87171" : hour.windSpeed > 15 ? "#fbbf24" : "#60a5fa";
  const isNight = hour.h < 5 || hour.h >= 21;
  const isActive = (hour.h >= 5 && hour.h < 9) || (hour.h >= 17 && hour.h < 21);
  return (
    <div className={`flex flex-col items-center gap-0.5 min-w-[44px] px-1 py-1.5 rounded-lg transition-colors ${isActive ? "bg-[#22c55e]/10 border border-[#22c55e]/25" : isNight ? "opacity-60" : ""}`}>
      <span className={`text-[10px] font-medium ${isActive ? "text-[#22c55e]" : isNight ? "text-gray-600" : "text-gray-400"}`}>{hour.h}h</span>
      <div style={{ transform: `rotate(${hour.windDeg}deg)` }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1 L8 6 L6.5 5.5 L6.5 11 L5.5 11 L5.5 5.5 L4 6 Z" fill={windColor} />
        </svg>
      </div>
      <div className="w-1.5 rounded-full bg-[#2a2a2a]" style={{ height: 22 }}>
        <div className="w-full rounded-full" style={{ height: `${windPct}%`, marginTop: `${100 - windPct}%`, backgroundColor: windColor, transition: "height 0.5s" }} />
      </div>
      <span className="text-[9px]" style={{ color: windColor }}>{hour.windSpeed}</span>
      <span className="text-[9px] text-orange-300">{hour.temp}°</span>
      {hour.precip > 0.1 && <span className="text-[9px]">💧</span>}
      {isActive && <div className="w-1 h-1 rounded-full bg-[#22c55e] mt-0.5" />}
    </div>
  );
}

function StatPill({ icon, value, label, color = "text-gray-300" }) {
  return (
    <div className="flex flex-col items-center gap-0.5 bg-[#242424] rounded-lg px-2 py-1.5 min-w-[56px]">
      <span className="text-[10px] text-gray-400">{label}</span>
      <span className={`text-xs font-semibold ${color}`}>{value}</span>
      {icon && <span className="text-[11px]">{icon}</span>}
    </div>
  );
}

export default function JagdWetterWidget({ lat, lng, onWeatherLoaded, onClose }) {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [tab, setTab] = useState("aktuell");

  useEffect(() => {
    if (!lat || !lng) return;
    setLoading(true);
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,visibility,surface_pressure,weather_code` +
      `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code` +
      `&daily=sunrise,sunset&wind_speed_unit=kmh&timezone=auto&forecast_days=1`
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
          pressure: Math.round(c.surface_pressure),
          weatherCode: c.weather_code,
        };
        setWeather(w);
        if (onWeatherLoaded) onWeatherLoaded(w.windDeg, w.windSpeed);

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
  const moon = getMoonPhase(new Date());
  const sunTimes = lat && lng ? getSunTimes(lat, lng) : null;

  const h = new Date().getHours();
  const activeNow = (h >= 5 && h < 9) || (h >= 17 && h < 21);

  return (
    <div
      className="fixed z-[1000] bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-w-[calc(100vw-32px)]"
      style={{ 
        bottom: 88, 
        left: 16, 
        right: 16,
        width: expanded ? "calc(100vw - 32px)" : 180,
        maxWidth: expanded ? 340 : 180,
        transition: "width 0.3s ease, max-width 0.3s ease" 
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 w-full hover:bg-white/5 transition-colors">
        <button
          onClick={() => setExpanded(p => !p)}
          className="flex items-center gap-2 flex-1"
        >
        <Wind className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-gray-200">Jagdwetter</span>
        {bewertung && (
          <span className={`text-xs font-bold ml-1 ${bewertung.color}`}>{bewertung.label}</span>
        )}
        {activeNow && !expanded && (
          <span className="ml-1 text-[9px] bg-[#22c55e]/20 text-[#22c55e] px-1 py-0.5 rounded font-medium">AKTIV</span>
        )}
          <span className="ml-auto text-gray-500">{expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}</span>
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
            title="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {expanded && (
        <div>
          {loading && <div className="text-xs text-gray-500 py-6 text-center">Lade Wetterdaten...</div>}
          {!loading && !lat && <div className="text-xs text-gray-500 py-3 px-3">Standort aktivieren</div>}

          {weather && (
            <>
              {/* Tabs */}
              <div className="flex border-b border-[#232323] px-3">
                {[["aktuell", "Aktuell"], ["prognose", "12h-Prognose"], ["jagd", "Jagd-Tipps"]].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`text-xs py-1.5 px-2 border-b-2 transition-colors whitespace-nowrap ${tab === key ? "border-[#22c55e] text-[#22c55e]" : "border-transparent text-gray-200 hover:text-white"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* AKTUELL TAB */}
              {tab === "aktuell" && (
                <div className="px-3 py-3 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
                  {/* Wind + Temp row */}
                  <div className="flex items-center gap-3">
                    <WindRose deg={weather.windDeg} speed={weather.windSpeed} />
                    <div className="flex-1">
                      <div className="text-lg font-bold text-blue-300">{weather.windSpeed} km/h</div>
                      <div className="text-[11px] text-gray-300">aus {degToDir(weather.windDeg)} ({weather.windDeg}°)</div>
                      <WindSpeedBar speed={weather.windSpeed} />
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-300">{weather.temp}°C</div>
                      <div className="text-[11px] text-gray-300">{weather.humidity}% rF</div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-1.5 flex-wrap">
                    <StatPill label="Druck" value={`${weather.pressure} hPa`} color="text-purple-300" />
                    {weather.visibility && (
                      <StatPill label="Sicht" value={`${(weather.visibility / 1000).toFixed(1)} km`} color="text-gray-300" />
                    )}
                    {weather.precipitation > 0 && (
                      <StatPill label="Niederschl." value={`${weather.precipitation} mm`} color="text-blue-300" />
                    )}
                    <StatPill label="Mond" value={moon.label} icon={moon.icon} color="text-yellow-200" />
                  </div>

                  {/* Sunrise/Sunset */}
                  {sunTimes && (
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 bg-[#242424] rounded-lg px-2.5 py-1.5 flex-1">
                        <Sunrise className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-xs text-orange-300 font-medium">{sunTimes.rise}</span>
                        <span className="text-[10px] text-gray-300 ml-auto">Aufgang</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#242424] rounded-lg px-2.5 py-1.5 flex-1">
                        <Sunset className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-xs text-red-300 font-medium">{sunTimes.set}</span>
                        <span className="text-[10px] text-gray-300 ml-auto">Untergang</span>
                      </div>
                    </div>
                  )}

                  {/* Active time indicator */}
                  <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${activeNow ? "bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#22c55e]" : "bg-[#242424] text-gray-500"}`}>
                    <div className={`w-2 h-2 rounded-full ${activeNow ? "bg-[#22c55e] animate-pulse" : "bg-gray-600"}`} />
                    {activeNow ? "Hauptaktivzeit des Wildes – Jetzt!" : <span className="text-gray-300">Nächste Aktivzeit: Morgen- oder Abendstunden</span>}
                  </div>

                  {/* Jagdbewertung */}
                  <div className={`rounded-xl px-3 py-2.5 border ${bewertung.bg}`}>
                    <div className={`text-xs font-bold mb-1.5 ${bewertung.color}`}>🦌 Jagdeignung: {bewertung.label}</div>
                    <div className="flex flex-col gap-1">
                      {bewertung.hints.map((h, i) => (
                        <div key={i} className="text-[11px] text-gray-200 flex items-center gap-1.5">
                          <span>{h.icon}</span>
                          <span>{h.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 12H PROGNOSE TAB */}
              {tab === "prognose" && (
                <div className="px-2 py-3 max-h-[60vh] overflow-y-auto">
                  <div className="text-[10px] text-gray-300 px-1 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>Nächste 12h ·</span>
                    <span className="text-[#22c55e]">■</span>
                    <span className="text-[#22c55e]">Hauptaktivzeit</span>
                  </div>
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {forecast.map((h, i) => <HourBar key={i} hour={h} />)}
                  </div>
                  <div className="text-[10px] text-gray-400 px-1 mt-1.5">Wind km/h · Temp °C</div>
                </div>
              )}

              {/* JAGD-TIPPS TAB */}
              {tab === "jagd" && (
                <div className="px-3 py-3 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                  {/* Score card */}
                  <div className={`rounded-xl border px-3 py-2.5 ${bewertung.bg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-bold ${bewertung.color}`}>🦌 {bewertung.label}</span>
                      <div className="flex gap-1">
                        {[1,2,3,4].map(n => (
                          <div key={n} className={`w-4 h-4 rounded-sm ${n <= bewertung.score ? (bewertung.score >= 3 ? "bg-green-500" : bewertung.score === 2 ? "bg-yellow-500" : "bg-red-500") : "bg-[#333]"}`} />
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {bewertung.hints.map((h, i) => (
                        <div key={i} className="text-[11px] text-gray-300 flex items-start gap-2 bg-black/20 rounded-lg px-2 py-1">
                          <span className="text-base leading-none">{h.icon}</span>
                          <span>{h.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mondphase */}
                  <div className="bg-[#1e1e2e] border border-[#2a2a4a] rounded-xl px-3 py-2.5">
                    <div className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wide">Mondphase</div>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{moon.icon}</span>
                      <div>
                        <div className="text-xs font-semibold text-yellow-200">{moon.label}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {moon.jagd >= 4 ? "🦌 Sehr günstig für Ansitz" : moon.jagd === 2 ? "⚠️ Vollmond – Wild wachsamer" : "Normale Aktivität erwartet"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tageszeiten */}
                  {sunTimes && (
                    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-2.5">
                      <div className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wide">Aktivzeiten heute</div>
                      <div className="flex flex-col gap-1.5 text-[11px]">
                        <div className="flex items-center gap-2 text-orange-300">
                          <Sunrise className="w-3.5 h-3.5" />
                          <span>Morgenansitz: {sunTimes.rise} – {
                            (() => { const [hh,mm] = sunTimes.rise.split(":").map(Number); return `${hh + 3}:${mm.toString().padStart(2,"0")}`; })()
                          } Uhr</span>
                        </div>
                        <div className="flex items-center gap-2 text-red-300">
                          <Sunset className="w-3.5 h-3.5" />
                          <span>Abendansitz: {
                            (() => { const [hh,mm] = sunTimes.set.split(":").map(Number); return `${hh - 2}:${mm.toString().padStart(2,"0")}`; })()
                          } – {sunTimes.set} Uhr</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-300">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Sicht: {weather.visibility ? `${(weather.visibility / 1000).toFixed(1)} km` : "k.A."}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Wind-Richtung für Ansitz */}
                  <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-2.5">
                    <div className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wide">Windrichtung</div>
                    <div className="flex items-center gap-3">
                      <WindRose deg={weather.windDeg} speed={weather.windSpeed} />
                      <div className="text-[11px] text-gray-400">
                        <div className="font-medium text-blue-300 mb-0.5">Wind aus {degToDir(weather.windDeg)} ({weather.windDeg}°)</div>
                        <div>{weather.windSpeed} km/h · {weather.windSpeed < 8 ? "Ideal" : weather.windSpeed < 20 ? "Witterung beachten" : "Ungünstig"}</div>
                        <div className="mt-0.5 text-gray-500">Stand gegen den Wind wählen</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}