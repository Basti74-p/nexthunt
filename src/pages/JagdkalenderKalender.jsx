import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Plus, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import CalendarMonth from "@/components/calendar/CalendarMonth";
import TerminDialog from "@/components/calendar/TerminDialog";
import { Button } from "@/components/ui/button";

export default function JagdkalenderKalender() {
  const { tenant } = useAuth();
  const [showTerminDialog, setShowTerminDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const { data: jagden = [] } = useQuery({
    queryKey: ["gesellschaftsjagden", tenant?.id],
    queryFn: () => base44.entities.GesellschaftsJagd.filter({ tenant_id: tenant?.id }, "-datum", 100),
    enabled: !!tenant?.id,
  });

  const { data: termine = [] } = useQuery({
    queryKey: ["termine", tenant?.id],
    queryFn: () => base44.entities.Termin.filter({ tenant_id: tenant?.id }, "-datum", 100),
    enabled: !!tenant?.id,
  });

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowTerminDialog(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-[#22c55e]" />
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Jagdkalender</h1>
            <p className="text-sm text-gray-400">Übersicht aller Termine & Jagden</p>
          </div>
        </div>
        <Button onClick={() => { setSelectedDate(null); setShowTerminDialog(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Neuer Termin
        </Button>
      </div>

      {/* Kalender */}
      <CalendarMonth currentDate={new Date()} onDateSelect={handleDateSelect} events={[...jagden, ...termine]} />

      {/* Kommende Events */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Kommende Events</h2>
        <div className="space-y-2">
          {[...jagden, ...termine]
            .filter(e => new Date(e.datum) >= new Date())
            .sort((a, b) => new Date(a.datum) - new Date(b.datum))
            .slice(0, 10)
            .map(e => (
              <div key={e.id} className="bg-[#1e1e1e] rounded-xl border border-[#2d2d2d] p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-100">{e.titel}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(e.datum), "dd. MMM yyyy", { locale: de })}
                    {e.uhrzeit_start ? ` · ${e.uhrzeit_start}` : ""}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </div>
            ))}
        </div>
      </div>

      <TerminDialog isOpen={showTerminDialog} onClose={() => setShowTerminDialog(false)} selectedDate={selectedDate} tenant={tenant} />
    </div>
  );
}