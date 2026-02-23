import React from "react";
import { Building } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function Jagdeinrichtungen() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Jagdeinrichtungen" subtitle="Hochsitze, Kanzeln, Kirrungen und mehr" />
      <EmptyState icon={Building} title="Jagdeinrichtungen" description="Verwalten Sie alle Jagdeinrichtungen in Ihren Revieren." />
    </div>
  );
}