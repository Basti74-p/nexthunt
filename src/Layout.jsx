import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./components/hooks/useAuth";
import { useMobile } from "./components/hooks/useMobile";
import DesktopSidebar from "./components/navigation/DesktopSidebar";
import MobileNav from "./components/navigation/MobileNav";
import OfflineIndicator from "./components/OfflineIndicator";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

function LayoutInner({ children, currentPageName }) {
  const { user, loading, tenant } = useAuth();
  const isMobile = useMobile();
  const [initializingTrial, setInitializingTrial] = useState(false);
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

  // Initialize trial for new users on first login
  useEffect(() => {
    if (user && !loading && !initializingTrial) {
      const initTrial = async () => {
        try {
          setInitializingTrial(true);
          
          // Check if user already has a tenant (via tenant_id or TenantMember)
          const hasTenantId = !!user.tenant_id;
          const members = await base44.entities.TenantMember.filter({ user_email: user.email });
          const tenants = await base44.entities.Tenant.filter({ contact_email: user.email });
          
          if (!hasTenantId && members.length === 0 && tenants.length === 0) {
            // No tenant found, initialize trial directly
            console.log('Initializing trial for new user:', user.email);
            
            const now = new Date();
            const trialEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            
            const newTenant = await base44.entities.Tenant.create({
              name: `${user.full_name}'s Revier`,
              contact_person: user.full_name,
              contact_email: user.email,
              status: 'trial',
              plan: 'free_trial',
              trial_start_date: now.toISOString(),
              trial_end_date: trialEndDate.toISOString(),
              trial_days_remaining: 30,
              feature_map: true,
              feature_sightings: true,
              feature_strecke: true,
              feature_wildkammer: true,
              feature_tasks: true,
              feature_driven_hunt: true,
              feature_public_portal: true,
              feature_wildmarken: true,
              feature_dashboard: true,
              feature_reviere: true,
              feature_kalender: true,
              feature_personen: true,
              feature_einrichtungen: true
            });

            await base44.entities.TenantMember.create({
              tenant_id: newTenant.id,
              user_email: user.email,
              first_name: user.full_name.split(' ')[0],
              last_name: user.full_name.split(' ').slice(1).join(' ') || 'User',
              role: 'tenant_owner',
              status: 'active',
              perm_wildmanagement: true,
              perm_strecke: true,
              perm_wildkammer: true,
              perm_kalender: true,
              perm_aufgaben: true,
              perm_personen: true,
              perm_oeffentlichkeit: true,
              perm_einrichtungen: true
            });
            
            console.log('Trial initialized, reloading...');
            setTimeout(() => {
              window.location.reload();
            }, 500);
          } else {
            console.log('User already has tenant, skipping trial init');
            setInitializingTrial(false);
          }
        } catch (error) {
          console.error('Error initializing trial:', error);
          setInitializingTrial(false);
        }
      };
      initTrial();
    }
  }, [user, loading]);

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