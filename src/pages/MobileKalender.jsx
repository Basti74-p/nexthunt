import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Plus, Radio } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/ui/PageTransition";
import CalendarMonth from "@/components/calendar/CalendarMonth";
import EventDetailDialog from "@/components/calendar/EventDetailDialog";

export default function MobileKalender() {
  const { tenant } = useAuth();
  const [showNewJagdDialog, setShowNewJagdDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetail, setShowEventDetail] = useState(false);

  const { data: jagden = [] } = useQuery({
    queryKey: ["gesellschaftsjagden-mobile", tenant?.id],
    queryFn: () => base44.entities.GesellschaftsJagd.filter({ tenant_id: tenant?.id }, "-datum", 50),
    enabled: !!tenant?.id,
  });

  const { data: termine = [] } = useQuery({
    queryKey: ["termine-mobile", tenant?.id],
    queryFn: () => base44.entities.Termin.filter({ tenant_id: tenant?.id }, "-datum", 100),
    enabled: !!tenant?.id,
  });

  const aktiv = jagden.filter(j => j.status === "aktiv").length;
  const geplant = jagden.filter(j => j.status === "planung").length;
  const abgeschlossen = jagden.filter(j => j.status === "abgeschlossen").length;

  const aktivList = jagden.filter(j => j.status === "aktiv");
  const abgeschlossenList = jagden.filter(j => j.status === "abgeschlossen");

  const jagdformLabel = (form) => {
    const labels = {
      drueckjagd: "Drückjagd",
      treibjagd: "Treibjagd",
      stoeberjagd: "Stöberjagd",
      feldtreibjagd: "Feldtreibjagd",
      bewegungsjagd: "Bewegungsjagd",
      gemeinschaftsansitz: "Gemeinschaftsansitz",
      niederwildjagd: "Niederwildjagd"
    };
    return labels[form] || form;
  };

  const dateStr = (datum) => {
    try {
      return format(new Date(datum), "dd. MMM yyyy", { locale: de });
    } catch {
      return datum;
    }
  };

  return (
    <PageTransition>
      <div className="pt-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 px-4">
          <div className="w-10 h-10 bg-[#22c55e] rounded-full flex items-center justify-center">
            <Calendar className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Jagdkalender</h1>
            <p className="text-xs text-gray-400">Gesellschaftsjagden planen und koordinieren</p>
          </div>
        </div>

        {/* Calendar */}
        <div className="px-4 mb-6">
          <CalendarMonth 
            currentDate={new Date()} 
            onEventClick={(event) => { setSelectedEvent(event); setShowEventDetail(true); }}
            events={[...jagden, ...termine]} 
          />
        </div>

        {/* New Hunt Button */}
        <div className="px-4 mb-6">
          <Button className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-lg flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Neue Jagd
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 px-4 mb-8">
          <div className="bg-[#1e1e1e] rounded-lg border border-[#2d2d2d] p-4 text-center">
            <div className="text-2xl font-bold text-[#22c55e] mb-1">{aktiv}</div>
            <div className="text-xs text-gray-400">Aktiv</div>
          </div>
          <div className="bg-[#1e1e1e] rounded-lg border border-[#2d2d2d] p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">{geplant}</div>
            <div className="text-xs text-gray-400">Geplant</div>
          </div>
          <div className="bg-[#1e1e1e] rounded-lg border border-[#2d2d2d] p-4 text-center">
            <div className="text-2xl font-bold text-gray-400 mb-1">{abgeschlossen}</div>
            <div className="text-xs text-gray-400">Abgeschlossen</div>
          </div>
        </div>

        {/* Active Hunts */}
        {aktivList.length > 0 && (
          <div className="px-4 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 text-[#22c55e]" />
              <h2 className="text-xs font-bold text-[#22c55e] uppercase tracking-wider">Laufende Jagden</h2>
            </div>
            <div className="space-y-3">
              {aktivList.map(jagd => (
                <div key={jagd.id} className="bg-[#1e1e1e] rounded-lg border border-[#2d2d2d] p-4">
                  <div className="flex items-start gap-3">
                    <span className="px-2 py-1 text-xs font-semibold text-black bg-[#22c55e] rounded">
                      {jagd.status === "aktiv" ? "Aktiv" : jagd.status}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-100 truncate">{jagd.titel}</h3>
                      <p className="text-xs text-gray-400 mt-2">
                        <span className="block">{dateStr(jagd.datum)}</span>
                        <span className="text-gray-500">
                          {jagd.uhrzeit_start && `${jagd.uhrzeit_start}`}
                          {jagd.treffpunkt && ` • ${jagd.treffpunkt}`}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Hunts */}
        {abgeschlossenList.length > 0 && (
          <div className="px-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Abgeschlossen</h2>
            <div className="space-y-3">
              {abgeschlossenList.map(jagd => (
                <div key={jagd.id} className="bg-[#1e1e1e] rounded-lg border border-[#2d2d2d] p-4">
                  <div className="flex items-start gap-3">
                    <span className="px-2 py-1 text-xs font-semibold text-gray-300 bg-gray-700 rounded">
                      Abgeschlossen
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-100 truncate">{jagd.titel}</h3>
                      <p className="text-xs text-gray-400 mt-2">
                        <span className="block">{dateStr(jagd.datum)}</span>
                        <span className="text-gray-500">
                          {jagd.uhrzeit_start && `${jagd.uhrzeit_start}`}
                          {jagd.treffpunkt && ` • ${jagd.treffpunkt}`}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {jagden.length === 0 && (
          <div className="text-center py-12 px-4">
            <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Keine Jagden vorhanden</p>
            <p className="text-sm text-gray-500 mt-1">Erstellen Sie eine neue Jagd um zu starten</p>
          </div>
        )}

        {/* Event Detail Dialog */}
        <EventDetailDialog isOpen={showEventDetail} onClose={() => setShowEventDetail(false)} event={selectedEvent} />
      </div>
    </PageTransition>
  );
}