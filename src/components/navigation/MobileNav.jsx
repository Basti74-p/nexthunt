import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Map, Crosshair, ListTodo, Calendar, Warehouse } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import MobileTopBar from "./MobileTopBar";
import { useI18n } from "@/lib/i18n";

// Root (tab) pages — navigating to these resets to the tab root
const TAB_ROOT_PAGES = ["MobileMap", "MobileStrecke", "MobileTasks", "MobileKalender", "MobileEinrichtungen"];

const TAB_NAMES = {
  MobileMap: "Karte",
  MobileStrecke: "Strecke",
  MobileTasks: "Aufgaben",
  MobileMonitor: "Monitor",
  MobileKalender: "Kalender",
  JagdkalenderMain: "Kalender",
  JagdDetail: "Jagd",
  MobileEinrichtungen: "Einrichtungen",
  MobileEinrichtungsDetail: "Einrichtung",
  MobileAufgabenDetail: "Aufgabe",
};

// Child → parent tab mapping
const CHILD_TO_TAB = {
  MobileAufgabenDetail: "MobileTasks",
  MobileEinrichtungsDetail: "MobileEinrichtungen",
  JagdDetail: "MobileKalender",
  JagdkalenderMain: "MobileKalender",
  MobileMonitor: "MobileKalender",
};

export default function MobileNav({ currentPage }) {
  const { tenantFeatures } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  // Per-tab last visited page: { MobileTasks: "/MobileAufgabenDetail?id=123", ... }
  const tabLastPage = useRef({});

  const tabs = [
    { nameKey: "tab_map", icon: Map, page: "MobileMap", feature: "feature_map" },
    { nameKey: "tab_strecke", icon: Crosshair, page: "MobileStrecke", feature: "feature_strecke" },
    { nameKey: "tab_aufgaben", icon: ListTodo, page: "MobileTasks", feature: "feature_tasks" },
    { nameKey: "tab_kalender", icon: Calendar, page: "MobileKalender", feature: "feature_kalender" },
    { nameKey: "tab_einrichtungen", icon: Warehouse, page: "MobileEinrichtungen", feature: "feature_einrichtungen" },
  ].filter(tab => tab.feature === null || tenantFeatures[tab.feature] !== false);

  // Track current page in its tab's history slot
  useEffect(() => {
    const ownerTab = CHILD_TO_TAB[currentPage] || (TAB_ROOT_PAGES.includes(currentPage) ? currentPage : null);
    if (ownerTab) {
      tabLastPage.current[ownerTab] = window.location.pathname + window.location.search;
    }
  }, [currentPage]);

  const handleTabPress = (tabPage) => {
    const savedPath = tabLastPage.current[tabPage];
    if (savedPath && currentPage !== tabPage) {
      navigate(savedPath);
    } else {
      navigate(createPageUrl(tabPage));
    }
  };

  // Determine which tab is "active" (includes child pages)
  const activeTab = CHILD_TO_TAB[currentPage] || currentPage;
  const isChildPage = !!CHILD_TO_TAB[currentPage];

  return (
    <>
      {/* Top bar */}
      {currentPage !== "MobileMap" && (
        <MobileTopBar
          title={TAB_NAMES[currentPage] || "NextHunt"}
          showBackButton={isChildPage}
          onBack={() => navigate(-1)}
        />
      )}

      {/* Bottom tabs */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-[#3a3a3a] z-50 flex justify-around px-2 py-2 safe-area-pb select-none">
        {tabs.map(({ name, icon: Icon, page }) => {
          const isActive = activeTab === page;
          return (
            <button
              key={page}
              onClick={() => handleTabPress(page)}
              className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all select-none ${
                isActive ? "text-[#22c55e]" : "text-gray-500"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
              <span className={`text-[10px] font-medium ${isActive ? "text-[#22c55e]" : "text-gray-500"}`}>{name}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}