import React from "react";
import { Globe } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export default function RevierPublic({ revier }) {
  return (
    <EmptyState
      icon={Globe}
      title="Öffentliches Portal"
      description="Hier können öffentlich zugängliche Informationen für Ihr Revier konfiguriert werden. Besucher können Meldungen einreichen und Informationen einsehen."
    />
  );
}