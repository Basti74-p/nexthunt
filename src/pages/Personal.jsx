import React from "react";
import { UserCog } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function Personal() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Personal" subtitle="Jagdkalender – Personaleinsatz" />
      <EmptyState icon={UserCog} title="Personal" description="Planen Sie den Personaleinsatz für Jagdveranstaltungen." />
    </div>
  );
}