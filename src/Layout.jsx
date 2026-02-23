import React from "react";
import { AuthProvider, useAuth } from "./components/hooks/useAuth";
import { useMobile } from "./components/hooks/useMobile";
import DesktopSidebar from "./components/navigation/DesktopSidebar";
import MobileNav from "./components/navigation/MobileNav";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

function LayoutInner({ children, currentPageName }) {
  const { user, loading } = useAuth();
  const isMobile = useMobile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F8]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0F2F23]" />
          <p className="text-sm text-gray-500">Laden...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F8]">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-[#0F2F23] rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">NextHunt</h2>
          <p className="text-sm text-gray-500">Bitte melden Sie sich an</p>
          <button
            onClick={() => base44.auth.redirectToLogin()}
            className="px-6 py-2.5 bg-[#0F2F23] text-white rounded-xl text-sm font-medium hover:bg-[#1a4a36] transition-colors"
          >
            Anmelden
          </button>
        </div>
      </div>
    );
  }

  // Mobile mode
  const mobilePages = ["MobileMap", "MobileSightings", "MobileStrecke", "MobileTasks", "MobileMonitor"];
  if (isMobile && !mobilePages.includes(currentPageName) && currentPageName !== "PlatformAdmin") {
    // Redirect to mobile map on mobile
    return (
      <div className="min-h-screen bg-[#F7F7F8]">
        <MobileNav currentPage={currentPageName} />
        <main className="pt-14 pb-20 px-4">
          {children}
        </main>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#F7F7F8]">
        <MobileNav currentPage={currentPageName} />
        <main className="pt-14 pb-20 px-4">
          {children}
        </main>
      </div>
    );
  }

  // Desktop mode
  return (
    <div className="min-h-screen bg-[#242424]">
      <DesktopSidebar currentPage={currentPageName} />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <AuthProvider>
      <LayoutInner currentPageName={currentPageName}>{children}</LayoutInner>
    </AuthProvider>
  );
}