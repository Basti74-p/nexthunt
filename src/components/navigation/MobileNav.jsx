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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-16 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-[#333] px-5 pt-5 pb-6 rounded-t-3xl shadow-2xl">
            {/* Handle bar */}
            <div className="w-10 h-1 bg-[#444] rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold text-white tracking-wide">Weitere Module</span>
              <button onClick={() => setMoreOpen(false)} className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {overflowTabs.map(({ nameKey, icon: TabIcon, page }) => {
                const isActive = activeTab === page;
                return (
                  <button
                    key={page}
                    onClick={() => handleTabPress(page)}
                    className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all active:scale-95 ${
                      isActive
                        ? "bg-[#22c55e]/15 border border-[#22c55e]/40"
                        : "bg-[#242424] border border-[#333] hover:border-[#444]"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#22c55e]" />
                    )}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      isActive ? "bg-[#22c55e]/20" : "bg-[#2e2e2e]"
                    }`}>
                      <TabIcon className={`w-5 h-5 ${isActive ? "text-[#22c55e] stroke-[2]" : "text-gray-400 stroke-[1.5]"}`} />
                    </div>
                    <span className={`text-xs font-semibold ${isActive ? "text-[#22c55e]" : "text-gray-300"}`}>
                      {t(nameKey)}
                    </span>
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