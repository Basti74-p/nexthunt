import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import { AlertTriangle, Plus, BarChart2, MapPin, List, Shield, Crosshair } from "lucide-react";
import SchwarzwildRottenTab from "@/components/schwarzwild/SchwarzwildRottenTab";
import SchwarzwildSichtungenTab from "@/components/schwarzwild/SchwarzwildSichtungenTab";
import SchwarzwildSchadenTab from "@/components/schwarzwild/SchwarzwildSchadenTab";
import SchwarzwildTrichineTab from "@/components/schwarzwild/SchwarzwildTrichineTab";
import SchwarzwildASPTab from "@/components/schwarzwild/SchwarzwildASPTab";
import SchwarzwildStatistik from "@/components/schwarzwild/SchwarzwildStatistik";

const TABS = [
  { id: "rotten", label: "Rotten", icon: List },
  { id: "sichtungen", label: "Sichtungen", icon: MapPin },
  { id: "schaeden", label: "Schäden", icon: AlertTriangle },
  { id: "trichinen", label: "Trichinen", icon: Shield },
  { id: "asp", label: "ASP", icon: Crosshair },
  { id: "statistik", label: "Statistik", icon: BarChart2 },
];

export default function WildSchwarzwild() {
  const { tenant } = useAuth();
  const [activeTab, setActiveTab] = useState("rotten");
  const [showSichtungForm, setShowSichtungForm] = useState(false);
  const [showSchadenForm, setShowSchadenForm] = useState(false);
  const [showASPForm, setShowASPForm] = useState(false);

  const isPro = ["pro", "enterprise"].includes(tenant?.plan);

  const { data: rotten = [] } = useQuery({
    queryKey: ["schwarzwild_rotten", tenant?.id],
    queryFn: () => base44.entities.SchwarzwildRotte.filter({ tenant_id: tenant.id }),
    enabled: !!tenant?.id,
  });

  const { data: schaeden = [] } = useQuery({
    queryKey: ["schwarzwild_schaeden", tenant?.id],
    queryFn: () => base44.entities.SchwarzwildSchaden.filter({ tenant_id: tenant.id }),
    enabled: !!tenant?.id,
  });

  const { data: aspMeldungen = [] } = useQuery({
    queryKey: ["asp_meldungen", tenant?.id],
    queryFn: () => base44.entities.ASPMeldung.filter({ tenant_id: tenant.id }),
    enabled: !!tenant?.id,
  });

  const { data: strecke = [] } = useQuery({
    queryKey: ["strecke_schwarzwild", tenant?.id],
    queryFn: () => base44.entities.Strecke.filter({ tenant_id: tenant.id, species: "schwarzwild" }),
    enabled: !!tenant?.id,
  });

  const aktiveRotten = rotten.filter(r => r.status === "aktiv").length;
  const offeneSchaeden = schaeden.filter(s => ["offen", "gemeldet"].includes(s.status)).length;
  const offeneASP = aspMeldungen.filter(a => a.status !== "abgeschlossen").length;

  const kpis = [
    { label: "Aktive Rotten", value: aktiveRotten, color: "#22c55e" },
    { label: "Strecke Jagdjahr", value: strecke.length, color: "#c8a84b" },
    { label: "Offene Schäden", value: offeneSchaeden, color: "#f97316" },
    { label: "ASP-Meldungen", value: offeneASP, color: offeneASP > 0 ? "#ef4444" : "#6b7280" },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-100">🐗 Schwarzwild</h1>
        <p className="text-sm text-gray-500 mt-0.5">Rotten · Sichtungen · Schäden · ASP</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => { setShowSichtungForm(true); setActiveTab("sichtungen"); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] text-black font-semibold rounded-xl text-sm hover:bg-[#16a34a] transition-colors"
        >
          <Plus className="w-4 h-4" /> Sichtung erfassen
        </button>
        {isPro ? (
          <button
            onClick={() => { setShowSchadenForm(true); setActiveTab("schaeden"); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-semibold rounded-xl text-sm hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Schaden melden
          </button>
        ) : (
          <span className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-gray-600 font-semibold rounded-xl text-sm border border-[#2a2a2a] cursor-not-allowed">
            🔒 Schaden melden — Ab PRO
          </span>
        )}
        {isPro ? (
          <button
            onClick={() => { setShowASPForm(true); setActiveTab("asp"); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white font-semibold rounded-xl text-sm hover:bg-red-800 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> ASP-Verdacht melden
          </button>
        ) : (
          <span className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-gray-600 font-semibold rounded-xl text-sm border border-[#2a2a2a] cursor-not-allowed">
            🔒 ASP-Monitoring — Ab PRO
          </span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#111] rounded-xl p-1 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const locked = !isPro && ["schaeden", "asp", "statistik"].includes(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => !locked && setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[#22c55e] text-black"
                  : locked
                  ? "text-gray-600 cursor-not-allowed"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {locked && " 🔒"}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "rotten" && <SchwarzwildRottenTab tenant={tenant} isPro={isPro} />}
      {activeTab === "sichtungen" && <SchwarzwildSichtungenTab tenant={tenant} openForm={showSichtungForm} onFormClose={() => setShowSichtungForm(false)} />}
      {activeTab === "schaeden" && isPro && <SchwarzwildSchadenTab tenant={tenant} openForm={showSchadenForm} onFormClose={() => setShowSchadenForm(false)} />}
      {activeTab === "trichinen" && <SchwarzwildTrichineTab tenant={tenant} isPro={isPro} />}
      {activeTab === "asp" && isPro && <SchwarzwildASPTab tenant={tenant} openForm={showASPForm} onFormClose={() => setShowASPForm(false)} />}
      {activeTab === "statistik" && isPro && <SchwarzwildStatistik tenant={tenant} />}
    </div>
  );
}