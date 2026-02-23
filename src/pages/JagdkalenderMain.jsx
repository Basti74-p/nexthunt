import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Radio, UserCheck, UserCog, ArrowRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

const SECTIONS = [
  { label: "Jagdmonitor", page: "Jagdkalender", icon: Radio, desc: "Aktive Gesellschaftsjagden überwachen", color: "bg-emerald-50 text-emerald-600" },
  { label: "Jagdgäste", page: "Jagdgaeste", icon: UserCheck, desc: "Gäste verwalten und einladen", color: "bg-blue-50 text-blue-600" },
  { label: "Personal", page: "Personal", icon: UserCog, desc: "Personaleinsatz planen", color: "bg-amber-50 text-amber-600" },
];

export default function JagdkalenderMain() {
  const { tenant } = useAuth();

  const { data: events = [] } = useQuery({
    queryKey: ["jagdevents-main", tenant?.id],
    queryFn: () => base44.entities.JagdEvent.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const planned = events.filter(e => e.status === "planned").length;
  const active = events.filter(e => e.status === "active").length;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Jagdkalender" subtitle="Termine, Jagden und Personaleinsatz" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{events.length}</p>
          <p className="text-xs text-gray-500 mt-1">Gesamt</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{planned}</p>
          <p className="text-xs text-gray-500 mt-1">Geplant</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{active}</p>
          <p className="text-xs text-gray-500 mt-1">Aktiv</p>
        </div>
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SECTIONS.map(({ label, page, icon: Icon, desc, color }) => (
          <Link key={page} to={createPageUrl(page)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-[#0F2F23]/20 hover:shadow-md transition-all group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} mb-4`}>
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#0F2F23]">{label}</h3>
            <p className="text-sm text-gray-500 mt-1">{desc}</p>
            <div className="flex items-center gap-1 text-xs text-[#0F2F23] font-medium mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              Öffnen <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}