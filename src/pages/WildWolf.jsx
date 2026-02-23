import React from "react";
import { TreePine } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function WildWolf() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Wolf" subtitle="Wildmanagement – Wolf" />
      <EmptyState icon={TreePine} title="Wolf" description="Wolfssichtungen und Bestandsdaten erfassen." />
    </div>
  );
}