import React from "react";
import { TreePine } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function WildRehwild() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Rehwild" subtitle="Wildmanagement – Rehwild" />
      <EmptyState icon={TreePine} title="Rehwild" description="Sichtungen, Bestandszahlen und Abschussplanung für Rehwild." />
    </div>
  );
}