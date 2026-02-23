import React from "react";
import { Archive } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function StreckeWildkammer() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Wildkammer" subtitle="Strecke – Wildkammer" />
      <EmptyState icon={Archive} title="Wildkammer" description="Verwalten Sie das erlegte Wild in der Wildkammer." />
    </div>
  );
}