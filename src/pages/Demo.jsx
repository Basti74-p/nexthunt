import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Map, Crosshair, ListTodo, Calendar, TreePine, ArrowRight,
  Eye, Archive, Users, LayoutDashboard, Shield, CheckCircle2,
  Target, Building, ChevronRight
} from "lucide-react";

const DEMO_REVIERE = [
  { id: 1, name: "Revier Mühlbach", region: "Thüringen", size_ha: 1240 },
  { id: 2, name: "Waldrevier Nord", region: "Kyffhäuser", size_ha: 870 },
  { id: 3, name: "Feldrevier Süd", region: "Thüringen", size_ha: 520 },
];

const DEMO_AUFGABEN = [
  { title: "Hochsitz 4 reparieren", due: "2026-03-15" },
  { title: "Wildkamera Batterie wechseln", due: "2026-03-18" },
  { title: "Kirrung Waldrevier auffüllen", due: "2026-03-20" },
];

const DEMO_STRECKE = [
  { species: "Rehwild", gender: "männlich", date: "2026-03-01", revier: "Revier Mühlbach" },
  { species: "Schwarzwild", gender: "weiblich", date: "2026-03-03", revier: "Waldrevier Nord" },
  { species: "Rotwild", gender: "männlich", date: "2026-03-07", revier: "Feldrevier Süd" },
];

const FEATURES = [
  { icon: Map, label: "Interaktive Karte", desc: "Reviere, Einrichtungen und Sichtungen auf der Karte verwalten" },
  { icon: Crosshair, label: "Streckenerfassung", desc: "Abschüsse digital dokumentieren mit Wildkammer-Integration" },
  { icon: Calendar, label: "Jagdkalender", desc: "Gesellschaftsjagden planen und Live-Monitor für aktive Jagden" },
  { icon: ListTodo, label: "Aufgaben", desc: "Aufgaben zuweisen, priorisieren und verfolgen" },
  { icon: Building, label: "Jagdeinrichtungen", desc: "Hochsitze, Kirrungen und mehr mit Fotos und Zustand verwalten" },
  { icon: Archive, label: "Wildkammer", desc: "Verarbeitungsprozess, Lager und Verkauf digital abwickeln" },
  { icon: Users, label: "Personen & Rechte", desc: "Mitglieder verwalten und Berechtigungen pro Modul vergeben" },
  { icon: Shield, label: "Multi-Mandant", desc: "Mehrere Reviergemeinschaften in einer Plattform" },
];

export default function Demo() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-gray-100">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-[#2d2d2d] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c370741b119950032ab62/7a1f75278_NextHunt_logo_transparent.png"
            alt="NextHunt"
            className="h-8 object-contain"
          />
          <span className="text-xs bg-[#22c55e]/20 text-[#22c55e] px-2 py-0.5 rounded-full font-medium">Demo</span>
        </div>
        <a
          href="mailto:info@nexthunt.de"
          className="bg-[#22c55e] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#16a34a] transition-colors"
        >
          Jetzt starten
        </a>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-100 mb-3">
            Digitales Jagdrevier-Management
          </h1>
          <p className="text-gray-400 text-base max-w-xl mx-auto">
            Erleben Sie NextHunt im Demo-Modus. Alle Daten sind Beispieldaten.
          </p>
        </div>

        {/* Demo Tabs */}
        <div className="flex gap-2 mb-6 bg-[#2d2d2d] p-1 rounded-xl w-fit mx-auto">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "strecke", label: "Strecke", icon: Crosshair },
            { id: "aufgaben", label: "Aufgaben", icon: ListTodo },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-[#22c55e] text-black"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-[#262626] rounded-2xl border border-[#3a3a3a] p-6 mb-8">
          {activeTab === "dashboard" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Willkommen, Demo-Jäger</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Reviere", value: 3, icon: Map, color: "text-emerald-400" },
                  { label: "Offene Aufgaben", value: 3, icon: ListTodo, color: "text-amber-400" },
                  { label: "Strecke gesamt", value: 47, icon: Crosshair, color: "text-blue-400" },
                  { label: "Geplante Jagden", value: 2, icon: Calendar, color: "text-purple-400" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-[#1e1e1e] rounded-xl p-4 border border-[#3a3a3a]">
                    <Icon className={`w-5 h-5 mb-2 ${color}`} />
                    <p className="text-2xl font-bold text-gray-100">{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Ihre Reviere</h3>
              <div className="space-y-2">
                {DEMO_REVIERE.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 bg-[#1e1e1e] rounded-xl border border-[#3a3a3a]">
                    <div className="w-9 h-9 rounded-lg bg-emerald-900/40 flex items-center justify-center">
                      <TreePine className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.size_ha} ha · {r.region}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "strecke" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Streckenerfassung</h2>
              <div className="space-y-2">
                {DEMO_STRECKE.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#1e1e1e] rounded-xl border border-[#3a3a3a]">
                    <div className="w-9 h-9 rounded-lg bg-blue-900/40 flex items-center justify-center">
                      <Target className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.species} · {s.gender}</p>
                      <p className="text-xs text-gray-500">{s.revier} · {s.date}</p>
                    </div>
                    <span className="text-xs bg-green-900/40 text-green-400 px-2 py-1 rounded-lg">erfasst</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "aufgaben" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Offene Aufgaben</h2>
              <div className="space-y-2">
                {DEMO_AUFGABEN.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#1e1e1e] rounded-xl border border-[#3a3a3a]">
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-gray-500">Fällig: {a.due}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <h2 className="text-xl font-bold text-center mb-6 text-gray-100">Alle Features im Überblick</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-[#262626] rounded-xl border border-[#3a3a3a] p-4">
              <div className="w-9 h-9 rounded-lg bg-[#22c55e]/10 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-[#22c55e]" />
              </div>
              <p className="text-sm font-semibold text-gray-100 mb-1">{label}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#22c55e]/20 to-[#16a34a]/10 border border-[#22c55e]/30 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-[#22c55e] mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-100 mb-2">Bereit loszulegen?</h3>
          <p className="text-gray-400 text-sm mb-5">Kontaktieren Sie uns für Ihren eigenen Zugang zu NextHunt.</p>
          <a
            href="mailto:info@nexthunt.de"
            className="inline-flex items-center gap-2 bg-[#22c55e] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#16a34a] transition-colors"
          >
            Kontakt aufnehmen <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}