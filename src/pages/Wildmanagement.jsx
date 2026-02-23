import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { TreePine, ArrowRight, Eye } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

const SPECIES = [
  { key: "rotwild", label: "Rotwild", page: "WildRotwild", color: "bg-red-50 text-red-700" },
  { key: "schwarzwild", label: "Schwarzwild", page: "WildSchwarzwild", color: "bg-gray-100 text-gray-700" },
  { key: "rehwild", label: "Rehwild", page: "WildRehwild", color: "bg-amber-50 text-amber-700" },
  { key: "wolf", label: "Wolf", page: "WildWolf", color: "bg-blue-50 text-blue-700" },
];

export default function Wildmanagement() {
  const { tenant } = useAuth();

  const { data: entries = [] } = useQuery({
    queryKey: ["wildmgmt-overview", tenant?.id],
    queryFn: () => base44.entities.WildManagement.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Wildmanagement" subtitle="Sichtungen, Bestand und Ernte nach Wildart" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SPECIES.map(({ key, label, page, color }) => {
          const count = entries.filter(e => e.species === key).length;
          const observations = entries.filter(e => e.species === key && e.type === "observation").length;
          return (
            <Link key={key} to={createPageUrl(page)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-[#0F2F23]/20 hover:shadow-md transition-all group flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} bg-opacity-20`}>
                  <TreePine className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#0F2F23]">{label}</h3>
                  <p className="text-sm text-gray-500">{count} Einträge · {observations} Sichtungen</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#0F2F23] transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}