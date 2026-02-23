import React from "react";
import { Layers } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function Abteilungen() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Abteilungen" subtitle="Reviereinteilung in Abteilungen" />
      <EmptyState icon={Layers} title="Abteilungen" description="Teilen Sie Ihr Revier in Abteilungen und Parzellen auf." />
    </div>
  );
}