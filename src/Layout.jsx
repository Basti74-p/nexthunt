import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./components/hooks/useAuth";
import { useMobile } from "./components/hooks/useMobile";
import DesktopSidebar from "./components/navigation/DesktopSidebar";
import MobileNav from "./components/navigation/MobileNav";
import OfflineIndicator from "./components/OfflineIndicator";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";

function LayoutInner({ children, currentPageName }) {
  const { user, loading, tenant } = useAuth();
  const isMobile = useMobile();
  const [showLogoAnimation, setShowLogoAnimation] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowLogoAnimation(false), 7000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-apply dark theme based on system preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  if (showLogoAnimation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2d2d2d]">
        <style>{`
          @keyframes logoPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          @keyframes circlePulse {
            0%, 100% { r: 60px; opacity: 1; }
            100% { r: 120px; opacity: 0; }
          }
          .logo-container {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-animate {
            animation: logoPulse 7s ease-in-out forwards;
            position: relative;
            z-index: 2;
          }
          .pulse-circle {
            position: absolute;
            animation: circlePulse 7s ease-out forwards;
          }
        `}</style>
        <div className="logo-container">
          <svg className="pulse-circle" width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="60" fill="none" stroke="#22c55e" strokeWidth="2" />
          </svg>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c370741b119950032ab62/7a1f75278_NextHunt_logo_transparent.png"
            alt="NextHunt Logo"
            className="w-32 h-auto logo-animate"
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2d2d2d]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#22c55e]" />
          <p className="text-sm text-gray-400">Laden...</p>
        </div>
      </div>
    );
  }

  // Calculate trial days remaining
  const trialDaysRemaining = tenant && tenant.trial_end_date
    ? Math.ceil((new Date(tenant.trial_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2d2d2d]">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-[#22c55e] rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-100">NextHunt</h2>
          <p className="text-sm text-gray-400">Bitte melden Sie sich an</p>
          <button
            onClick={() => base44.auth.redirectToLogin()}
            className="px-6 py-2.5 bg-[#22c55e] text-black rounded-xl text-sm font-medium hover:bg-[#16a34a] transition-colors"
          >
            Anmelden
          </button>
        </div>
      </div>
    );
  }

  // No tenant access: user must be invited by admin
  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2d2d2d]">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-100">Kein Zugriff</h2>
          <p className="text-sm text-gray-400 max-w-xs">Sie wurden noch nicht zu einem Revier/Mandanten hinzugefügt. Bitte warten Sie auf die Freigabe durch einen Administrator.</p>
          <button
            onClick={() => base44.auth.logout()}
            className="px-6 py-2.5 bg-gray-700 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-600 transition-colors"
          >
            Abmelden
          </button>
        </div>
      </div>
    );
  }

  // Solo plan: Desktop gesperrt — nur Mobile erlaubt
  if (!isMobile && tenant?.plan === "solo") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2d2d2d]">
        <div className="text-center space-y-5 max-w-sm px-6">
          <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-100">Nur Mobile verfügbar</h2>
            <p className="text-sm text-gray-400 mt-2">
              Dein <span className="text-[#22c55e] font-semibold">Solo-Paket</span> beinhaltet nur den Zugang über die NextHunt Mobile-App. Für die Desktop-Version benötigst du das Pro- oder Enterprise-Paket.
            </p>
          </div>
          <a
            href="https://app.nexthunt-portal.de/PaketePreise"
            className="inline-block px-6 py-2.5 bg-[#22c55e] text-black rounded-xl text-sm font-semibold hover:bg-[#16a34a] transition-colors"
          >
            Upgrade auf Pro
          </a>
          <button
            onClick={() => base44.auth.logout()}
            className="block mx-auto text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Abmelden
          </button>
        </div>
      </div>
    );
  }

  // Mobile mode: All pages render with mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] overflow-x-hidden">
        <OfflineIndicator />
        {tenant?.status === 'trial' && trialDaysRemaining !== null && (
          <div className="bg-[#22c55e] text-black px-4 py-2 text-center text-sm font-medium">
            🎉 30-Tage Vollversion – {trialDaysRemaining} {trialDaysRemaining === 1 ? 'Tag' : 'Tage'} verbleibend
          </div>
        )}
        <MobileNav currentPage={currentPageName} />
        <main className="pt-14 pb-20 px-4 max-w-full w-full">
          {children}
        </main>
      </div>
    );
  }

  // Desktop mode
  return (
    <div className="min-h-screen bg-[#2d2d2d]">
      <OfflineIndicator />
      {tenant?.status === 'trial' && trialDaysRemaining !== null && (
        <div className="bg-[#22c55e] text-black px-4 py-2 text-center text-sm font-medium">
          🎉 30-Tage Vollversion – {trialDaysRemaining} {trialDaysRemaining === 1 ? 'Tag' : 'Tage'} verbleibend
        </div>
      )}
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