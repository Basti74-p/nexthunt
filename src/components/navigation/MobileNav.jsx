import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Map, Eye, Crosshair, ListTodo, Radio, Calendar, Wind } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import MobileTopBar from "./MobileTopBar";

const TAB_NAMES = {
  MobileMap: "Karte",
  MobileSightings: "Sichtungen",
  MobileStrecke: "Strecke",
  MobileTasks: "Aufgaben",
  MobileMonitor: "Monitor",
  JagdkalenderMain: "Jagdkalender",
  JagdDetail: "Jagd",
};

export default function MobileNav({ currentPage }) {
  const { tenantFeatures } = useAuth();
  const [tabHistories, setTabHistories] = useState({});

  const [showWeather, setShowWeather] = useState(false);

  const tabs = [
    { name: "Karte", icon: Map, page: "MobileMap", feature: "feature_map" },
    { name: "Sichtungen", icon: Eye, page: "MobileSightings", feature: "feature_sightings" },
    { name: "Strecke", icon: Crosshair, page: "MobileStrecke", feature: "feature_strecke" },
    { name: "Aufgaben", icon: ListTodo, page: "MobileTasks", feature: "feature_tasks" },
    { name: "Jagd", icon: Calendar, page: "JagdkalenderMain", feature: "feature_kalender" },
    { name: "Monitor", icon: Radio, page: "MobileMonitor", feature: "feature_driven_hunt" },
    { name: "Wetter", icon: Wind, page: "weather", feature: null, action: () => setShowWeather(!showWeather) },
  ].filter(t => tenantFeatures[t.feature] !== false || t.feature === null);

  // Track tab switches for history management
  useEffect(() => {
    setTabHistories(prev => ({
      ...prev,
      [currentPage]: (prev[currentPage] || []).concat(currentPage)
    }));
  }, [currentPage]);

  return (
    <>
      {/* Top bar – auf der Karte ausblenden (Vollbild) */}
      {currentPage !== "MobileMap" && (
        <MobileTopBar 
          title={TAB_NAMES[currentPage] || "NextHunt"} 
          showBackButton={false}
        />
      )}

      {/* Bottom tabs */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-[#3a3a3a] z-50 flex justify-around px-2 py-2 safe-area-pb select-none">
        {tabs.map(({ name, icon: Icon, page }) => {
          const isActive = currentPage === page;
          return (
            <Link
              key={page}
              to={createPageUrl(page)}
              className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all select-none ${
                isActive ? "text-[#22c55e]" : "text-gray-500"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
              <span className={`text-[10px] font-medium ${isActive ? "text-[#22c55e]" : "text-gray-500"}`}>{name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}