import React from "react";
import { Truck } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function StreckeWildverkauf() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Wildverkauf" subtitle="Strecke – Wildverkauf" />
      <EmptyState icon={Truck} title="Wildverkauf" description="Dokumentieren Sie den Verkauf von erlegtem Wild." />
    </div>
  );
}