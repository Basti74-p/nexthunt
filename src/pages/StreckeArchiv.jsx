import React from "react";
import { Archive } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function StreckeArchiv() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Archiv" subtitle="Strecke – Archiv" />
      <EmptyState icon={Archive} title="Archiv" description="Historische Streckendaten und Auswertungen." />
    </div>
  );
}