import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./components/hooks/useAuth";
import { useMobile } from "./components/hooks/useMobile";
import DesktopSidebar from "./components/navigation/DesktopSidebar";
import MobileNav from "./components/navigation/MobileNav";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

function LayoutInner({ children, currentPageName }) {
  const { user, loading } = useAuth();
  const isMobile = useMobile();
  const [initializingTrial, setInitializingTrial] = useState(false);

  // Auto-apply dark theme based on system preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  // Initialize trial for new users on first login
  useEffect(() => {
    if (user && !loading && !initializingTrial) {
      const initTrial = async () => {
        // Check if we already tried to initialize to prevent infinite loops
        if (sessionStorage.getItem('trial_init_started')) {
          return;
        }
        
        try {
          setInitializingTrial(true);
          sessionStorage.setItem('trial_init_started', 'true');
          
          // Check if user has a tenant via TenantMember
          const members = await base44.entities.TenantMember.filter({ user_email: user.email });
          
          if (members.length === 0) {
            // No tenant found, initialize trial
            console.log('Initializing trial for new user:', user.email);
            const result = await base44.functions.invoke('initializeUserTrial', {});
            console.log('Trial initialization result:', result);
            
            // Give the backend time to create records, then refresh
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            console.log('User already has tenant, skipping trial init');
            setInitializingTrial(false);
          }
        } catch (error) {
          console.error('Error initializing trial:', error);
          sessionStorage.removeItem('trial_init_started');
          setInitializingTrial(false);
        }
      };
      initTrial();
    }
  }, [user, loading]);

  if (loading || initializingTrial) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2d2d2d]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#22c55e]" />
          <p className="text-sm text-gray-400">{initializingTrial ? 'Trial wird vorbereitet...' : 'Laden...'}</p>
        </div>
      </div>
    );
  }

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

  // Mobile mode: All pages render with mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] overflow-x-hidden">
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