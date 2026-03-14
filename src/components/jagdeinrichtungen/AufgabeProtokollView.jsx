import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp, AlertTriangle, MapPin } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const PROTOKOLL_TYP_LABEL = { kontrolle: "Routinekontrolle", jahresinspektion: "Jahresinspektion", schadensmeldung: "Schadensmeldung", reparatur: "Reparaturbericht" };
const ZUSTAND_LABEL = { gut: "Gut", maessig: "Mäßig", schlecht: "Schlecht", total: "Totalschaden" };
const ZUSTAND_COLOR = { gut: "text-green-400", maessig: "text-yellow-400", schlecht: "text-red-400", total: "text-red-300" };
const SCHWERE_COLOR = { gering: "bg-yellow-900 text-yellow-300", mittel: "bg-orange-900 text-orange-300", schwer: "bg-red-900 text-red-300", total: "bg-red-950 text-red-200" };
const STATUS_SCHADEN_COLOR = { offen: "bg-blue-900 text-blue-300", in_bearbeitung: "bg-yellow-900 text-yellow-300", abgeschlossen: "bg-green-900 text-green-300", erfasst: "bg-blue-900 text-blue-300", in_reparatur: "bg-yellow-900 text-yellow-300", behoben: "bg-green-900 text-green-300" };
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
    <div className="mt-2 border-t border-[#3a3a3a] pt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-gray-300 w-full"
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        <AlertTriangle className="w-3.5 h-3.5" />
        {protokolle.length} Protokoll(e) anhängt
      </button>

      {expanded && (
        <div className="space-y-2 mt-2">
          {protokolle.map((p) => (
            <div key={p.id} className="bg-[#0f0f0f] rounded-lg p-2.5 border border-[#2a2a2a] text-xs">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex-1">
                  <p className="text-gray-200 font-medium">{p.titel}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 text-[9px]">{PROTOKOLL_TYP_LABEL[p.protokoll_typ]}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] ${STATUS_SCHADEN_COLOR[p.status]}`}>{STATUS_SCHADEN_LABEL[p.status]}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-gray-400">
                <div className="flex justify-between">
                  <span>Datum:</span>
                  <span className="text-gray-300">{format(new Date(p.datum), "dd.MM.yyyy", { locale: de })}</span>
                </div>
                {p.kontrolleur && (
                  <div className="flex justify-between">
                    <span>Kontrolleur:</span>
                    <span className="text-gray-300">{p.kontrolleur}</span>
                  </div>
                )}
                {p.zustand_gesamt && (
                  <div className="flex justify-between">
                    <span>Zustand:</span>
                    <span className={ZUSTAND_COLOR[p.zustand_gesamt]}>{ZUSTAND_LABEL[p.zustand_gesamt]}</span>
                  </div>
                )}
                {p.hat_schaden && p.schwere && (
                  <div className="flex justify-between">
                    <span>Schwere:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] ${SCHWERE_COLOR[p.schwere]}`}>{p.schwere}</span>
                  </div>
                )}
                {p.kosten_geschaetzt && (
                  <div className="flex justify-between">
                    <span>Kosten (geschätzt):</span>
                    <span className="text-gray-300">{p.kosten_geschaetzt}€</span>
                  </div>
                )}
                {p.kosten_tatsaechlich && (
                  <div className="flex justify-between">
                    <span>Kosten (tatsächlich):</span>
                    <span className="text-gray-300">{p.kosten_tatsaechlich}€</span>
                  </div>
                )}
              </div>

              {p.beschreibung && (
                <p className="text-gray-400 mt-1.5 text-[11px] line-clamp-2">{p.beschreibung}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}