import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CalendarMonth({ currentDate, onDateSelect, onEventClick, events = [] }) {
  const [month, setMonth] = useState(currentDate);

  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });

  // Fill with previous month's days (Monday = 0)
   const firstDayOfWeek = (start.getDay() + 6) % 7;
   const prevMonthDays = Array.from({ length: firstDayOfWeek }, (_, i) => null);

  const allDays = [...prevMonthDays, ...days];

  const getEventsForDay = (date) => {
    if (!date) return [];
    return events.filter(e => isSameDay(new Date(e.datum), date));
  };

  return (
    <div className="bg-[#1e1e1e] rounded-2xl border border-[#2d2d2d] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-100">
          {format(month, "MMMM yyyy", { locale: de })}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-2">
        {allDays.map((date, idx) => {
          const dayEvents = date ? getEventsForDay(date) : [];
          const isCurrentMonth = date && isSameMonth(date, month);
          const isToday = date && isSameDay(date, new Date());

          return (
            <div
              key={idx}
              onClick={() => date && onDateSelect?.(date)}
              className={`min-h-20 p-2 rounded-lg border cursor-pointer transition-colors ${
                !isCurrentMonth
                  ? "bg-[#2d2d2d]/30 border-[#2d2d2d]/30"
                  : isToday
                  ? "bg-[#22c55e]/20 border-[#22c55e]"
                  : "bg-[#2d2d2d] border-[#2d2d2d] hover:border-[#22c55e]/40"
              }`}
            >
              <div className={`text-xs font-semibold mb-1 ${isCurrentMonth ? "text-gray-200" : "text-gray-500"}`}>
                {date && format(date, "d")}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick?.(event); }}
                    className="text-[10px] bg-[#22c55e]/20 text-[#22c55e] px-1.5 py-0.5 rounded truncate cursor-pointer hover:bg-[#22c55e]/30 transition-colors"
                  >
                    {event.titel}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[10px] text-gray-400">+{dayEvents.length - 2}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}