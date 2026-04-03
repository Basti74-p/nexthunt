import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Map, Crosshair, ListTodo, Users, Calendar, TreePine, ArrowRight, Pencil, AlertTriangle, X, TrendingUp } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TrialExpiredModal from "@/components/TrialExpiredModal";

export default function Dashboard() {
  const { user, tenant, tenantFeatures } = useAuth();
  const { t } = useI18n();
  const [showBoundaryHelp, setShowBoundaryHelp] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(null);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [capacityBannerDismissed, setCapacityBannerDismissed] = useState(() => {
    try {
      const d = localStorage.getItem("nh_capacity_banner_dismissed");
      if (!d) return false;
      return new Date(d).toDateString() === new Date().toDateString();
    } catch { return false; }
  });

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: aufgaben = [] } = useQuery({
    queryKey: ["aufgaben-dashboard", tenant?.id],
    queryFn: () => base44.entities.Aufgabe.filter({ tenant_id: tenant?.id, status: "offen" }),
    enabled: !!tenant?.id,
  });

  const { data: strecken = [] } = useQuery({
    queryKey: ["strecken-dashboard", tenant?.id],
    queryFn: () => base44.entities.Strecke.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id && tenantFeatures.feature_strecke,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events-dashboard", tenant?.id],
    queryFn: () => base44.entities.JagdEvent.filter({ tenant_id: tenant?.id, status: "planned" }),
    enabled: !!tenant?.id && tenantFeatures.feature_driven_hunt,
  });

  // Check trial status on mount and when tenant changes
  useEffect(() => {
    if (tenant?.status === 'trial') {
      const checkTrial = async () => {
        try {
          const result = await base44.functions.invoke('checkTrialStatus', {});
          if (result.data.status === 'expired') {
            setTrialDaysRemaining(0);
            setShowTrialModal(true);
          } else if (result.data.days_remaining !== undefined) {
            setTrialDaysRemaining(result.data.days_remaining);
            setShowTrialModal(true);
          }
        } catch (error) {
          console.error('Error checking trial:', error);
        }
      };
      checkTrial();
    }
  }, [tenant?.id, tenant?.status]);

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <TreePine className="w-12 h-12 text-gray-300 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">{t("willkommen_nexthunt")}</h2>
          <p className="text-sm text-gray-500">{t("noch_kein_mandant")}</p>
        </div>
      </div>
    );
  }

  // Capacity calculations
  const gesamtflaeche = tenant?.gesamtflaeche_ha || 0;
  const maxFlaeche = tenant?.max_flaeche_ha;
  const capacityPct = maxFlaeche ? (gesamtflaeche / maxFlaeche) * 100 : 0;
  const isNearLimit = maxFlaeche && gesamtflaeche >= maxFlaeche * 0.8;
  const isOverLimit = maxFlaeche && gesamtflaeche > maxFlaeche;
  const gracePeriodActive = tenant?.grace_period_until && new Date(tenant.grace_period_until) > new Date();
  const graceDaysLeft = gracePeriodActive
    ? Math.ceil((new Date(tenant.grace_period_until) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const dismissCapacityBanner = () => {
    setCapacityBannerDismissed(true);
    try { localStorage.setItem("nh_capacity_banner_dismissed", new Date().toISOString()); } catch {}
  };

  const stats = [
    { label: t("stat_reviere"), value: reviere.length, icon: Map, color: "bg-emerald-50 text-emerald-600" },
    { label: t("stat_offene_aufgaben"), value: aufgaben.length, icon: ListTodo, color: "bg-amber-50 text-amber-600" },
    { label: t("stat_strecke"), value: strecken.length, icon: Crosshair, color: "bg-blue-50 text-blue-600" },
    { label: t("stat_geplante_jagden"), value: events.length, icon: Calendar, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {showTrialModal && trialDaysRemaining !== null && (
        <TrialExpiredModal 
          daysRemaining={trialDaysRemaining} 
          onClose={() => setShowTrialModal(false)}
        />
      )}
      
      <PageHeader
        title={`${t("welcome")}, ${user?.full_name?.split(" ")[0] || t("jaeger")}`}
        subtitle={tenant.name}
      />

      {/* Trial Banner */}
      {tenant?.status === 'trial' && trialDaysRemaining !== null && trialDaysRemaining > 0 && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30">
          <div className="w-2 h-2 rounded-full bg-[#22c55e] flex-shrink-0" />
          <p className="text-sm text-[#22c55e] font-medium flex-1">
            {t("testphase_aktiv")} <strong>{trialDaysRemaining} {trialDaysRemaining === 1 ? t("tag") : t("tage")}</strong> {t("kostenloser_zugriff")}
          </p>
          <a href="#" className="text-xs text-[#22c55e] underline font-semibold whitespace-nowrap">{t("lizenz_kaufen")}</a>
        </div>
      )}
      {tenant?.status === 'trial' && trialDaysRemaining !== null && trialDaysRemaining <= 0 && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <p className="text-sm text-red-400 font-medium flex-1">{t("testphase_abgelaufen")}</p>
          <a href="#" className="text-xs text-red-400 underline font-semibold whitespace-nowrap">{t("lizenz_kaufen")}</a>
        </div>
      )}

      {/* Grace Period / Over Limit Banner (red) */}
      {(isOverLimit || gracePeriodActive) && (
        <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300 flex-1">
            {gracePeriodActive
              ? `Deine bewirtschaftete Fläche überschreitet dein Paketlimit. Du hast noch ${graceDaysLeft} Tage um dein Paket zu upgraden bevor Funktionen eingeschränkt werden.`
              : "Deine bewirtschaftete Fläche überschreitet dein Paketlimit. Bitte upgrade dein Paket."}
          </p>
          <Link to="/PaketePreise" className="text-xs text-red-400 hover:underline font-semibold shrink-0 whitespace-nowrap">Jetzt upgraden →</Link>
        </div>
      )}

      {/* Near Limit Banner (yellow, dismissable) */}
      {isNearLimit && !isOverLimit && !capacityBannerDismissed && (
        <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <TrendingUp className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300 flex-1">
            Du nutzt bereits <strong>{gesamtflaeche.toFixed(1)} ha</strong> von <strong>{maxFlaeche?.toLocaleString("de-DE")} ha</strong> — bald wird ein Upgrade nötig.{" "}
            <Link to="/PaketePreise" className="underline font-semibold">Jetzt Pakete ansehen →</Link>
          </p>
          <button onClick={dismissCapacityBanner} className="text-amber-400 hover:text-amber-200 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#3a3a3a] rounded-2xl p-5 border border-[#4a4a4a] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.replace('bg-', 'bg-').replace('50', '900/20').replace('text-', 'text-')}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-100">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}

        {/* Bewirtschaftete Fläche Card */}
        {maxFlaeche && (
          <div className="bg-[#3a3a3a] rounded-2xl p-5 border border-[#4a4a4a] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-900/20">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-xs font-medium" style={{ color: capacityPct >= 100 ? "#ef4444" : capacityPct >= 80 ? "#f59e0b" : "#22c55e" }}>
                {Math.round(capacityPct)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-100">{gesamtflaeche.toFixed(0)} ha</p>
            <p className="text-xs text-gray-400 mt-1">von {maxFlaeche.toLocaleString("de-DE")} ha</p>
            <div className="mt-2 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(capacityPct, 100)}%`,
                  backgroundColor: capacityPct >= 100 ? "#ef4444" : capacityPct >= 80 ? "#f59e0b" : "#22c55e"
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Reviere Quick Access */}
       <div className="bg-[#3a3a3a] rounded-2xl border border-[#4a4a4a] shadow-sm p-6 mb-6">
         <div className="flex items-center justify-between mb-4">
           <h2 className="text-lg font-semibold text-gray-100">{t("ihre_reviere")}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBoundaryHelp(true)}
                className="text-sm text-[#22c55e] font-medium flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-[#4a4a4a] border border-[#4a4a4a] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                {t("grenzen_einzeichnen")}
              </button>
              <Link
                to={createPageUrl("Reviere")}
                className="text-sm text-[#22c55e] font-medium flex items-center gap-1 hover:underline"
              >
                {t("alle_anzeigen")} <ArrowRight className="w-4 h-4" />
              </Link>
           </div>
         </div>
        {reviere.length === 0 ? (
          <p className="text-sm text-gray-400">{t("keine_reviere")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reviere.slice(0, 6).map((r) => (
              <Link
                key={r.id}
                to={createPageUrl(`RevierDetail?id=${r.id}`)}
                className="flex items-center gap-3 p-4 rounded-xl border border-[#4a4a4a] hover:border-[#22c55e]/30 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-900/20 flex items-center justify-center">
                  <TreePine className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-100 truncate group-hover:text-[#22c55e]">{r.name}</p>
                  <p className="text-xs text-gray-400">
                    {r.flaeche_ha ? `${r.flaeche_ha.toFixed(1)} ha` : r.boundary_geojson ? `${r.size_ha || 0} ha` : "Fläche nicht berechnet"}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-[#22c55e] transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Open Tasks */}
       {aufgaben.length > 0 && (
         <div className="bg-[#3a3a3a] rounded-2xl border border-[#4a4a4a] shadow-sm p-6">
           <h2 className="text-lg font-semibold text-gray-100 mb-4">{t("offene_aufgaben")}</h2>
           <div className="space-y-2">
             {aufgaben.slice(0, 5).map((a) => (
               <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#2a2a2a]">
                 <div className="w-2 h-2 rounded-full bg-amber-400" />
                 <span className="text-sm text-gray-100 flex-1">{a.title}</span>
                 {a.due_date && <span className="text-xs text-gray-400">{a.due_date}</span>}
               </div>
             ))}
           </div>
         </div>
       )}

       {/* Boundary Drawing Help Dialog */}
       <Dialog open={showBoundaryHelp} onOpenChange={setShowBoundaryHelp}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>{t("reviergrenzen_einzeichnen")}</DialogTitle>
             </DialogHeader>
             <div className="space-y-3 text-sm text-gray-600">
             <p>{t("boundary_help_text")}</p>
             <p>{t("so_funktioniert")}</p>
             <ol className="list-decimal list-inside space-y-2 ml-2">
               <li>{t("boundary_step1")}</li>
               <li>{t("boundary_step2")}</li>
               <li>{t("boundary_step3")}</li>
               <li>{t("boundary_step4")}</li>
               <li>{t("boundary_step5")}</li>
               <li>{t("boundary_step6")}</li>
             </ol>
             <div className="pt-2">
               <Link
                 to={createPageUrl("Karte")}
                 className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F2F23] text-white text-sm font-medium hover:opacity-90 transition-opacity"
               >
                 <Map className="w-4 h-4" />
                 {t("zur_karte")}
               </Link>
             </div>
           </div>
         </DialogContent>
       </Dialog>
      </div>
      );
      }