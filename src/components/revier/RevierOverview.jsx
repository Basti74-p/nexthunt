import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapPin, Ruler, TreePine, Crosshair, ListTodo, Calendar } from "lucide-react";

export default function RevierOverview({ revier }) {
  const { data: strecken = [] } = useQuery({
    queryKey: ["strecke-overview", revier.id],
    queryFn: () => base44.entities.Strecke.filter({ revier_id: revier.id }),
  });

  const { data: aufgaben = [] } = useQuery({
    queryKey: ["aufgaben-overview", revier.id],
    queryFn: () => base44.entities.Aufgabe.filter({ revier_id: revier.id, status: "offen" }),
  });

  const { data: einrichtungen = [] } = useQuery({
    queryKey: ["einrichtungen-overview", revier.id],
    queryFn: () => base44.entities.Jagdeinrichtung.filter({ revier_id: revier.id }),
  });

  const stats = [
    { label: "Jagdeinrichtungen", value: einrichtungen.length, icon: TreePine, color: "bg-emerald-50 text-emerald-600" },
    { label: "Strecke (gesamt)", value: strecken.length, icon: Crosshair, color: "bg-blue-50 text-blue-600" },
    { label: "Offene Aufgaben", value: aufgaben.length, icon: ListTodo, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Revier info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revier-Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Region</span>
            <p className="font-medium text-gray-900 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {revier.region || "—"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Größe</span>
            <p className="font-medium text-gray-900 mt-1 flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5 text-gray-400" />
              {revier.flaeche_ha ? `${revier.flaeche_ha.toFixed(1)} ha` : revier.size_ha ? `${revier.size_ha} ha` : "—"}
            </p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Notizen</span>
            <p className="font-medium text-gray-900 mt-1">{revier.notes || "—"}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}