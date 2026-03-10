import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, ListTodo, Plus, Pencil, Trash2, CheckCircle2,
  Clock, Circle, ArrowLeft, MapPin, Info, ChevronRight, AlertCircle
} from "lucide-react";
import SchadensprotokollDialog from "./SchadensprotokollDialog";
import AufgabeDialog from "./AufgabeDialog";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const CONDITION_COLOR = { gut: "text-green-400", maessig: "text-yellow-400", schlecht: "text-red-400", neu: "text-blue-400" };
const CONDITION_LABEL = { gut: "Gut", maessig: "Mäßig", schlecht: "Schlecht", neu: "Neu" };
const TYPE_LABEL = {
  hochsitz: "Hochsitz", leiter: "Leiter", erdsitz: "Erdsitz", drueckjagdbock: "Drückjagdbock",
  ansitzdrueckjagdleiter: "Ansitzdrückjagdleiter", kirrung: "Kirrung", salzlecke: "Salzlecke",
  suhle: "Suhle", wildacker: "Wildacker", fuetterung: "Fütterung", fanganlage: "Fanganlage",
};
const SCHWERE_COLOR = { gering: "bg-yellow-900 text-yellow-300", mittel: "bg-orange-900 text-orange-300", schwer: "bg-red-900 text-red-300", total: "bg-red-950 text-red-200" };
const STATUS_SCHADEN_COLOR = { offen: "bg-blue-900 text-blue-300", in_bearbeitung: "bg-yellow-900 text-yellow-300", abgeschlossen: "bg-green-900 text-green-300", erfasst: "bg-blue-900 text-blue-300", in_reparatur: "bg-yellow-900 text-yellow-300", behoben: "bg-green-900 text-green-300" };
const STATUS_SCHADEN_LABEL = { offen: "Offen", in_bearbeitung: "In Bearb.", abgeschlossen: "Abgeschl.", erfasst: "Erfasst", in_reparatur: "In Reparatur", behoben: "Behoben" };
const PROTOKOLL_TYP_LABEL = { kontrolle: "Routinekontrolle", jahresinspektion: "Jahresinspektion", schadensmeldung: "Schadensmeldung", reparatur: "Reparaturbericht" };
const ZUSTAND_COLOR = { gut: "text-green-400", maessig: "text-yellow-400", schlecht: "text-red-400", total: "text-red-300" };
const ZUSTAND_LABEL = { gut: "Gut", maessig: "Mäßig", schlecht: "Schlecht", total: "Totalschaden" };
const PRIO_COLOR = { low: "bg-gray-700 text-gray-300", medium: "bg-blue-900 text-blue-300", high: "bg-red-900 text-red-300" };
const PRIO_LABEL = { low: "Niedrig", medium: "Mittel", high: "Hoch" };

export default function EinrichtungDetail({ einrichtung, tenantId, onBack, onEdit }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("info");
  const [schadensDialog, setSchadensDialog] = useState({ open: false, schaden: null });
  const [aufgabeDialog, setAufgabeDialog] = useState({ open: false, aufgabe: null });

  const { data: schaeden = [] } = useQuery({
    queryKey: ["schadensprotokoll", einrichtung.id],
    queryFn: () => base44.entities.Schadensprotokoll.filter({ einrichtung_id: einrichtung.id }),
    enabled: tab === "schaeden",
  });

  const { data: aufgaben = [] } = useQuery({
    queryKey: ["aufgaben_einrichtung", einrichtung.id],
    queryFn: () => base44.entities.Aufgabe.filter({ revier_id: einrichtung.revier_id }),
    enabled: tab === "aufgaben",
  });

  const deleteSchaden = useMutation({
    mutationFn: (id) => base44.entities.Schadensprotokoll.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["schadensprotokoll", einrichtung.id]),
  });

  const deleteAufgabe = useMutation({
    mutationFn: (id) => base44.entities.Aufgabe.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["aufgaben_einrichtung", einrichtung.id]),
  });

  const toggleAufgabe = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Aufgabe.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries(["aufgaben_einrichtung", einrichtung.id]),
  });

  const TABS = [
    { key: "info", label: "Info", icon: Info },
    { key: "schaeden", label: "Protokolle", icon: AlertTriangle },
    { key: "aufgaben", label: "Aufgaben", icon: ListTodo },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-gray-400 hover:text-gray-200 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-100 truncate">{einrichtung.name}</h2>
          <p className="text-xs text-gray-400">{TYPE_LABEL[einrichtung.type] || einrichtung.type}</p>
        </div>
        <Button onClick={onEdit} size="sm" variant="outline" className="border-[#3a3a3a] text-gray-300 hover:text-white shrink-0">
          <Pencil className="w-3.5 h-3.5 mr-1" /> Bearbeiten
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[#1a1a1a] rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === t.key ? "bg-[#22c55e] text-black" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "info" && (
        <div className="space-y-3">
          <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Zustand</span>
              <span className={`text-sm font-medium ${CONDITION_COLOR[einrichtung.condition] || "text-gray-300"}`}>
                {CONDITION_LABEL[einrichtung.condition] || einrichtung.condition}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Typ</span>
              <span className="text-sm text-gray-200">{TYPE_LABEL[einrichtung.type] || einrichtung.type}</span>
            </div>
            {(einrichtung.latitude && einrichtung.longitude) && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Koordinaten</span>
                <span className="text-xs text-gray-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {Number(einrichtung.latitude).toFixed(4)}, {Number(einrichtung.longitude).toFixed(4)}
                </span>
              </div>
            )}
          </div>
          {einrichtung.notes && (
            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Notizen</p>
              <p className="text-sm text-gray-200">{einrichtung.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === "schaeden" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">{schaeden.length} Schaden/Schäden</span>
            <Button size="sm" onClick={() => setSchadensDialog({ open: true, schaden: null })} className="bg-[#22c55e] text-black hover:bg-[#16a34a] h-7 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Schaden erfassen
            </Button>
          </div>
          <div className="space-y-2 overflow-y-auto">
            {schaeden.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">Keine Schäden erfasst</div>
            ) : (
              schaeden.map((s) => (
                <div key={s.id} className="bg-[#1a1a1a] rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium text-gray-100 truncate">{s.titel}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${SCHWERE_COLOR[s.schwere]}`}>{s.schwere}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_SCHADEN_COLOR[s.status]}`}>{STATUS_SCHADEN_LABEL[s.status]}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{s.datum ? format(new Date(s.datum), "dd.MM.yyyy", { locale: de }) : ""}</span>
                        <span>{s.schadensart}</span>
                        {s.kosten_geschaetzt && <span>~{s.kosten_geschaetzt}€</span>}
                      </div>
                      {s.beschreibung && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{s.beschreibung}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setSchadensDialog({ open: true, schaden: s })} className="p-1.5 text-gray-500 hover:text-gray-300 rounded">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteSchaden.mutate(s.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "aufgaben" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">{aufgaben.length} Aufgabe(n)</span>
            <Button size="sm" onClick={() => setAufgabeDialog({ open: true, aufgabe: null })} className="bg-[#22c55e] text-black hover:bg-[#16a34a] h-7 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Aufgabe
            </Button>
          </div>
          <div className="space-y-2 overflow-y-auto">
            {aufgaben.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">Keine Aufgaben vorhanden</div>
            ) : (
              aufgaben.map((a) => (
                <div key={a.id} className="bg-[#1a1a1a] rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleAufgabe.mutate({ id: a.id, status: a.status === "erledigt" ? "offen" : "erledigt" })}
                      className="mt-0.5 shrink-0"
                    >
                      {a.status === "erledigt"
                        ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                        : a.status === "in_bearbeitung"
                        ? <Clock className="w-4 h-4 text-yellow-400" />
                        : <Circle className="w-4 h-4 text-gray-500" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${a.status === "erledigt" ? "line-through text-gray-500" : "text-gray-100"}`}>{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIO_COLOR[a.priority]}`}>{PRIO_LABEL[a.priority]}</span>
                        {a.assigned_to_name && <span className="text-xs text-gray-400">{a.assigned_to_name}</span>}
                        {a.due_date && <span className="text-xs text-gray-500">{format(new Date(a.due_date), "dd.MM.yyyy", { locale: de })}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setAufgabeDialog({ open: true, aufgabe: a })} className="p-1.5 text-gray-500 hover:text-gray-300 rounded">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteAufgabe.mutate(a.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <SchadensprotokollDialog
        isOpen={schadensDialog.open}
        onClose={() => setSchadensDialog({ open: false, schaden: null })}
        schaden={schadensDialog.schaden}
        einrichtung={einrichtung}
        tenantId={tenantId}
      />
      <AufgabeDialog
        isOpen={aufgabeDialog.open}
        onClose={() => setAufgabeDialog({ open: false, aufgabe: null })}
        aufgabe={aufgabeDialog.aufgabe}
        einrichtung={einrichtung}
        tenantId={tenantId}
      />
    </div>
  );
}