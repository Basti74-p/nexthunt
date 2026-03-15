import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Map, Crosshair, ListTodo, Users, Calendar, TreePine, ArrowRight, Pencil } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TrialExpiredModal from "@/components/TrialExpiredModal";

export default function Dashboard() {
  const { user, tenant, tenantFeatures } = useAuth();
  const [showBoundaryHelp, setShowBoundaryHelp] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(null);
  const [showTrialModal, setShowTrialModal] = useState(false);

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
          <h2 className="text-xl font-bold text-gray-900">Willkommen bei NextHunt</h2>
          <p className="text-sm text-gray-500">Sie sind noch keinem Mandanten zugewiesen.</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Reviere", value: reviere.length, icon: Map, color: "bg-emerald-50 text-emerald-600" },
    { label: "Offene Aufgaben", value: aufgaben.length, icon: ListTodo, color: "bg-amber-50 text-amber-600" },
    { label: "Strecke (gesamt)", value: strecken.length, icon: Crosshair, color: "bg-blue-50 text-blue-600" },
    { label: "Geplante Jagden", value: events.length, icon: Calendar, color: "bg-purple-50 text-purple-600" },
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
        title={`Willkommen, ${user?.full_name?.split(" ")[0] || "Jäger"}`}
        subtitle={tenant.name}
      />

      {/* Trial Banner */}
      {tenant?.status === 'trial' && trialDaysRemaining !== null && trialDaysRemaining > 0 && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30">
          <div className="w-2 h-2 rounded-full bg-[#22c55e] flex-shrink-0" />
          <p className="text-sm text-[#22c55e] font-medium flex-1">
            Testphase aktiv – noch <strong>{trialDaysRemaining} {trialDaysRemaining === 1 ? 'Tag' : 'Tage'}</strong> kostenloser Zugriff
          </p>
          <a href="#" className="text-xs text-[#22c55e] underline font-semibold whitespace-nowrap">Lizenz kaufen</a>
        </div>
      )}
      {tenant?.status === 'trial' && trialDaysRemaining !== null && trialDaysRemaining <= 0 && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <p className="text-sm text-red-400 font-medium flex-1">Testphase abgelaufen – bitte Lizenz erwerben.</p>
          <a href="#" className="text-xs text-red-400 underline font-semibold whitespace-nowrap">Lizenz kaufen</a>
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
      </div>

      {/* Reviere Quick Access */}
       <div className="bg-[#3a3a3a] rounded-2xl border border-[#4a4a4a] shadow-sm p-6 mb-6">
         <div className="flex items-center justify-between mb-4">
           <h2 className="text-lg font-semibold text-gray-100">Ihre Reviere</h2>
           <div className="flex items-center gap-2">
             <button
               onClick={() => setShowBoundaryHelp(true)}
               className="text-sm text-[#22c55e] font-medium flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-[#4a4a4a] border border-[#4a4a4a] transition-colors"
             >
               <Pencil className="w-3.5 h-3.5" />
               Grenzen einzeichnen
             </button>
             <Link
               to={createPageUrl("Reviere")}
               className="text-sm text-[#22c55e] font-medium flex items-center gap-1 hover:underline"
             >
               Alle anzeigen <ArrowRight className="w-4 h-4" />
             </Link>
           </div>
         </div>
        {reviere.length === 0 ? (
          <p className="text-sm text-gray-500">Noch keine Reviere angelegt.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reviere.slice(0, 6).map((r) => (
              <Link
                key={r.id}
                to={createPageUrl(`RevierDetail?id=${r.id}`)}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-[#0F2F23]/20 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TreePine className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#0F2F23]">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.size_ha ? `${r.size_ha} ha` : r.region || "—"}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0F2F23] transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Open Tasks */}
       {aufgaben.length > 0 && (
         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
           <h2 className="text-lg font-semibold text-gray-900 mb-4">Offene Aufgaben</h2>
           <div className="space-y-2">
             {aufgaben.slice(0, 5).map((a) => (
               <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                 <div className="w-2 h-2 rounded-full bg-amber-400" />
                 <span className="text-sm text-gray-700 flex-1">{a.title}</span>
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
             <DialogTitle>Reviergrenzen einzeichnen</DialogTitle>
           </DialogHeader>
           <div className="space-y-3 text-sm text-gray-600">
             <p>Um Reviergrenzen einzuzeichnen, gehen Sie zur <strong>Karte</strong> und nutzen Sie den Button "Reviergrenze einzeichnen".</p>
             <p>So funktioniert es:</p>
             <ol className="list-decimal list-inside space-y-2 ml-2">
               <li>Klicken Sie auf den Button "Reviergrenze einzeichnen"</li>
               <li>Klicken Sie auf die Karte, um Punkte zu setzen</li>
               <li>Setzen Sie mindestens 3 Punkte</li>
               <li>Klicken Sie "Fertig", um die Grenze zu speichern</li>
               <li>Wählen Sie ein Revier und eine Farbe</li>
               <li>Klicken Sie "Speichern"</li>
             </ol>
             <div className="pt-2">
               <Link
                 to={createPageUrl("Karte")}
                 className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F2F23] text-white text-sm font-medium hover:opacity-90 transition-opacity"
               >
                 <Map className="w-4 h-4" />
                 Zur Karte
               </Link>
             </div>
           </div>
         </DialogContent>
       </Dialog>
      </div>
      );
      }