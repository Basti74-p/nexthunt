import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Map, Crosshair, ListTodo, Calendar, Warehouse, Refrigerator, MoreHorizontal, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import MobileTopBar from "./MobileTopBar";
import { useI18n } from "@/lib/i18n";

const MAX_VISIBLE_TABS = 4;

const TAB_ROOT_PAGES = ["MobileMap", "MobileStrecke", "MobileTasks", "MobileKalender", "MobileEinrichtungen", "MobileWildkammer"];

const TAB_NAMES = {
  MobileMap: "Karte",
  MobileStrecke: "Strecke",
  MobileTasks: "Aufgaben",
  MobileMonitor: "Monitor",
  MobileKalender: "Kalender",
  JagdkalenderMain: "Kalender",
  JagdDetail: "Jagd",
  MobileEinrichtungen: "Einrichtungen",
  MobileWildkammer: "Wildkammer",
  MobileEinrichtungsDetail: "Einrichtung",
  MobileAufgabenDetail: "Aufgabe",
};

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
  const tabLastPage = useRef({});
  const [moreOpen, setMoreOpen] = useState(false);

  const allTabs = [
    { nameKey: "tab_map", icon: Map, page: "MobileMap", feature: "feature_map" },
    { nameKey: "tab_strecke", icon: Crosshair, page: "MobileStrecke", feature: "feature_strecke" },
    { nameKey: "tab_aufgaben", icon: ListTodo, page: "MobileTasks", feature: "feature_tasks" },
    { nameKey: "tab_kalender", icon: Calendar, page: "MobileKalender", feature: "feature_kalender" },
    { nameKey: "tab_einrichtungen", icon: Warehouse, page: "MobileEinrichtungen", feature: "feature_einrichtungen" },
    { nameKey: "tab_wildkammer", icon: Refrigerator, page: "MobileWildkammer", feature: "feature_wildkammer" },
  ].filter(tab => tab.feature === null || tenantFeatures[tab.feature] !== false);

  const visibleTabs = allTabs.slice(0, MAX_VISIBLE_TABS);
  const overflowTabs = allTabs.slice(MAX_VISIBLE_TABS);
  const hasOverflow = overflowTabs.length > 0;

  useEffect(() => {
    const ownerTab = CHILD_TO_TAB[currentPage] || (TAB_ROOT_PAGES.includes(currentPage) ? currentPage : null);
    if (ownerTab) {
      tabLastPage.current[ownerTab] = window.location.pathname + window.location.search;
    }
  }, [currentPage]);

  const handleTabPress = (tabPage) => {
    setMoreOpen(false);
    const savedPath = tabLastPage.current[tabPage];
    if (savedPath && currentPage !== tabPage) {
      navigate(savedPath);
    } else {
      navigate(createPageUrl(tabPage));
    }
  };

  const activeTab = CHILD_TO_TAB[currentPage] || currentPage;
  const isChildPage = !!CHILD_TO_TAB[currentPage];
  const activeInOverflow = overflowTabs.some(t => t.page === activeTab);

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

      {/* More drawer overlay */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-16 left-0 right-0 z-50 bg-[#1e1e1e] border-t border-[#3a3a3a] px-4 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-300">Mehr</span>
              <button onClick={() => setMoreOpen(false)} className="text-gray-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {overflowTabs.map(({ nameKey, icon: TabIcon, page }) => {
                const isActive = activeTab === page;
                return (
                  <button
                    key={page}
                    onClick={() => handleTabPress(page)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                      isActive ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#2a2a2a] text-gray-400"
                    }`}
                  >
                    <TabIcon className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
                    <span className="text-xs font-medium">{t(nameKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Bottom tabs */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-[#3a3a3a] z-50 flex justify-around px-2 py-2 safe-area-pb select-none">
        {visibleTabs.map(({ nameKey, icon: TabIcon, page }) => {
          const isActive = activeTab === page;
          return (
            <button
              key={page}
              onClick={() => handleTabPress(page)}
              className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all select-none ${
                isActive ? "text-[#22c55e]" : "text-gray-500"
              }`}
            >
              <TabIcon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
              <span className={`text-[10px] font-medium ${isActive ? "text-[#22c55e]" : "text-gray-500"}`}>{t(nameKey)}</span>
            </button>
          );
        })}

        {/* "Mehr" button */}
        {hasOverflow && (
          <button
            onClick={() => setMoreOpen(v => !v)}
            className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all select-none ${
              moreOpen || activeInOverflow ? "text-[#22c55e]" : "text-gray-500"
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 ${moreOpen || activeInOverflow ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
            <span className={`text-[10px] font-medium ${moreOpen || activeInOverflow ? "text-[#22c55e]" : "text-gray-500"}`}>Mehr</span>
          </button>
        )}
      </nav>
    </>
  );
}