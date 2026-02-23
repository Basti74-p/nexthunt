import React from "react";
import { Globe } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function Oeffentlichkeit() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Öffentlichkeit" subtitle="Öffentliches Portal und externe Kommunikation" />
      <EmptyState icon={Globe} title="Öffentlichkeit" description="Konfigurieren Sie Ihr öffentliches Revier-Portal für externe Besucher." />
    </div>
  );
}