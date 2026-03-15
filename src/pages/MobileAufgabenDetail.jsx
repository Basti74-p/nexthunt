import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AlertTriangle, User, Clock, Flag, Download } from "lucide-react";
import MobileTopBar from "@/components/navigation/MobileTopBar";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import jsPDF from "jspdf";

const PRIO_COLOR = { low: "bg-blue-900/40 text-blue-300", medium: "bg-yellow-900/40 text-yellow-300", high: "bg-red-900/40 text-red-300" };
const PRIO_LABEL = { low: "Niedrig", medium: "Mittel", high: "Hoch" };
const STATUS_LABEL = { offen: "Offen", in_bearbeitung: "In Bearbeitung", erledigt: "Erledigt" };
const STATUS_COLOR = { offen: "text-blue-600", in_bearbeitung: "text-yellow-600", erledigt: "text-green-600" };

export default function MobileAufgabenDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [exporting, setExporting] = useState(false);
  const aufgabeId = searchParams.get("id");

  const { data: aufgabe, isLoading } = useQuery({
    queryKey: ["mobile-aufgabe-detail", aufgabeId],
    queryFn: async () => {
      const result = await base44.entities.Aufgabe.filter({ id: aufgabeId });
      return result[0];
    },
    enabled: !!aufgabeId,
  });

  const { data: einrichtung } = useQuery({
    queryKey: ["mobile-aufgabe-einrichtung", aufgabe?.einrichtung_id],
    queryFn: () => base44.entities.Jagdeinrichtung.filter({ id: aufgabe.einrichtung_id }),
    enabled: !!aufgabe?.einrichtung_id,
    select: (data) => data[0],
  });

  const handlePDFExport = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 15;

      doc.setFillColor(34, 197, 94);
      doc.rect(0, 0, pageWidth, 25, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont(undefined, "bold");
      doc.text("ARBEITSAUFTRAG", 10, 18);

      doc.setTextColor(50, 50, 50);
      yPos = 35;

      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text(aufgabe.title, 10, yPos);
      yPos += 10;

      doc.setFillColor(240, 240, 240);
      doc.rect(10, yPos - 2, pageWidth - 20, 16, "F");
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.setTextColor(100, 100, 100);
      
      const statusColor = aufgabe.status === "offen" ? [59, 130, 246] : aufgabe.status === "in_bearbeitung" ? [251, 191, 36] : [34, 197, 94];
      doc.setTextColor(...statusColor);
      doc.text(`Status: ${STATUS_LABEL[aufgabe.status]}`, 10, yPos + 5);
      
      const prioColor = aufgabe.priority === "high" ? [239, 68, 68] : aufgabe.priority === "medium" ? [251, 146, 60] : [59, 130, 246];
      doc.setTextColor(...prioColor);
      doc.text(`Priorität: ${PRIO_LABEL[aufgabe.priority]}`, 80, yPos + 5);
      
      doc.setTextColor(50, 50, 50);
      yPos += 22;

      if (aufgabe.description) {
        doc.setFontSize(10);
        doc.setFont(undefined, "bold");
        doc.text("Beschreibung", 10, yPos);
        yPos += 5;
        doc.setFontSize(9);
        doc.setFont(undefined, "normal");
        const splitDesc = doc.splitTextToSize(aufgabe.description, pageWidth - 20);
        doc.text(splitDesc, 10, yPos);
        yPos += splitDesc.length * 4 + 6;
      }

      doc.setFillColor(245, 245, 245);
      doc.rect(10, yPos - 2, pageWidth - 20, 1, "F");
      yPos += 3;

      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Details", 10, yPos);
      yPos += 7;

      const detailsData = [];
      if (aufgabe.due_date) detailsData.push([`Fällig:`, format(new Date(aufgabe.due_date), "dd. MMMM yyyy", { locale: de })]);
      if (aufgabe.assigned_to_name) detailsData.push([`Zugewiesen:`, aufgabe.assigned_to_name]);
      if (aufgabe.einrichtung_name) detailsData.push([`Einrichtung:`, aufgabe.einrichtung_name]);

      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      detailsData.forEach(([label, value]) => {
        doc.setFont(undefined, "bold");
        doc.text(label, 10, yPos);
        doc.setFont(undefined, "normal");
        doc.text(value, 50, yPos);
        yPos += 5;
      });

      doc.save(`Arbeitsauftrag_${aufgabe.id}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22c55e]"></div>
      </div>
    );
  }

  if (!aufgabe) {
    return (
      <div className="p-4 text-center text-gray-500">
        Aufgabe nicht gefunden
      </div>
    );
  }

  return (
    <div className="bg-[#1e1e1e] min-h-screen pb-20">
      <MobileTopBar
        title={aufgabe.title}
        showBackButton={true}
        onBack={() => navigate("/MobileTasks")}
      />
      <button
        onClick={handlePDFExport}
        disabled={exporting}
        className="fixed top-3 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-xl bg-[#2d2d2d] text-gray-300 hover:bg-[#3a3a3a]"
      >
        <Download className="w-4 h-4" />
      </button>

      {/* Content */}
      <div className="space-y-3 p-4 pt-20">
        {/* Status & Priority */}
        <div className="bg-[#2d2d2d] rounded-lg p-4 space-y-3 border border-[#3a3a3a]">
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Status</div>
              <p className={`font-medium ${STATUS_COLOR[aufgabe.status]}`}>
                {STATUS_LABEL[aufgabe.status]}
              </p>
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Priorität</div>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${PRIO_COLOR[aufgabe.priority]}`}>
                {PRIO_LABEL[aufgabe.priority]}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {aufgabe.description && (
          <div className="bg-[#2d2d2d] rounded-lg p-4 border border-[#3a3a3a]">
            <h2 className="font-semibold text-gray-100 mb-2 text-sm">Beschreibung</h2>
            <p className="text-gray-400 text-sm leading-relaxed">{aufgabe.description}</p>
          </div>
        )}

        {/* Details */}
        <div className="bg-[#2d2d2d] rounded-lg p-4 border border-[#3a3a3a] space-y-3">
          <h2 className="font-semibold text-gray-100 text-sm">Auftragsdetails</h2>
          
          {aufgabe.due_date && (
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Fällig am</p>
                <p className="text-sm font-medium text-gray-100">
                  {format(new Date(aufgabe.due_date), "dd. MMMM yyyy", { locale: de })}
                </p>
              </div>
            </div>
          )}

          {aufgabe.assigned_to_name && (
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Zugewiesen an</p>
                <p className="text-sm font-medium text-gray-100">{aufgabe.assigned_to_name}</p>
              </div>
            </div>
          )}

          {aufgabe.einrichtung_name && (
            <div className="flex items-start gap-3">
              <Flag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Jagdeinrichtung</p>
                <p className="text-sm font-medium text-gray-100">{aufgabe.einrichtung_name}</p>
                {einrichtung?.condition && (
                  <p className="text-xs text-gray-500 mt-1">
                    Zustand: <span className="capitalize">{einrichtung.condition}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Schadensprotokolle */}
        {aufgabe.schadensprotokolle_ids?.length > 0 && (
          <div className="bg-[#2d2d2d] rounded-lg p-4 border border-[#3a3a3a]">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <h2 className="font-semibold text-gray-100 text-sm">
                Angehängte Schadensprotokolle
              </h2>
            </div>
            <div className="text-xs text-gray-400 bg-orange-900/20 rounded p-2">
              {aufgabe.schadensprotokolle_ids.length} Protokoll(e) angehängt
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="bg-[#2d2d2d] rounded-lg p-3 text-xs text-gray-500 space-y-1 border border-[#3a3a3a]">
          <p>ID: {aufgabe.id}</p>
          <p>Erstellt: {format(new Date(aufgabe.created_date), "dd.MM.yyyy HH:mm", { locale: de })}</p>
        </div>
      </div>
    </div>
  );
}