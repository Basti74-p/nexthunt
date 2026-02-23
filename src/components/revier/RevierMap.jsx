import React from "react";
import { Map } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export default function RevierMap({ revier }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="h-[500px] flex items-center justify-center bg-gray-50">
        <EmptyState
          icon={Map}
          title="Kartenmodul"
          description="Die interaktive Karte mit Reviergrenzen, Einrichtungen und Standorten wird hier angezeigt. GeoJSON-Grenzen können gespeichert und bearbeitet werden."
        />
      </div>
    </div>
  );
}