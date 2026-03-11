import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Download, Crosshair, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const WILDART_LABELS = {
  rotwild: "Rotwild", schwarzwild: "Schwarzwild", rehwild: "Rehwild",
  damwild: "Damwild", sikawild: "Sikawild", niederwild: "Niederwild",
  raubwild: "Raubwild", sonstiges: "Sonstiges",
};

export default function JagdStreckenliste({ jagd, canManage }) {
  const { data: meldungen = [] } = useQuery({
    queryKey: ["jagd-meldungen", jagd.id],
    queryFn: () => base44.entities.JagdMeldung.filter({ jagd_id: jagd.id }),
    enabled: !!jagd.id,
  });

  const { data: teilnehmer = [] } = useQuery({
    queryKey: ["jagd-teilnehmer", jagd.id],
    queryFn: () => base44.entities.JagdTeilnehmer.filter({ jagd_id: jagd.id }),
    enabled: !!jagd.id,
  });

  const erlegte = meldungen.filter(m => m.typ === "erlegt");

  const byWildart = useMemo(() => {
    const map = {};
    erlegte.forEach(m => {
      const art = m.wildart || "sonstiges";
      if (!map[art]) map[art] = [];
      map[art].push(m);
    });
    return map;
  }, [erlegte]);

  const dateStr = jagd.datum ? (() => {
    try { return format(new Date(jagd.datum), "dd. MMMM yyyy", { locale: de }); } catch { return jagd.datum; }
  })() : "";

  const handleExport = () => {
    const lines = [
      `Streckenliste – ${jagd.titel}`,
      `Datum: ${dateStr}`,
      `Jagdform: ${jagd.jagdform}`,
      `Jagdleiter: ${jagd.jagdleiter_name || jagd.jagdleiter_email || "–"}`,
      "",
      "Strecke:",
      ...Object.entries(byWildart).map(([art, items]) => `  ${WILDART_LABELS[art] || art}: ${items.length} Stück`),
      "",
      `Gesamt: ${erlegte.length} Stück`,
      "",
      "Details:",
      ...erlegte.map((m, i) => [
        `${i + 1}. ${WILDART_LABELS[m.wildart] || m.wildart || "–"}`,
        m.teilnehmer_name ? `   Schütze: ${m.teilnehmer_name}` : "",
        m.zeitstempel ? `   Zeit: ${format(new Date(m.zeitstempel), "HH:mm")}` : "",
        m.nachricht ? `   Bemerkung: ${m.nachricht}` : "",
      ].filter(Boolean).join("\n")),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Streckenliste_${jagd.titel}_${jagd.datum}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#1e1e1e] rounded-2xl border border-[#2d2d2d] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-100">Streckenliste</h2>
          {erlegte.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport} className="border-[#3a3a3a] text-gray-300 gap-1.5">
              <Download className="w-3.5 h-3.5" /> Exportieren
            </Button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-[#22c55e]">{erlegte.length}</p>
            <p className="text-xs text-gray-500">Stücke erlegt</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-300">{teilnehmer.filter(t => t.rolle === "schuetze" || t.rolle === "gast").length}</p>
            <p className="text-xs text-gray-500">Schützen</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-300">{Object.keys(byWildart).length}</p>
            <p className="text-xs text-gray-500">Wildarten</p>
          </div>
        </div>
      </div>

      {/* By Wildart */}
      {Object.keys(byWildart).length > 0 ? (
        <div className="space-y-3">
          {Object.entries(byWildart).map(([art, items]) => (
            <div key={art} className="bg-[#1e1e1e] rounded-2xl border border-[#2d2d2d] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-[#2d2d2d]">
                <h3 className="font-semibold text-gray-100 flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-[#22c55e]" />
                  {WILDART_LABELS[art] || art}
                </h3>
                <span className="bg-[#22c55e] text-black text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {items.length} Stück
                </span>
              </div>
              <div className="divide-y divide-[#2d2d2d]">
                {items.map((m, idx) => (
                  <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-5 shrink-0">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200">{m.teilnehmer_name || "–"}</p>
                      {m.nachricht && <p className="text-xs text-gray-500 mt-0.5 truncate">{m.nachricht}</p>}
                    </div>
                    {m.zeitstempel && (
                      <span className="text-xs text-gray-500 shrink-0">
                        {(() => { try { return format(new Date(m.zeitstempel), "HH:mm"); } catch { return ""; } })()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Crosshair className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Noch keine Strecke erfasst</p>
          <p className="text-sm text-gray-500 mt-1">Strecke wird automatisch aus Meldungen erstellt</p>
        </div>
      )}

      {/* Sonstige Statistiken */}
      {meldungen.length > 0 && (
        <div className="bg-[#1e1e1e] rounded-2xl border border-[#2d2d2d] p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Weitere Meldungen</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Schüsse abgegeben:</span>
              <span className="text-gray-200">{meldungen.filter(m => m.typ === "schuss").length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bergungen:</span>
              <span className="text-gray-200">{meldungen.filter(m => m.typ === "bergung_erledigt").length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Nachsuchen:</span>
              <span className="text-gray-200">{meldungen.filter(m => m.typ.startsWith("nachsuche")).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Teilnehmer gesamt:</span>
              <span className="text-gray-200">{teilnehmer.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}