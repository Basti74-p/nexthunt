import React from "react";
import { Crosshair } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function StreckeAbschussplan() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Abschussplan" subtitle="Strecke – Abschussplanung" />
      <EmptyState icon={Crosshair} title="Abschussplan" description="Planen und verfolgen Sie den Abschussplan für alle Wildarten." />
    </div>
  );
}