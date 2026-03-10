import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Map, Eye, Crosshair, ListTodo, Radio } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import MobileTopBar from "./MobileTopBar";

const TAB_NAMES = {
  MobileMap: "Karte",
  MobileSightings: "Sichtungen",
  MobileStrecke: "Strecke",
  MobileTasks: "Aufgaben",
  MobileMonitor: "Monitor",
};

export default function MobileNav({ currentPage }) {
  const { tenantFeatures } = useAuth();
  const [tabHistories, setTabHistories] = useState({});

  const tabs = [
    { name: "Karte", icon: Map, page: "MobileMap", feature: "feature_map" },
    { name: "Sichtungen", icon: Eye, page: "MobileSightings", feature: "feature_sightings" },
    { name: "Strecke", icon: Crosshair, page: "MobileStrecke", feature: "feature_strecke" },
    { name: "Aufgaben", icon: ListTodo, page: "MobileTasks", feature: "feature_tasks" },
    { name: "Monitor", icon: Radio, page: "MobileMonitor", feature: "feature_driven_hunt" },
  ].filter(t => tenantFeatures[t.feature] !== false);

  // Track tab switches for history management
  useEffect(() => {
    setTabHistories(prev => ({
      ...prev,
      [currentPage]: (prev[currentPage] || []).concat(currentPage)
    }));
  }, [currentPage]);

  return (
    <>
      {/* Top bar */}
      <MobileTopBar 
        title={TAB_NAMES[currentPage] || "NextHunt"} 
        showBackButton={false}
      />

      {/* Bottom tabs */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 flex justify-around px-2 py-2 safe-area-pb select-none">
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
    </>
  );
}