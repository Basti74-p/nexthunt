import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const PROTOKOLL_TYP_LABEL = { kontrolle: "Routinekontrolle", jahresinspektion: "Jahresinspektion", schadensmeldung: "Schadensmeldung", reparatur: "Reparaturbericht" };
const ZUSTAND_LABEL = { gut: "Gut", maessig: "Mäßig", schlecht: "Schlecht", total: "Totalschaden" };
const ZUSTAND_COLOR = { gut: "text-green-600", maessig: "text-yellow-600", schlecht: "text-red-600", total: "text-red-700" };
const SCHWERE_COLOR = { gering: "bg-yellow-100 text-yellow-800", mittel: "bg-orange-100 text-orange-800", schwer: "bg-red-100 text-red-800", total: "bg-red-200 text-red-900" };
const STATUS_SCHADEN_COLOR = { offen: "bg-blue-100 text-blue-800", in_bearbeitung: "bg-yellow-100 text-yellow-800", abgeschlossen: "bg-green-100 text-green-800", erfasst: "bg-blue-100 text-blue-800", in_reparatur: "bg-yellow-100 text-yellow-800", behoben: "bg-green-100 text-green-800" };
const STATUS_SCHADEN_LABEL = { offen: "Offen", in_bearbeitung: "In Bearb.", abgeschlossen: "Abgeschl.", erfasst: "Erfasst", in_reparatur: "In Reparatur", behoben: "Behoben" };

export default function AufgabeProtokollView({ schadensprotokolle_ids }) {
  const [expanded, setExpanded] = React.useState(false);

  const { data: protokolle = [] } = useQuery({
    queryKey: ["aufgabe_protokolle", schadensprotokolle_ids],
    queryFn: async () => {
      if (!schadensprotokolle_ids?.length) return [];
      const result = await Promise.all(
        schadensprotokolle_ids.map(id => 
          base44.entities.Schadensprotokoll.filter({ id })
            .then(res => res[0])
            .catch(() => null)
        )
      );
      return result.filter(Boolean);
    },
    enabled: !!schadensprotokolle_ids?.length,
  });

  if (!schadensprotokolle_ids?.length || protokolle.length === 0) return null;

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 w-full"
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        <AlertTriangle className="w-4 h-4" />
        {protokolle.length} Protokoll(e) anhängt
      </button>

      {expanded && (
        <div className="space-y-3 mt-3">
          {protokolle.map((p) => (
            <div key={p.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{p.titel}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <span className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs">{PROTOKOLL_TYP_LABEL[p.protokoll_typ]}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_SCHADEN_COLOR[p.status]}`}>{STATUS_SCHADEN_LABEL[p.status]}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-gray-600 text-xs border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span>Datum:</span>
                  <span className="text-gray-900">{format(new Date(p.datum), "dd. MMMM yyyy", { locale: de })}</span>
                </div>
                {p.kontrolleur && (
                  <div className="flex justify-between">
                    <span>Kontrolleur:</span>
                    <span className="text-gray-900">{p.kontrolleur}</span>
                  </div>
                )}
                {p.zustand_gesamt && (
                  <div className="flex justify-between">
                    <span>Zustand:</span>
                    <span className={`font-medium ${ZUSTAND_COLOR[p.zustand_gesamt]}`}>{ZUSTAND_LABEL[p.zustand_gesamt]}</span>
                  </div>
                )}
                {p.hat_schaden && p.schwere && (
                  <div className="flex justify-between">
                    <span>Schwere:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${SCHWERE_COLOR[p.schwere]}`}>{p.schwere}</span>
                  </div>
                )}
                {p.kosten_geschaetzt && (
                  <div className="flex justify-between">
                    <span>Kosten (geschätzt):</span>
                    <span className="text-gray-900">{p.kosten_geschaetzt}€</span>
                  </div>
                )}
                {p.kosten_tatsaechlich && (
                  <div className="flex justify-between">
                    <span>Kosten (tatsächlich):</span>
                    <span className="text-gray-900">{p.kosten_tatsaechlich}€</span>
                  </div>
                )}
              </div>

              {p.beschreibung && (
                <p className="text-gray-600 mt-2 text-xs line-clamp-2">{p.beschreibung}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}