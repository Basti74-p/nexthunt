import React from "react";
import { Map } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export default function MobileMap() {
  return (
    <div className="pt-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Karte</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-[calc(100vh-200px)] flex items-center justify-center">
        <EmptyState
          icon={Map}
          title="Karte"
          description="Die interaktive Revierkartenansicht für Ihr Mobilgerät."
        />
      </div>
    </div>
  );
}