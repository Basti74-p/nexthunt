import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ChevronLeft, Users, Radio, ClipboardList,
  Play, CheckCircle, Settings, MapPin, Clock
} from "lucide-react";
import JagdPlanung from "@/components/jagdkalender/JagdPlanung";
import JagdLiveMonitor from "@/components/jagdkalender/JagdLiveMonitor";
import JagdStreckenliste from "@/components/jagdkalender/JagdStreckenliste";
import JagdDialog from "@/components/jagdkalender/JagdDialog";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const JAGDFORM_LABELS = {
  drueckjagd: "Drückjagd", treibjagd: "Treibjagd", stoeberjagd: "Stöberjagd",
  feldtreibjagd: "Feldtreibjagd", bewegungsjagd: "Bewegungsjagd",
  gemeinschaftsansitz: "Gemeinschaftsansitz", niederwildjagd: "Niederwildjagd",
};

const TABS = [
  { id: "planung", label: "Planung", icon: Users },
  { id: "monitor", label: "Live-Monitor", icon: Radio },
  { id: "strecke", label: "Streckenliste", icon: ClipboardList },
];

function StatusBadge({ status }) {
  const map = {
    planung: "bg-gray-700 text-gray-200",
    bereit: "bg-blue-900 text-blue-200",
    aktiv: "bg-green-900 text-green-200",
    abgeschlossen: "bg-gray-800 text-gray-400",
  };
  const labels = { planung: "Planung", bereit: "Bereit", aktiv: "Aktiv", abgeschlossen: "Abgeschlossen" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || map.planung}`}>
      {status === "aktiv" && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
      {labels[status] || status}
    </span>
  );
}

export default function JagdDetail() {
  const params = new URLSearchParams(window.location.search);
  const jagdId = params.get("id");
  const { tenant, isTenantOwner, isPlatformAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("planung");
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();
  const canManage = isTenantOwner || isPlatformAdmin;

  const { data: jagd, isLoading } = useQuery({
    queryKey: ["jagd", jagdId],
    queryFn: () => base44.entities.GesellschaftsJagd.filter({ id: jagdId }),
    select: d => d[0],
    enabled: !!jagdId,
  });

  const statusMutation = useMutation({
    mutationFn: (status) => base44.entities.GesellschaftsJagd.update(jagdId, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jagd", jagdId] }),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Laden...</div></div>;
  }

  if (!jagd) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-400">Jagd nicht gefunden</p>
        <Link to={createPageUrl("JagdkalenderMain")} className="text-sm text-[#22c55e] hover:underline">Zurück zum Kalender</Link>
      </div>
    );
  }

  const dateStr = jagd.datum ? (() => {
    try { return format(new Date(jagd.datum), "EEEE, dd. MMMM yyyy", { locale: de }); } catch { return jagd.datum; }
  })() : "";

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Back + Header */}
      <div>
        <Link to={createPageUrl("JagdkalenderMain")} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 mb-3">
          <ChevronLeft className="w-4 h-4" /> Zurück zum Kalender
        </Link>
        <div className="bg-[#1e1e1e] rounded-2xl border border-[#2d2d2d] p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <StatusBadge status={jagd.status} />
                <span className="text-sm text-gray-400">{JAGDFORM_LABELS[jagd.jagdform] || jagd.jagdform}</span>
              </div>
              <h1 className="text-xl font-bold text-gray-100">{jagd.titel}</h1>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {dateStr}{jagd.uhrzeit_start ? ` · ${jagd.uhrzeit_start}` : ""}{jagd.uhrzeit_ende ? ` – ${jagd.uhrzeit_ende}` : ""}
                </span>
                {jagd.treffpunkt && (
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{jagd.treffpunkt}</span>
                )}
              </div>
            </div>
            {canManage && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="border-[#3a3a3a] text-gray-300 gap-1">
                  <Settings className="w-3.5 h-3.5" /> Bearbeiten
                </Button>
                {jagd.status === "planung" && (
                  <Button size="sm" onClick={() => statusMutation.mutate("bereit")} className="bg-blue-700 hover:bg-blue-600 gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Bereit
                  </Button>
                )}
                {jagd.status === "bereit" && (
                  <Button size="sm" onClick={() => statusMutation.mutate("aktiv")} className="bg-green-700 hover:bg-green-600 gap-1">
                    <Play className="w-3.5 h-3.5" /> Starten
                  </Button>
                )}
                {jagd.status === "aktiv" && (
                  <Button size="sm" onClick={() => statusMutation.mutate("abgeschlossen")} className="bg-gray-700 hover:bg-gray-600 gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Beenden
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1e1e1e] rounded-xl p-1 border border-[#2d2d2d]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id ? "bg-[#22c55e] text-black" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "planung" && <JagdPlanung jagd={jagd} canManage={canManage} />}
      {activeTab === "monitor" && <JagdLiveMonitor jagd={jagd} canManage={canManage} />}
      {activeTab === "strecke" && <JagdStreckenliste jagd={jagd} canManage={canManage} />}

      {editOpen && (
        <JagdDialog
          open={editOpen}
          onClose={() => { setEditOpen(false); queryClient.invalidateQueries({ queryKey: ["jagd", jagdId] }); }}
          jagd={jagd}
        />
      )}
    </div>
  );
}