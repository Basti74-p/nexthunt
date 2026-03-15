import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { TreePine, ArrowRight, Eye } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

const SPECIES = [
  { key: "rotwild", label: "Rotwild", page: "WildRotwild", color: "bg-red-900/30 text-red-400" },
  { key: "schwarzwild", label: "Schwarzwild", page: "WildSchwarzwild", color: "bg-gray-900/30 text-gray-400" },
  { key: "rehwild", label: "Rehwild", page: "WildRehwild", color: "bg-amber-900/30 text-amber-400" },
  { key: "wolf", label: "Wolf", page: "WildWolf", color: "bg-blue-900/30 text-blue-400" },
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
              className="bg-[#3a3a3a] rounded-2xl border border-[#4a4a4a] shadow-sm p-6 hover:border-[#22c55e]/30 hover:shadow-md transition-all group flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
                  <TreePine className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 group-hover:text-[#22c55e]">{label}</h3>
                  <p className="text-sm text-gray-400">{count} Einträge · {observations} Sichtungen</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-[#22c55e] transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}