import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Map, Eye, Crosshair, ListTodo, Radio, TreePine } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function MobileNav({ currentPage }) {
  const { tenantFeatures } = useAuth();

  const tabs = [
    { name: "Karte", icon: Map, page: "MobileMap", feature: "feature_map" },
    { name: "Sichtungen", icon: Eye, page: "MobileSightings", feature: "feature_sightings" },
    { name: "Strecke", icon: Crosshair, page: "MobileStrecke", feature: "feature_strecke" },
    { name: "Aufgaben", icon: ListTodo, page: "MobileTasks", feature: "feature_tasks" },
    { name: "Monitor", icon: Radio, page: "MobileMonitor", feature: "feature_driven_hunt" },
  ].filter(t => tenantFeatures[t.feature] !== false);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-pb">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-50 px-4 py-3 safe-area-pt flex items-center gap-2 select-none">
        <div className="w-7 h-7 bg-[#0F2F23] rounded-lg flex items-center justify-center">
          <TreePine className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-[#0F2F23]">NextHunt</span>
      </div>

      {/* Bottom tabs */}
      <nav className="flex justify-around px-2 py-2 select-none">
        {tabs.map(({ name, icon: Icon, page }) => {
          const isActive = currentPage === page;
          return (
            <Link
              key={page}
              to={createPageUrl(page)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all select-none ${
                isActive
                  ? "text-[#0F2F23]"
                  : "text-gray-400"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium">{name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}