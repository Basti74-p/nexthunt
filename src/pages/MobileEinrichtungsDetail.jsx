import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, AlertTriangle, Image as ImageIcon, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/ui/PageTransition";
import SchadensprotokollDialog from "@/components/jagdeinrichtungen/SchadensprotokollDialog";

const TYPE_LABEL = {
  hochsitz: "Hochsitz", leiter: "Leiter", erdsitz: "Erdsitz", drueckjagdbock: "Drückjagdbock",
  ansitzdrueckjagdleiter: "Ansitzdrückjagdleiter", kirrung: "Kirrung", salzlecke: "Salzlecke",
  suhle: "Suhle", wildacker: "Wildacker", fuetterung: "Fütterung", fanganlage: "Fanganlage"
};

const CONDITION_COLOR = {
  gut: "bg-green-900 text-green-300",
  maessig: "bg-yellow-900 text-yellow-300",
  schlecht: "bg-red-900 text-red-300",
  neu: "bg-blue-900 text-blue-300"
};

const CONDITION_LABEL = { gut: "Gut", maessig: "Mäßig", schlecht: "Schlecht", neu: "Neu" };

export default function MobileEinrichtungsDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  const einrichtungId = searchParams.get("id");
  const [activeTab, setActiveTab] = useState("info");
  const [showSchadensDialog, setShowSchadensDialog] = useState(false);
  const [editingSchaden, setEditingSchaden] = useState(null);

  const { data: einrichtung, isLoading } = useQuery({
    queryKey: ["einrichtung", einrichtungId],
    queryFn: () => base44.entities.Jagdeinrichtung.filter({ id: einrichtungId }),
    enabled: !!einrichtungId,
    select: (data) => data[0]
  });

  const { data: revier } = useQuery({
    queryKey: ["revier", einrichtung?.revier_id],
    queryFn: () => base44.entities.Revier.filter({ id: einrichtung?.revier_id }),
    enabled: !!einrichtung?.revier_id,
    select: (data) => data[0]
  });

  const { data: schadensprotokolle = [] } = useQuery({
    queryKey: ["schadensprotokoll", einrichtung?.id],
    queryFn: () => base44.entities.Schadensprotokoll.filter({ einrichtung_id: einrichtung?.id }),
    enabled: !!einrichtung?.id
  });

  const deleteSchadenMutation = useMutation({
    mutationFn: (id) => base44.entities.Schadensprotokoll.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schadensprotokoll", einrichtung?.id] });
    }
  });

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-400">Laden...</div>);

  }

  if (!einrichtung) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Einrichtung nicht gefunden</p>
      </div>);

  }

  return (
    <PageTransition>
      <div className="pt-16 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 mb-4">
          <button
            onClick={() => navigate("/MobileEinrichtungen")}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center">

            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="text-slate-50 text-lg font-bold">{einrichtung.name}</h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 mb-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "info" ?
            "border-[#0F2F23] text-[#0F2F23]" :
            "border-transparent text-gray-600 hover:text-gray-900"}`
            }>

            Infos
          </button>
          <button
            onClick={() => setActiveTab("schaden")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "schaden" ?
            "border-[#0F2F23] text-[#0F2F23]" :
            "border-transparent text-gray-600 hover:text-gray-900"}`
            }>

            Schadensberichte ({schadensprotokolle.length})
          </button>
        </div>

        {/* INFO TAB */}
        {activeTab === "info" &&
        <>
            {/* Status Badge */}
            <div className="px-4 mb-4">
              <span className={`text-xs px-3 py-1.5 rounded-full ${CONDITION_COLOR[einrichtung.condition]}`}>
                Zustand: {CONDITION_LABEL[einrichtung.condition] || einrichtung.condition}
              </span>
              {einrichtung.condition === "schlecht" &&
            <div className="mt-2 p-3 bg-red-50 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">Wartung erforderlich</p>
                </div>
            }
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 px-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Typ</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{TYPE_LABEL[einrichtung.type] || einrichtung.type}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Revier</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{revier?.name || "–"}</p>
              </div>
              {einrichtung.latitude && einrichtung.longitude &&
            <>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Breite</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{Number(einrichtung.latitude).toFixed(4)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Länge</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{Number(einrichtung.longitude).toFixed(4)}</p>
                  </div>
                </>
            }
              {einrichtung.orientation &&
            <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Ausrichtung</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{einrichtung.orientation.toUpperCase()}</p>
                </div>
            }
            </div>

            {/* Notes */}
            {einrichtung.notes &&
          <div className="px-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <p className="text-xs font-medium text-gray-600">Notizen</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">{einrichtung.notes}</p>
                </div>
              </div>
          }

            {/* Photos */}
            {einrichtung.photos && einrichtung.photos.length > 0 &&
          <div className="px-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className="w-4 h-4 text-gray-600" />
                  <p className="text-xs font-medium text-gray-600">Fotos ({einrichtung.photos.length})</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {einrichtung.photos.map((url, idx) =>
              <img
                key={idx}
                src={url}
                alt={`Foto ${idx + 1}`}
                className="w-full h-24 rounded-lg object-cover bg-gray-200"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23e5e7eb' width='100' height='100'/%3E%3C/svg%3E";
                }} />

              )}
                </div>
              </div>
          }
          </>
        }

        {/* SCHADEN TAB */}
        {activeTab === "schaden" &&
        <div className="px-4 mb-6">
            {schadensprotokolle.length === 0 ?
          <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Keine Schadensberichte vorhanden</p>
              </div> :

          <div className="space-y-2">
                {schadensprotokolle.map((sp) =>
            <div key={sp.id} className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">{sp.titel}</p>
                        <p className="text-xs text-red-700 mt-1">{sp.datum}</p>
                      </div>
                      <button
                  onClick={() => deleteSchadenMutation.mutate(sp.id)}
                  className="text-red-600 hover:text-red-800 text-xs font-medium">

                        Löschen
                      </button>
                    </div>
                    {sp.beschreibung &&
              <p className="text-xs text-red-700 mt-2">{sp.beschreibung}</p>
              }
                  </div>
            )}
              </div>
          }
          </div>
        }

        {/* Action Buttons */}
        <div className="fixed bottom-6 left-4 right-4 space-y-2">
          {activeTab === "schaden" &&
          <Button
            onClick={() => {
              setEditingSchaden(null);
              setShowSchadensDialog(true);
            }}
            className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-lg flex items-center justify-center gap-2">

              <Plus className="w-4 h-4" />
              Protokoll hinzufügen
            </Button>
          }
          <Button
            onClick={() => navigate("/MobileEinrichtungen")}
            className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-lg">

            Zurück zu Einrichtungen
          </Button>
        </div>

        {/* Schaden Dialog */}
        {showSchadensDialog &&
        <SchadensprotokollDialog
          isOpen={showSchadensDialog}
          onClose={() => {
            setShowSchadensDialog(false);
            setEditingSchaden(null);
          }}
          schaden={editingSchaden}
          einrichtung={einrichtung}
          tenantId={tenant?.id}
        />

        }
      </div>
    </PageTransition>);

}