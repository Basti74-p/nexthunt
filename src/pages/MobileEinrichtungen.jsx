import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building, AlertTriangle, Trash2, MapPin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/ui/PageTransition";
import EinrichtungDialog from "@/components/jagdeinrichtungen/EinrichtungDialog";

const TYPE_LABEL = {
  hochsitz: "Hochsitz", leiter: "Leiter", erdsitz: "Erdsitz", drueckjagdbock: "Drückjagdbock",
  ansitzdrueckjagdleiter: "Ansitzdrückjagdleiter", kirrung: "Kirrung", salzlecke: "Salzlecke",
  suhle: "Suhle", wildacker: "Wildacker", fuetterung: "Fütterung", fanganlage: "Fanganlage",
};

const CONDITION_COLOR = {
  gut: "bg-green-900 text-green-300",
  maessig: "bg-yellow-900 text-yellow-300",
  schlecht: "bg-red-900 text-red-300",
  neu: "bg-blue-900 text-blue-300",
};

const CONDITION_LABEL = { gut: "Gut", maessig: "Mäßig", schlecht: "Schlecht", neu: "Neu" };

export default function MobileEinrichtungen() {
  const navigate = useNavigate();
  const { tenant, tenantMember } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: einrichtungen = [], isLoading } = useQuery({
    queryKey: ["einrichtungen-mobile", tenant?.id],
    queryFn: async () => {
      const allEinrichtungen = await base44.entities.Jagdeinrichtung.filter({ tenant_id: tenant?.id });
      if (tenantMember?.allowed_reviere?.length > 0) {
        return allEinrichtungen.filter(e => tenantMember.allowed_reviere.includes(e.revier_id));
      }
      return allEinrichtungen;
    },
    enabled: !!tenant?.id,
  });

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const deleteEinrichtung = useMutation({
    mutationFn: (id) => base44.entities.Jagdeinrichtung.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["einrichtungen-mobile"] });
    },
  });

  const handlePullToRefresh = async (e) => {
    if (window.scrollY === 0 && !isRefreshing) {
      setIsRefreshing(true);
      await queryClient.invalidateQueries({ queryKey: ["einrichtungen-mobile"] });
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const revierName = (id) => reviere.find((r) => r.id === id)?.name || "–";
  const schlecht = einrichtungen.filter((e) => e.condition === "schlecht").length;
  const maessig = einrichtungen.filter((e) => e.condition === "maessig").length;

  if (!tenant) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Bitte wählen Sie einen Tenant aus.</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="pt-20 pb-24 px-4" onTouchMove={handlePullToRefresh}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-slate-50 text-xl font-bold select-none">Einrichtungen</h2>
          {isRefreshing && <div className="w-4 h-4 rounded-full border-2 border-transparent border-t-[#0F2F23] animate-spin" />}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{einrichtungen.length}</p>
            <p className="text-xs text-gray-500">Gesamt</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-red-600">{schlecht + maessig}</p>
            <p className="text-xs text-red-600">Wartung nötig</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Laden...</div>
        ) : einrichtungen.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-10 h-10 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500 text-sm">Keine Einrichtungen</p>
          </div>
        ) : (
          <div className="space-y-2">
            {einrichtungen.map((e) => (
              <div
                key={e.id}
                className="bg-white rounded-lg border border-gray-100 shadow-sm p-3 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/MobileEinrichtungsDetail?id=${e.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm truncate">{e.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${CONDITION_COLOR[e.condition]}`}>
                      {CONDITION_LABEL[e.condition] || e.condition}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{TYPE_LABEL[e.type] || e.type}</span>
                    <span>·</span>
                    <span>{revierName(e.revier_id)}</span>
                  </div>
                  {e.latitude && e.longitude && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />
                      {Number(e.latitude).toFixed(2)}, {Number(e.longitude).toFixed(2)}
                    </div>
                  )}
                </div>

                {e.condition === "schlecht" && (
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 ml-2" />
                )}

                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={() => setShowCreateDialog(true)}
          className="fixed bottom-24 right-4 w-12 h-12 rounded-full bg-[#22c55e] hover:bg-[#16a34a] text-black shadow-lg flex items-center justify-center"
        >
          <Plus className="w-5 h-5" />
        </Button>

        {showCreateDialog && (
          <EinrichtungDialog
            onClose={() => setShowCreateDialog(false)}
            onSuccess={() => {
              setShowCreateDialog(false);
              queryClient.invalidateQueries({ queryKey: ["einrichtungen-mobile"] });
            }}
          />
        )}
      </div>
    </PageTransition>
  );
}