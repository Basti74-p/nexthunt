import React, { useState } from "react";
import { CheckCircle2, Circle, Clock, Thermometer, Scale, FlaskConical, ShieldCheck, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const SPECIES_LABELS = {
  rotwild: "Rotwild", schwarzwild: "Schwarzwild", rehwild: "Rehwild",
  damwild: "Damwild", sikawild: "Sikawild", wolf: "Wolf",
};

const STATUS_CONFIG = {
  eingang:      { label: "Eingang",      color: "bg-blue-900/40 text-blue-300 border-blue-800/40" },
  verarbeitung: { label: "Verarbeitung", color: "bg-amber-900/40 text-amber-300 border-amber-800/40" },
  lager:        { label: "Lager",        color: "bg-purple-900/40 text-purple-300 border-purple-800/40" },
  ausgabe:      { label: "Ausgabe",      color: "bg-emerald-900/40 text-emerald-300 border-emerald-800/40" },
  verkauft:     { label: "Verkauft",     color: "bg-gray-800/60 text-gray-400 border-gray-700/40" },
};

const TRICH_CONFIG = {
  ausstehend: { label: "Ausstehend", color: "text-amber-400" },
  negativ:    { label: "Negativ ✓",  color: "text-emerald-400" },
  positiv:    { label: "Positiv !",  color: "text-red-400" },
};

function Check({ ok, label }) {
  return (
    <span className={`flex items-center gap-1 text-xs ${ok ? "text-emerald-400" : "text-gray-500"}`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
      {label}
    </span>
  );
}

export default function WildkammerKarte({ item, onAction, revierName }) {
  const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.eingang;
  const trich = TRICH_CONFIG[item.trichinenprobe_ergebnis] || TRICH_CONFIG.ausstehend;
  const daysInChamber = item.eingang_datum
    ? Math.floor((new Date() - new Date(item.eingang_datum)) / 86400000)
    : null;

  return (
    <div className="bg-[#232323] border border-[#3a3a3a] rounded-2xl p-4 flex flex-col gap-3 hover:border-[#4a4a4a] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-100">
            {SPECIES_LABELS[item.species] || item.species}
            {item.age_class && <span className="text-gray-400 font-normal text-sm"> · {item.age_class}</span>}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {item.eingang_datum ? format(new Date(item.eingang_datum), "dd.MM.yyyy", { locale: de }) : "–"}
            {item.eingang_zeit && ` ${item.eingang_zeit}`}
            {revierName && <span> · {revierName}</span>}
            {daysInChamber !== null && item.status !== "ausgabe" && item.status !== "verkauft" && (
              <span className={`ml-1 ${daysInChamber > 7 ? "text-red-400" : daysInChamber > 3 ? "text-amber-400" : ""}`}>
                · {daysInChamber}d
              </span>
            )}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border ${sc.color} whitespace-nowrap`}>{sc.label}</span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {item.gewicht_aufgebrochen && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Scale className="w-3 h-3" /> {item.gewicht_aufgebrochen} kg
          </span>
        )}
        {item.gewicht_kalt && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Scale className="w-3 h-3" /> {item.gewicht_kalt} kg kalt
          </span>
        )}
        {item.kuehltemperatur != null && item.kuehltemperatur !== "" && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Thermometer className="w-3 h-3" /> {item.kuehltemperatur}°C
          </span>
        )}
        {item.trichinenprobe && (
          <span className={`flex items-center gap-1 text-xs ${trich.color}`}>
            <FlaskConical className="w-3 h-3" /> Trich: {trich.label}
          </span>
        )}
      </div>

      {/* Checks */}
      <div className="flex gap-3 flex-wrap">
        <Check ok={item.aufbruch_ok} label="Aufbruch" />
        <Check ok={item.decke_ab} label="Decke ab" />
        <Check ok={item.trichinenprobe} label="Trichinenprobe" />
        <Check ok={item.freigabe} label="Freigabe" />
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap pt-1 border-t border-[#3a3a3a]">
        {item.status === "eingang" && (
          <button onClick={() => onAction("verarbeitung", item)}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-900/30 text-amber-300 hover:bg-amber-800/40 transition-colors">
            → Verarbeitung
          </button>
        )}
        {item.status === "verarbeitung" && (
          <>
            <button onClick={() => onAction("trichinen", item)}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-900/30 text-blue-300 hover:bg-blue-800/40 transition-colors">
              Trichinenprobe
            </button>
            <button onClick={() => onAction("lager", item)}
              className="text-xs px-3 py-1.5 rounded-lg bg-purple-900/30 text-purple-300 hover:bg-purple-800/40 transition-colors">
              → Lager
            </button>
          </>
        )}
        {item.status === "lager" && (
          <button onClick={() => onAction("ausgabe", item)}
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-900/30 text-emerald-300 hover:bg-emerald-800/40 transition-colors">
            → Ausgabe / Verkauf
          </button>
        )}
        <button onClick={() => onAction("edit", item)}
          className="text-xs px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-gray-400 hover:text-gray-200 hover:bg-[#3a3a3a] transition-colors ml-auto">
          Bearbeiten
        </button>
      </div>
    </div>
  );
}