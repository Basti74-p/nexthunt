import React, { useState } from "react";
import {
  Map, Crosshair, ListTodo, Calendar, TreePine, Settings, LogOut,
  ChevronRight, Menu, X, Home, Users, Archive, AlertCircle
} from "lucide-react";

const DEMO_REVIERE = [
  { id: 1, name: "Revier Mühlbach", region: "Thüringen", size_ha: 1240, status: "active" },
  { id: 2, name: "Waldrevier Nord", region: "Kyffhäuser", size_ha: 870, status: "active" },
  { id: 3, name: "Feldrevier Süd", region: "Thüringen", size_ha: 520, status: "archived" },
];

const DEMO_AUFGABEN = [
  { id: 1, title: "Hochsitz 4 reparieren", due: "2026-03-15", priority: "high", status: "open" },
  { id: 2, title: "Wildkamera Batterie wechseln", due: "2026-03-18", priority: "medium", status: "open" },
  { id: 3, title: "Kirrung Waldrevier auffüllen", due: "2026-03-20", priority: "low", status: "open" },
];

const DEMO_STRECKE = [
  { id: 1, species: "Rehwild", gender: "männlich", date: "2026-03-01", revier: "Revier Mühlbach", status: "erfasst" },
  { id: 2, species: "Schwarzwild", gender: "weiblich", date: "2026-03-03", revier: "Waldrevier Nord", status: "erfasst" },
  { id: 3, species: "Rotwild", gender: "männlich", date: "2026-03-07", revier: "Feldrevier Süd", status: "bestätigt" },
];

const MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "reviere", label: "Reviere", icon: TreePine },
  { id: "strecke", label: "Strecke", icon: Crosshair },
  { id: "jagdkalender", label: "Jagdkalender", icon: Calendar },
  { id: "aufgaben", label: "Aufgaben", icon: ListTodo },
  { id: "wildkammer", label: "Wildkammer", icon: Archive },
  { id: "personen", label: "Personen", icon: Users },
  { id: "settings", label: "Einstellungen", icon: Settings },
];

function DemoSidebar({ activePage, onNavigate, isMobileMenuOpen, onToggleMobileMenu }) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 w-64 h-screen bg-[#1a1a1a] border-r border-[#2d2d2d] flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#2d2d2d] flex items-center gap-3">
          <div className="w-10 h-10 bg-[#22c55e] rounded-xl flex items-center justify-center">
            <TreePine className="w-5 h-5 text-black" />
          </div>
          <div>
            <p className="font-bold text-gray-100">NextHunt</p>
            <p className="text-xs text-gray-500">Demo</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {MENU_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activePage === id
                  ? "bg-[#22c55e] text-black"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#2d2d2d]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-[#2d2d2d]">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-400 hover:bg-[#2d2d2d] transition-all">
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Mobile Menu Toggle */}
      <button
        onClick={onToggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#2d2d2d] rounded-lg text-gray-100"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => onToggleMobileMenu()}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <aside className="md:hidden fixed left-0 top-0 w-56 h-screen bg-[#1a1a1a] z-40 flex flex-col border-r border-[#2d2d2d]">
          <div className="p-6 border-b border-[#2d2d2d]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#22c55e] rounded-xl flex items-center justify-center">
                <TreePine className="w-5 h-5 text-black" />
              </div>
              <p className="font-bold text-gray-100">NextHunt</p>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {MENU_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  onNavigate(id);
                  onToggleMobileMenu();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activePage === id
                    ? "bg-[#22c55e] text-black"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#2d2d2d]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </aside>
      )}
    </>
  );
}

function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Reviere", value: 3, color: "bg-emerald-900/40 text-emerald-400" },
          { label: "Offene Aufgaben", value: 3, color: "bg-amber-900/40 text-amber-400" },
          { label: "Strecke", value: 3, color: "bg-blue-900/40 text-blue-400" },
          { label: "Wildkammer", value: 8, color: "bg-purple-900/40 text-purple-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${color} rounded-xl p-4 border border-gray-700`}>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#262626] rounded-xl border border-[#3a3a3a] p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Ihre Reviere</h2>
          <div className="space-y-2">
            {DEMO_REVIERE.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 bg-[#1e1e1e] rounded-lg border border-[#3a3a3a] hover:border-[#22c55e] transition-colors cursor-pointer">
                <TreePine className="w-4 h-4 text-emerald-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.size_ha} ha</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#262626] rounded-xl border border-[#3a3a3a] p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Offene Aufgaben</h2>
          <div className="space-y-2">
            {DEMO_AUFGABEN.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-[#1e1e1e] rounded-lg border border-[#3a3a3a]">
                <div className={`w-2 h-2 rounded-full ${a.priority === 'high' ? 'bg-red-500' : a.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-gray-500">{a.due}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RevierePage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-100">Reviere</h1>
        <button className="bg-[#22c55e] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#16a34a] transition-colors">
          + Neues Revier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_REVIERE.map((r) => (
          <div key={r.id} className="bg-[#262626] rounded-xl border border-[#3a3a3a] p-6 hover:border-[#22c55e] transition-colors cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-emerald-900/40 rounded-lg flex items-center justify-center">
                <TreePine className="w-5 h-5 text-emerald-400" />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'active' ? 'bg-green-900/40 text-green-400' : 'bg-gray-900/40 text-gray-400'}`}>
                {r.status === 'active' ? 'Aktiv' : 'Archiviert'}
              </span>
            </div>
            <h3 className="font-semibold text-gray-100 mb-1">{r.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{r.region}</p>
            <div className="pt-4 border-t border-[#3a3a3a] text-xs text-gray-500">
              {r.size_ha} Hektar
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StreckeDetaillePage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-100">Strecke</h1>
        <button className="bg-[#22c55e] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#16a34a] transition-colors">
          + Neuer Abschuss
        </button>
      </div>

      <div className="space-y-3">
        {DEMO_STRECKE.map((s) => (
          <div key={s.id} className="bg-[#262626] rounded-xl border border-[#3a3a3a] p-4 hover:border-[#22c55e] transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-blue-900/40 rounded-lg flex items-center justify-center">
                  <Crosshair className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-100">{s.species}</p>
                  <p className="text-sm text-gray-500">{s.revier} · {s.date}</p>
                </div>
              </div>
              <span className="text-xs bg-green-900/40 text-green-400 px-3 py-1 rounded-lg">{s.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JagdkalenderPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-6">Jagdkalender</h1>
      <div className="bg-[#262626] rounded-xl border border-[#3a3a3a] p-6">
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Keine geplanten Jagden</p>
          <button className="mt-4 bg-[#22c55e] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#16a34a] transition-colors">
            + Jagd planen
          </button>
        </div>
      </div>
    </div>
  );
}

function AufgabenPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-100">Aufgaben</h1>
        <button className="bg-[#22c55e] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#16a34a] transition-colors">
          + Neue Aufgabe
        </button>
      </div>

      <div className="space-y-3">
        {DEMO_AUFGABEN.map((a) => (
          <div key={a.id} className="bg-[#262626] rounded-xl border border-[#3a3a3a] p-4 hover:border-[#22c55e] transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <input type="checkbox" className="w-5 h-5 rounded cursor-pointer" />
              <div className="flex-1">
                <p className="font-semibold text-gray-100">{a.title}</p>
                <p className="text-sm text-gray-500">Fällig: {a.due}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-lg ${a.priority === 'high' ? 'bg-red-900/40 text-red-400' : a.priority === 'medium' ? 'bg-amber-900/40 text-amber-400' : 'bg-blue-900/40 text-blue-400'}`}>
                {a.priority}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WildkammerPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-6">Wildkammer</h1>
      <div className="bg-[#262626] rounded-xl border border-[#3a3a3a] p-6">
        <div className="text-center py-12">
          <Archive className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Keine Einträge</p>
        </div>
      </div>
    </div>
  );
}

function PersonenPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-6">Personen</h1>
      <div className="bg-[#262626] rounded-xl border border-[#3a3a3a] p-6">
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Keine Personen hinzugefügt</p>
          <button className="mt-4 bg-[#22c55e] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#16a34a] transition-colors">
            + Person hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-6">Einstellungen</h1>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#262626] rounded-xl border border-[#3a3a3a] p-6">
          <h2 className="font-semibold text-gray-100 mb-4">Benutzerprofil</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Name</label>
              <p className="mt-1 text-gray-100">Demo Benutzer</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">E-Mail</label>
              <p className="mt-1 text-gray-100">demo@nexthunt.de</p>
            </div>
          </div>
        </div>

        <div className="bg-[#262626] rounded-xl border border-[#3a3a3a] p-6">
          <h2 className="font-semibold text-gray-100 mb-4">Lizenz</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Plan: <span className="text-gray-100 font-semibold">Pro</span></p>
            <p className="text-sm text-gray-500">Status: <span className="text-green-400 font-semibold">Aktiv</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Demo() {
  const [activePage, setActivePage] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardPage />;
      case "reviere":
        return <RevierePage />;
      case "strecke":
        return <StreckeDetaillePage />;
      case "jagdkalender":
        return <JagdkalenderPage />;
      case "aufgaben":
        return <AufgabenPage />;
      case "wildkammer":
        return <WildkammerPage />;
      case "personen":
        return <PersonenPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-gray-100">
      <DemoSidebar
        activePage={activePage}
        onNavigate={setActivePage}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <main className="md:ml-64 p-4 md:p-8">
        {renderPage()}
      </main>
    </div>
  );
}