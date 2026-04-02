import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Diese Seite wird nach dem Login aufgerufen.
 * Sie generiert einen JWT und übergibt ihn via URL-Fragment an die Mobile-App.
 * 
 * URL: /mobile-token-callback
 * Die Mobile-App öffnet einen WebView auf die Base44 Login-Seite mit dem redirect:
 * ?redirect=/mobile-token-callback
 * 
 * Nach Login: Diese Seite ruft mobileAuth auf und redirectet zu:
 * nexthunt://auth?token=JWT_TOKEN
 */
export default function MobileTokenCallback() {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function getToken() {
      try {
        const response = await base44.functions.invoke("mobileAuth", {});
        const { token, user } = response.data;

        if (!token) {
          setStatus("error");
          setError("Kein Token erhalten");
          return;
        }

        // Redirect zur Mobile-App via Deep Link
        const deepLink = `nexthunt://auth?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.full_name)}&tenant_id=${encodeURIComponent(user.tenant_id)}`;
        
        setStatus("success");
        
        // Kurz anzeigen, dann redirect
        setTimeout(() => {
          window.location.href = deepLink;
        }, 500);

      } catch (err) {
        setStatus("error");
        setError(err.message || "Fehler beim Token abrufen");
      }
    }

    getToken();
  }, []);

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c370741b119950032ab62/7a1f75278_NextHunt_logo_transparent.png"
          alt="NextHunt"
          className="w-24 h-auto mx-auto"
        />

        {status === "loading" && (
          <>
            <div className="w-8 h-8 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400 text-sm">Login wird abgeschlossen...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-[#22c55e] rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-300 text-sm">Erfolgreich! App wird geöffnet...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-gray-500 text-xs">Bitte schließe dieses Fenster und versuche es erneut.</p>
          </>
        )}
      </div>
    </div>
  );
}