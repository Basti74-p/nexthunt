import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Radio, Calendar, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Jagdkalender() {
  const { tenant } = useAuth();

  const { data: jagden = [] } = useQuery({
    queryKey: ["gesellschaftsjagden-aktiv", tenant?.id],
    queryFn: () => base44.entities.GesellschaftsJagd.filter({ tenant_id: tenant?.id }, "-datum", 50),
    enabled: !!tenant?.id,
    refetchInterval: 15000,
  });

  const aktive = jagden.filter(j => j.status === "aktiv");
  const andere = jagden.filter(j => j.status !== "aktiv");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Radio className="w-6 h-6 text-green-400 animate-pulse" />
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Live-Monitor</h1>
          <p className="text-sm text-gray-400">Aktive Gesellschaftsjagden</p>
        </div>
      </div>

      {aktive.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider">● Live</h2>
          {aktive.map(j => <JagdMonitorCard key={j.id} jagd={j} />)}
        </div>
      ) : (
        <div className="bg-[#1e1e1e] rounded-2xl border border-[#2d2d2d] p-10 text-center">
          <Radio className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Keine aktiven Jagden</p>
          <p className="text-sm text-gray-500 mt-1">Aktive Jagden werden hier live angezeigt</p>
          <Link to={createPageUrl("JagdkalenderMain")} className="inline-flex items-center gap-1 text-sm text-[#22c55e] mt-4 hover:underline">
            Zum Jagdkalender <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {andere.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Weitere Jagden</h2>
          <div className="space-y-2">
            {andere.slice(0, 5).map(j => <JagdMonitorCard key={j.id} jagd={j} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function JagdMonitorCard({ jagd }) {
  const dateStr = jagd.datum ? (() => {
    try { return format(new Date(jagd.datum), "dd. MMM yyyy", { locale: de }); } catch { return jagd.datum; }
  })() : "";

  const statusColor = { aktiv: "text-green-400", planung: "text-gray-400", bereit: "text-blue-400", abgeschlossen: "text-gray-600" };

  return (
    <Link to={createPageUrl(`JagdDetail?id=${jagd.id}`)}
      className="block bg-[#1e1e1e] rounded-2xl border border-[#2d2d2d] p-4 hover:border-[#22c55e]/40 transition-all group">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {jagd.status === "aktiv" && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
            <span className={`text-xs font-medium ${statusColor[jagd.status] || "text-gray-400"}`}>
              {jagd.status === "aktiv" ? "Live" : jagd.status}
            </span>
          </div>
          <h3 className="font-semibold text-gray-100">{jagd.titel}</h3>
          <p className="text-xs text-gray-500 mt-1">{dateStr}{jagd.uhrzeit_start ? ` · ${jagd.uhrzeit_start}` : ""}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#22c55e] transition-colors" />
      </div>
    </Link>
  );
}