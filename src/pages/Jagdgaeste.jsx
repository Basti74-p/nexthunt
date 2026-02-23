import React from "react";
import { UserCheck } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function Jagdgaeste() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Jagdgäste" subtitle="Jagdkalender – Gäste verwalten" />
      <EmptyState icon={UserCheck} title="Jagdgäste" description="Verwalten Sie eingeladene Jagdgäste und deren Berechtigungen." />
    </div>
  );
}