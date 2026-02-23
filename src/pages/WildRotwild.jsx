import React from "react";
import { TreePine } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function WildRotwild() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Rotwild" subtitle="Wildmanagement – Rotwild" />
      <EmptyState icon={TreePine} title="Rotwild" description="Sichtungen, Bestandszahlen und Abschussplanung für Rotwild." />
    </div>
  );
}