import React from "react";
import {
  LayoutDashboard, Map, Building, TreePine, Crosshair,
  Tag, Calendar, ListTodo, Users, Globe
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const ALL_TABS = [
  { key: "overview", label: "Übersicht", icon: LayoutDashboard, feature: null },
  { key: "map", label: "Karte", icon: Map, feature: "feature_map" },
  { key: "einrichtungen", label: "Jagdeinrichtungen", icon: Building, feature: null },
  { key: "wildmanagement", label: "Wildmanagement", icon: TreePine, feature: "feature_sightings" },
  { key: "strecke", label: "Strecke", icon: Crosshair, feature: "feature_strecke" },
  { key: "wildmarken", label: "Wildmarken", icon: Tag, feature: "feature_wildmarken" },
  { key: "kalender", label: "Jagdkalender", icon: Calendar, feature: null },
  { key: "aufgaben", label: "Aufgaben", icon: ListTodo, feature: "feature_tasks" },
  { key: "gesellschaftsjagd", label: "Gesellschaftsjagd", icon: Users, feature: "feature_driven_hunt" },
  { key: "public", label: "Öffentlich", icon: Globe, feature: "feature_public_portal" },
];

export default function RevierTabs({ activeTab, onTabChange }) {
  const { tenantFeatures } = useAuth();

  const tabs = ALL_TABS.filter(
    (t) => t.feature === null || tenantFeatures[t.feature] !== false
  );

  return (
    <div className="w-48 shrink-0">
      <div className="flex flex-col gap-0.5">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
              activeTab === key
                ? "bg-[#22c55e] text-[#1e1e1e]"
                : "text-gray-400 hover:bg-[#2d2d2d] hover:text-gray-200"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}