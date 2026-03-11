import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Plus, Calendar, Radio, ChevronRight, Clock, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import JagdDialog from "@/components/jagdkalender/JagdDialog";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const JAGDFORM_LABELS = {
  drueckjagd: "Drückjagd",
  treibjagd: "Treibjagd",
  stoeberjagd: "Stöberjagd",
  feldtreibjagd: "Feldtreibjagd",
  bewegungsjagd: "Bewegungsjagd",
  gemeinschaftsansitz: "Gemeinschaftsansitz",
  niederwildjagd: "Niederwildjagd",
};

const STATUS_CONFIG = {
  planung: { label: "Planung", bg: "bg-gray-700", text: "text-gray-200" },
  bereit: { label: "Bereit", bg: "bg-blue-900", text: "text-blue-200" },
  aktiv: { label: "Aktiv", bg: "bg-green-900", text: "text-green-200" },
  abgeschlossen: { label: "Abgeschlossen", bg: "bg-gray-800", text: "text-gray-400" },
};

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.planung;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
}

export default function JagdkalenderMain() {
  const { tenant, isTenantOwner, isPlatformAdmin } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const canManage = isTenantOwner || isPlatformAdmin;

  const { data: jagden = [], refetch } = useQuery({
    queryKey: ["gesellschaftsjagden", tenant?.id],
    queryFn: () => base44.entities.GesellschaftsJagd.filter({ tenant_id: tenant?.id }, "-datum", 50),
    enabled: !!tenant?.id,
  });

  const active = jagden.filter(j => j.status === "aktiv");
  const planned = jagden.filter(j => ["planung", "bereit"].includes(j.status));
  const done = jagden.filter(j => j.status === "abgeschlossen");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Jagdkalender</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gesellschaftsjagden planen und koordinieren</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Neue Jagd
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1e1e1e] rounded-2xl border border-[#2d2d2d] p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{active.length}</p>
          <p className="text-xs text-gray-400 mt-1">Aktiv</p>
        </div>
        <div className="bg-[#1e1e1e] rounded-2xl border border-[#2d2d2d] p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{planned.length}</p>
          <p className="text-xs text-gray-400 mt-1">Geplant</p>
        </div>
        <div className="bg-[#1e1e1e] rounded-2xl border border-[#2d2d2d] p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{done.length}</p>
          <p className="text-xs text-gray-400 mt-1">Abgeschlossen</p>
        </div>
      </div>

      {/* Active Jagden */}
      {active.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> Laufende Jagden
          </h2>
          <div className="space-y-2">
            {active.map(j => <JagdCard key={j.id} jagd={j} />)}
          </div>
        </div>
      )}

      {/* Planned */}
      {planned.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Geplant</h2>
          <div className="space-y-2">
            {planned.map(j => <JagdCard key={j.id} jagd={j} />)}
          </div>
        </div>
      )}

      {/* Done */}
      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Abgeschlossen</h2>
          <div className="space-y-2">
            {done.slice(0, 5).map(j => <JagdCard key={j.id} jagd={j} />)}
          </div>
        </div>
      )}

      {jagden.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Noch keine Jagden geplant</p>
          {canManage && <p className="text-sm text-gray-500 mt-1">Erstellen Sie Ihre erste Gesellschaftsjagd</p>}
        </div>
      )}

      <JagdDialog open={showDialog} onClose={() => { setShowDialog(false); refetch(); }} />
    </div>
  );
}

function JagdCard({ jagd }) {
  const dateStr = jagd.datum ? (() => {
    try { return format(new Date(jagd.datum), "EEE, dd. MMM yyyy", { locale: de }); } catch { return jagd.datum; }
  })() : "";

  return (
    <Link
      to={createPageUrl(`JagdDetail?id=${jagd.id}`)}
      className="block bg-[#1e1e1e] rounded-2xl border border-[#2d2d2d] p-4 hover:border-[#22c55e]/40 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusPill status={jagd.status} />
            <span className="text-xs text-gray-500">{JAGDFORM_LABELS[jagd.jagdform] || jagd.jagdform}</span>
          </div>
          <h3 className="font-semibold text-gray-100 truncate">{jagd.titel}</h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{dateStr}</span>
            {jagd.uhrzeit_start && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{jagd.uhrzeit_start}</span>}
            {jagd.treffpunkt && <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" />{jagd.treffpunkt}</span>}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#22c55e] shrink-0 mt-1 transition-colors" />
      </div>
    </Link>
  );
}