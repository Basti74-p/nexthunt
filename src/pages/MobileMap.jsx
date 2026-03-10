import React from "react";
import { Map } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export default function MobileMap() {
  return (
    <div className="fixed inset-0 top-14 bottom-20 bg-white flex items-center justify-center z-40">
      <EmptyState
        icon={Map}
        title="Karte"
        description="Die interaktive Revierkartenansicht für Ihr Mobilgerät."
      />
    </div>
  );
}