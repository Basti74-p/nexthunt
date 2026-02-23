import React from "react";
import { Calendar } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function Jagdkalender() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Jagdmonitor" subtitle="Jagdkalender – Aktive Gesellschaftsjagden" />
      <EmptyState icon={Calendar} title="Jagdmonitor" description="Überwachen Sie laufende Gesellschaftsjagden in Echtzeit." />
    </div>
  );
}