import React from "react";
import { TreePine } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function WildSchwarzwild() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Schwarzwild" subtitle="Wildmanagement – Schwarzwild" />
      <EmptyState icon={TreePine} title="Schwarzwild" description="Sichtungen, Bestandszahlen und Abschussplanung für Schwarzwild." />
    </div>
  );
}