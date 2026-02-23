import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Crosshair, Archive, Truck, ArrowRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

const SECTIONS = [
  { label: "Abschussplan", page: "StreckeAbschussplan", icon: Crosshair, desc: "Planung und Soll-Ist-Vergleich", color: "bg-blue-50 text-blue-600" },
  { label: "Wildkammer", page: "StreckeWildkammer", icon: Archive, desc: "Verwaltung der Wildkammer", color: "bg-emerald-50 text-emerald-600" },
  { label: "Wildverkauf", page: "StreckeWildverkauf", icon: Truck, desc: "Verkaufsdokumentation", color: "bg-amber-50 text-amber-600" },
  { label: "Archiv", page: "StreckeArchiv", icon: Archive, desc: "Historische Streckendaten", color: "bg-gray-100 text-gray-600" },
];

export default function Strecke() {
  const { tenant } = useAuth();

  const { data: strecken = [] } = useQuery({
    queryKey: ["strecke-overview", tenant?.id],
    queryFn: () => base44.entities.Strecke.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const byStatus = (status) => strecken.filter(s => s.status === status).length;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Strecke" subtitle={`${strecken.length} Einträge gesamt`} />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Erfasst", status: "erfasst", color: "text-amber-600" },
          { label: "Bestätigt", status: "bestaetigt", color: "text-blue-600" },
          { label: "Wildkammer", status: "wildkammer", color: "text-purple-600" },
          { label: "Verkauft", status: "verkauft", color: "text-emerald-600" },
        ].map(({ label, status, color }) => (
          <div key={status} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{byStatus(status)}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECTIONS.map(({ label, page, icon: Icon, desc, color }) => (
          <Link key={page} to={createPageUrl(page)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-[#0F2F23]/20 hover:shadow-md transition-all group flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#0F2F23]">{label}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#0F2F23] transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}