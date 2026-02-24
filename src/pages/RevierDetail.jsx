import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft, TreePine, Loader2 } from "lucide-react";
import RevierOverview from "@/components/revier/RevierOverview";
import RevierMap from "@/components/revier/RevierMap";
import RevierEinrichtungen from "@/components/revier/RevierEinrichtungen";
import RevierWildmanagement from "@/components/revier/RevierWildmanagement";
import RevierStrecke from "@/components/revier/RevierStrecke";
import RevierWildmarken from "@/components/revier/RevierWildmarken";
import RevierKalender from "@/components/revier/RevierKalender";
import RevierAufgaben from "@/components/revier/RevierAufgaben";
import RevierGesellschaftsjagd from "@/components/revier/RevierGesellschaftsjagd";
import RevierPublic from "@/components/revier/RevierPublic";

export default function RevierDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const revierId = urlParams.get("id");
  const activeTab = urlParams.get("tab") || "overview";

  const setActiveTab = (tab) => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    window.history.pushState({}, "", `?${params.toString()}`);
    // force re-render
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const { data: revier, isLoading } = useQuery({
    queryKey: ["revier", revierId],
    queryFn: async () => {
      const results = await base44.entities.Revier.filter({ id: revierId });
      return results[0];
    },
    enabled: !!revierId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F2F23]" />
      </div>
    );
  }

  if (!revier) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <TreePine className="w-12 h-12 text-gray-300 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Revier nicht gefunden</h2>
        </div>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "overview": return <RevierOverview revier={revier} />;
      case "map": return <RevierMap revier={revier} />;
      case "einrichtungen": return <RevierEinrichtungen revier={revier} />;
      case "wildmanagement": return <RevierWildmanagement revier={revier} />;
      case "strecke": return <RevierStrecke revier={revier} />;
      case "wildmarken": return <RevierWildmarken revier={revier} />;
      case "kalender": return <RevierKalender revier={revier} />;
      case "aufgaben": return <RevierAufgaben revier={revier} />;
      case "gesellschaftsjagd": return <RevierGesellschaftsjagd revier={revier} />;
      case "public": return <RevierPublic revier={revier} />;
      default: return <RevierOverview revier={revier} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to={createPageUrl("Reviere")}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Reviere
        </Link>
        <div className="w-px h-6 bg-gray-600" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-900/40 flex items-center justify-center">
            <TreePine className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100">{revier.name}</h1>
            <p className="text-xs text-gray-500">{revier.region ? `${revier.region} • ` : ""}{revier.size_ha ? `${revier.size_ha} ha` : ""}</p>
          </div>
        </div>
      </div>

      {/* Tabs as sidebar-style vertical nav + content */}
      <div className="flex gap-6">
        <RevierTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 min-w-0">
          {renderTab()}
        </div>
      </div>
    </div>
  );
}