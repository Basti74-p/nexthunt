import React, { useState } from "react";
import {
  LayoutDashboard, TreePine, Shield, LogOut, ChevronDown, ChevronRight,
  Users, Crosshair, Calendar, ListTodo, Globe, Eye, Truck, Archive, Radio,
  UserCheck, UserCog, LifeBuoy, Settings, Menu, X, Plus, Edit2, Trash2,
  Map, Building, Filter, Search, Check, Clock, AlertCircle, TrendingUp
} from "lucide-react";

// ===== DEMO DATA =====
const DEMO_REVIERE = [
  { id: 1, name: "Revier Mühlbach", region: "Thüringen", size_ha: 1240, status: "active", notes: "Hauptrevier mit guter Wildbestände" },
  { id: 2, name: "Waldrevier Nord", region: "Kyffhäuser", size_ha: 870, status: "active", notes: "Wald- und Feldrevier" },
  { id: 3, name: "Feldrevier Süd", region: "Thüringen", size_ha: 520, status: "archived", notes: "Archiviert seit 2025" },
];

const DEMO_AUFGABEN = [
  { id: 1, title: "Hochsitz 4 reparieren", revier: "Revier Mühlbach", due: "2026-03-15", priority: "high", status: "open", assignee: "Max Müller" },
  { id: 2, title: "Wildkamera Batterie wechseln", revier: "Waldrevier Nord", due: "2026-03-18", priority: "medium", status: "open", assignee: "Peter Schmidt" },
  { id: 3, title: "Kirrung Waldrevier auffüllen", revier: "Waldrevier Nord", due: "2026-03-20", priority: "low", status: "in_progress", assignee: "Max Müller" },
  { id: 4, title: "Jagdkarte aktualisieren", revier: "Revier Mühlbach", due: "2026-03-25", priority: "medium", status: "open", assignee: "Anna Weber" },
];

const DEMO_STRECKE = [
  { id: 1, species: "Rehwild", gender: "männlich", age: "3 Jahre", date: "2026-03-01", revier: "Revier Mühlbach", shooter: "Max Müller", weight_kg: 18, status: "erfasst" },
  { id: 2, species: "Schwarzwild", gender: "weiblich", age: "2 Jahre", date: "2026-03-03", revier: "Waldrevier Nord", shooter: "Peter Schmidt", weight_kg: 65, status: "bestätigt" },
  { id: 3, species: "Rotwild", gender: "männlich", age: "6 Jahre", date: "2026-03-07", revier: "Feldrevier Süd", shooter: "Hans Braun", weight_kg: 185, status: "wildkammer" },
  { id: 4, species: "Damwild", gender: "weiblich", age: "4 Jahre", date: "2026-03-10", revier: "Revier Mühlbach", shooter: "Anna Weber", weight_kg: 55, status: "bestätigt" },
];

const DEMO_JAGDEINRICHTUNGEN = [
  { id: 1, name: "Hochsitz 4", type: "hochsitz", revier: "Revier Mühlbach", condition: "gut", orientation: "se", notes: "Guter Überblick über Waldkante" },
  { id: 2, name: "Leiter Nord", type: "leiter", revier: "Waldrevier Nord", condition: "maessig", orientation: "ne", notes: "Wartung nötig" },
  { id: 3, name: "Erdsitz West", type: "erdsitz", revier: "Feldrevier Süd", condition: "gut", orientation: "w", notes: "Feldrand" },
  { id: 4, name: "Kirrung Zentral", type: "kirrung", revier: "Revier Mühlbach", condition: "neu", orientation: "n", notes: "Neu angelegt" },
];

const DEMO_JAGDEN = [
  { id: 1, title: "Drückjagd Waldrevier", date: "2026-03-22", revier: "Waldrevier Nord", type: "drueckjagd", status: "planung", leader: "Peter Schmidt", participants: 8, targetWild: ["Schwarzwild", "Rehwild"] },
  { id: 2, title: "Ansitzjagd Mühlbach", date: "2026-03-29", revier: "Revier Mühlbach", type: "ansitz", status: "planung", leader: "Max Müller", participants: 4, targetWild: ["Rotwild", "Damwild"] },
];

const DEMO_PERSONEN = [
  { id: 1, name: "Max Müller", email: "max@nexthunt.de", phone: "+49 123 456789", type: "member", role: "tenant_owner" },
  { id: 2, name: "Peter Schmidt", email: "peter@nexthunt.de", phone: "+49 234 567890", type: "member", role: "tenant_member" },
  { id: 3, name: "Anna Weber", email: "anna@nexthunt.de", phone: "+49 345 678901", type: "member", role: "tenant_member" },
  { id: 4, name: "Hans Braun", email: "hans@nexthunt.de", phone: "+49 456 789012", type: "guest", role: null },
];

const DEMO_WILDKAMMER = [
  { id: 1, species: "Rotwild", gender: "männlich", date: "2026-03-07", weight: 185, status: "verarbeitung", notes: "Hirsch 6 Jahre" },
  { id: 2, species: "Schwarzwild", gender: "weiblich", date: "2026-03-03", weight: 65, status: "lager", notes: "Bache, gutes Fleisch" },
];

const NAV = [
  { label: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
  {
    label: "Karte",
    page: "Karte",
    icon: Map,
    children: [
      { label: "Reviere", page: "Reviere", icon: TreePine },
      { label: "Jagdeinrichtungen", page: "Jagdeinrichtungen", icon: Building }
    ]
  },
  {
    label: "Wildmanagement",
    page: "Wildmanagement",
    icon: Eye,
    children: [
      { label: "Rotwild", page: "WildRotwild", icon: TreePine },
      { label: "Schwarzwild", page: "WildSchwarzwild", icon: TreePine },
      { label: "Rehwild", page: "WildRehwild", icon: TreePine },
      { label: "Wolf", page: "WildWolf", icon: TreePine }
    ]
  },
  {
    label: "Strecke",
    page: "Strecke",
    icon: Crosshair,
    children: [
      { label: "Abschussplan", page: "StreckeAbschussplan", icon: Crosshair },
      { label: "Wildkammer", page: "StreckeWildkammer", icon: Archive },
      { label: "Lager", page: "WildProdukte", icon: Archive },
      { label: "Wildverkauf", page: "Wildverkauf", icon: Truck },
      { label: "Archiv", page: "StreckeArchiv", icon: Archive }
    ]
  },
  {
    label: "Jagdkalender",
    page: "JagdkalenderMain",
    icon: Calendar,
    children: [
      { label: "Alle Jagden", page: "JagdkalenderMain", icon: Calendar },
      { label: "Live-Monitor", page: "Jagdkalender", icon: Radio },
      { label: "Jagdgäste", page: "Jagdgaeste", icon: UserCheck },
      { label: "Personal", page: "Personal", icon: UserCog }
    ]
  },
  { label: "Aufgaben", page: "Aufgaben", icon: ListTodo },
  {
    label: "Personen",
    page: "Personen",
    icon: Users,
    children: [
      { label: "Berechtigungen", page: "TenantMembers", icon: Shield }
    ]
  },
  { label: "Öffentlichkeit", page: "Oeffentlichkeit", icon: Globe },
  { label: "Support", page: "SupportTickets", icon: LifeBuoy },
  { label: "Einstellungen", page: "TenantSettings", icon: Settings }
];

// ===== COMPONENTS =====

function StatCard({ label, value, color = "text-emerald-400", bgColor = "bg-emerald-900/40" }) {
  return (
    <div className={`${bgColor} rounded-xl p-4 border border-gray-700`}>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function DataTable({ columns, data, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#3a3a3a]">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-gray-400 font-semibold">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="px-4 py-3 text-gray-400">Aktionen</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-b border-[#2d2d2d] hover:bg-[#262626] transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-gray-300">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-4 py-3 flex gap-2">
                  {onEdit && (
                    <button className="p-1.5 hover:bg-[#3a3a3a] rounded-lg text-gray-400 hover:text-gray-300 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button className="p-1.5 hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Modal({ title, isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#262626] rounded-xl border border-[#3a3a3a] max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-[#3a3a3a]">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Button({ children, onClick, variant = "primary", size = "md" }) {
  const baseStyles = "font-semibold rounded-lg transition-colors";
  const variants = {
    primary: "bg-[#22c55e] text-black hover:bg-[#16a34a]",
    secondary: "bg-[#2d2d2d] text-gray-100 hover:bg-[#3a3a3a]",
    danger: "bg-red-900/40 text-red-400 hover:bg-red-900/60"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  return (
    <button onClick={onClick} className={`${baseStyles} ${variants[variant]} ${sizes[size]}`}>
      {children}
    </button>
  );
}

// ===== PAGE COMPONENTS =====

function DashboardPage() {
  const activeReviere = DEMO_REVIERE.filter(r => r.status === "active").length;
  const openTasks = DEMO_AUFGABEN.filter(t => t.status === "open").length;
  const streckeThisYear = DEMO_STRECKE.length;
  const plannedHunts = DEMO_JAGDEN.filter(j => j.status === "planung").length;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Aktive Reviere" value={activeReviere} color="text-emerald-400" bgColor="bg-emerald-900/40" />
        <StatCard label="Offene Aufgaben" value={openTasks} color="text-amber-400" bgColor="bg-amber-900/40" />
        <StatCard label="Strecke 2026" value={streckeThisYear} color="text-blue-400" bgColor="bg-blue-900/40" />
        <StatCard label="Jagden geplant" value={plannedHunts} color="text-purple-400" bgColor="bg-purple-900/40" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#262626] rounded-xl border border-[#3a3a3a] p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <TreePine className="w-5 h-5 text-emerald-400" />
            Ihre Reviere
          </h2>
          <div className="space-y-2">
            {DEMO_REVIERE.filter(r => r.status === "active").map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 bg-[#1e1e1e] rounded-lg border border-[#3a3a3a] hover:border-[#22c55e] transition-colors cursor-pointer">
                <TreePine className="w-4 h-4 text-emerald-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.size_ha} ha · {r.region}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#262626] rounded-xl border border-[#3a3a3a] p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-amber-400" />
            Offene Aufgaben
          </h2>
          <div className="space-y-2">
            {DEMO_AUFGABEN.filter(t => t.status === "open").slice(0, 4).map((a) => (
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
  const [showModal, setShowModal] = useState(false);
  const [reviere, setReviere] = useState(DEMO_REVIERE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-100">Reviere</h1>
        <Button onClick={() => setShowModal(true)}>+ Neues Revier</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviere.map((r) => (
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
            <p className="text-sm text-gray-500 mb-3">{r.region}</p>
            <p className="text-xs text-gray-400 mb-4 line-clamp-2">{r.notes}</p>
            <div className="pt-4 border-t border-[#3a3a3a] text-xs text-gray-500">
              {r.size_ha} Hektar
            </div>
          </div>
        ))}
      </div>

      <Modal title="Neues Revier erstellen" isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Name</label>
            <input type="text" placeholder="z.B. Waldrevier" className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-3 py-2 text-gray-100 placeholder-gray-600" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Region</label>
            <input type="text" placeholder="z.B. Thüringen" className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-3 py-2 text-gray-100 placeholder-gray-600" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Größe (ha)</label>
            <input type="number" placeholder="z.B. 1240" className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-3 py-2 text-gray-100 placeholder-gray-600" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Abbrechen</Button>
            <Button onClick={() => setShowModal(false)}>Erstellen</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StreckeDetailPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const filtered = DEMO_STRECKE.filter(s => 
    (filterStatus === "all" || s.status === filterStatus) &&
    (s.species.toLowerCase().includes(searchTerm.toLowerCase()) || s.revier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-100">Strecke</h1>
        <Button>+ Neuer Abschuss</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Nach Wildart oder Revier suchen..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#262626] border border-[#3a3a3a] rounded-lg pl-10 pr-4 py-2 text-gray-100 placeholder-gray-600"
          />
        </div>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#262626] border border-[#3a3a3a] rounded-lg px-4 py-2 text-gray-100"
        >
          <option value="all">Alle Status</option>
          <option value="erfasst">Erfasst</option>
          <option value="bestätigt">Bestätigt</option>
          <option value="wildkammer">Wildkammer</option>
        </select>
      </div>

      <div className="bg-[#262626] rounded-xl border border-[#3a3a3a] overflow-hidden">
        <DataTable 
          columns={[
            { key: "species", label: "Wildart" },
            { key: "gender", label: "Geschlecht" },
            { key: "date", label: "Datum" },
            { key: "revier", label: "Revier" },
            { key: "weight_kg", label: "Gewicht", render: (val) => `${val} kg` },
            { 
              key: "status", 
              label: "Status",
              render: (val) => (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  val === "erfasst" ? "bg-yellow-900/40 text-yellow-400" :
                  val === "bestätigt" ? "bg-green-900/40 text-green-400" :
                  "bg-blue-900/40 text-blue-400"
                }`}>
                  {val}
                </span>
              )
            }
          ]}
          data={filtered}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </div>
    </div>
  );
}

function JagdkalenderPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-6">Jagdkalender</h1>
      
      <div className="flex gap-4 mb-6">
        <Button>+ Jagd planen</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEMO_JAGDEN.map((jagd) => (
          <div key={jagd.id} className="bg-[#262626] rounded-xl border border-[#3a3a3a] p-6 hover:border-[#22c55e] transition-colors">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-100">{jagd.title}</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-900/40 text-blue-400">{jagd.status}</span>
            </div>
            <div className="space-y-2 mb-4 text-sm text-gray-400">
              <p><strong>Datum:</strong> {jagd.date}</p>
              <p><strong>Revier:</strong> {jagd.revier}</p>
              <p><strong>Jagdleiter:</strong> {jagd.leader}</p>
              <p><strong>Teilnehmer:</strong> {jagd.participants}</p>
              <p><strong>Zielwild:</strong> {jagd.targetWild.join(", ")}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary">Bearbeiten</Button>
              <Button size="sm" variant="secondary">Details</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AufgabenPage() {
  const [aufgaben, setAufgaben] = useState(DEMO_AUFGABEN);
  const [showModal, setShowModal] = useState(false);

  const toggleTask = (id) => {
    setAufgaben(aufgaben.map(a => 
      a.id === id ? { ...a, status: a.status === "open" ? "completed" : "open" } : a
    ));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-100">Aufgaben</h1>
        <Button onClick={() => setShowModal(true)}>+ Neue Aufgabe</Button>
      </div>

      <div className="space-y-3">
        {aufgaben.map((a) => (
          <div key={a.id} className="bg-[#262626] rounded-xl border border-[#3a3a3a] p-4 hover:border-[#22c55e] transition-colors">
            <div className="flex items-center gap-4">
              <input 
                type="checkbox" 
                checked={a.status === "completed"}
                onChange={() => toggleTask(a.id)}
                className="w-5 h-5 rounded cursor-pointer accent-[#22c55e]"
              />
              <div className="flex-1">
                <p className={`font-semibold ${a.status === "completed" ? "line-through text-gray-600" : "text-gray-100"}`}>{a.title}</p>
                <p className="text-xs text-gray-500">Revier: {a.revier} · Zugewiesen: {a.assignee}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-lg ${a.priority === 'high' ? 'bg-red-900/40 text-red-400' : a.priority === 'medium' ? 'bg-amber-900/40 text-amber-400' : 'bg-blue-900/40 text-blue-400'}`}>
                {a.priority}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${a.status === "open" ? "bg-gray-900/40 text-gray-400" : "bg-green-900/40 text-green-400"}`}>
                {a.status === "open" ? "Offen" : "Erledigt"}
              </span>
              <span className="text-xs text-gray-500">{a.due}</span>
            </div>
          </div>
        ))}
      </div>

      <Modal title="Neue Aufgabe" isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="space-y-4">
          <input type="text" placeholder="Aufgabenname" className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-3 py-2 text-gray-100" />
          <select className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-3 py-2 text-gray-100">
            <option>Revier wählen</option>
            {DEMO_REVIERE.map(r => <option key={r.id}>{r.name}</option>)}
          </select>
          <input type="date" className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-3 py-2 text-gray-100" />
          <select className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-3 py-2 text-gray-100">
            <option>Priorität</option>
            <option>Hoch</option>
            <option>Mittel</option>
            <option>Niedrig</option>
          </select>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Abbrechen</Button>
            <Button onClick={() => setShowModal(false)}>Erstellen</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function JagdeinrichtungenPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-100">Jagdeinrichtungen</h1>
        <Button onClick={() => setShowModal(true)}>+ Neue Einrichtung</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_JAGDEINRICHTUNGEN.map((e) => (
          <div key={e.id} className="bg-[#262626] rounded-xl border border-[#3a3a3a] p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-100">{e.name}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${e.condition === "gut" ? "bg-green-900/40 text-green-400" : e.condition === "maessig" ? "bg-amber-900/40 text-amber-400" : "bg-blue-900/40 text-blue-400"}`}>
                {e.condition}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{e.type.toUpperCase()} · {e.revier}</p>
            <p className="text-xs text-gray-400 mb-4">{e.notes}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary">Bearbeiten</Button>
              <Button size="sm" variant="secondary">Kontrolle</Button>
            </div>
          </div>
        ))}
      </div>

      <Modal title="Neue Jagdeinrichtung" isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="space-y-4">
          <input type="text" placeholder="Name" className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-3 py-2 text-gray-100" />
          <select className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-3 py-2 text-gray-100">
            <option>Typ wählen</option>
            <option>Hochsitz</option>
            <option>Leiter</option>
            <option>Erdsitz</option>
            <option>Kirrung</option>
          </select>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Abbrechen</Button>
            <Button onClick={() => setShowModal(false)}>Erstellen</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PersonenPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-100">Personen</h1>
        <Button>+ Person hinzufügen</Button>
      </div>

      <div className="bg-[#262626] rounded-xl border border-[#3a3a3a] overflow-hidden">
        <DataTable 
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "E-Mail" },
            { key: "phone", label: "Telefon" },
            { key: "type", label: "Typ" },
            { key: "role", label: "Rolle", render: (val) => val || "-" }
          ]}
          data={DEMO_PERSONEN}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </div>
    </div>
  );
}

function WildkammerPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-6">Wildkammer</h1>

      <div className="bg-[#262626] rounded-xl border border-[#3a3a3a] overflow-hidden">
        <DataTable 
          columns={[
            { key: "species", label: "Wildart" },
            { key: "gender", label: "Geschlecht" },
            { key: "date", label: "Eingang" },
            { key: "weight", label: "Gewicht", render: (val) => `${val} kg` },
            { 
              key: "status", 
              label: "Status",
              render: (val) => (
                <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-900/40 text-blue-400">
                  {val}
                </span>
              )
            }
          ]}
          data={DEMO_WILDKAMMER}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </div>
    </div>
  );
}

function DefaultPage({ title, icon: Icon }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-8">{title}</h1>
      <div className="bg-[#262626] rounded-xl border border-[#3a3a3a] p-12 text-center">
        <Icon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 mb-4">{title}-Modul</p>
        <Button>Dieses Modul aktivieren</Button>
      </div>
    </div>
  );
}

const PAGES = {
  Dashboard: DashboardPage,
  Reviere: RevierePage,
  Jagdeinrichtungen: JagdeinrichtungenPage,
  Karte: () => <DefaultPage title="Karte" icon={Map} />,
  Wildmanagement: () => <DefaultPage title="Wildmanagement" icon={Eye} />,
  WildRotwild: () => <DefaultPage title="Rotwild" icon={TreePine} />,
  WildSchwarzwild: () => <DefaultPage title="Schwarzwild" icon={TreePine} />,
  WildRehwild: () => <DefaultPage title="Rehwild" icon={TreePine} />,
  WildWolf: () => <DefaultPage title="Wolf" icon={TreePine} />,
  Strecke: StreckeDetailPage,
  StreckeAbschussplan: () => <DefaultPage title="Abschussplan" icon={Crosshair} />,
  StreckeWildkammer: WildkammerPage,
  WildProdukte: () => <DefaultPage title="Lager" icon={Archive} />,
  Wildverkauf: () => <DefaultPage title="Wildverkauf" icon={Truck} />,
  StreckeArchiv: () => <DefaultPage title="Archiv" icon={Archive} />,
  JagdkalenderMain: JagdkalenderPage,
  Jagdkalender: () => <DefaultPage title="Live-Monitor" icon={Radio} />,
  Jagdgaeste: () => <DefaultPage title="Jagdgäste" icon={UserCheck} />,
  Personal: () => <DefaultPage title="Personal" icon={UserCog} />,
  Aufgaben: AufgabenPage,
  Personen: PersonenPage,
  TenantMembers: () => <DefaultPage title="Berechtigungen" icon={Shield} />,
  Oeffentlichkeit: () => <DefaultPage title="Öffentlichkeit" icon={Globe} />,
  SupportTickets: () => <DefaultPage title="Support" icon={LifeBuoy} />,
  TenantSettings: () => <DefaultPage title="Einstellungen" icon={Settings} />
};

// ===== NAVIGATION =====

function NavItem({ item, currentPage, onNavigate, depth = 0 }) {
  const hasChildren = item.children && item.children.length > 0;
  const isActive = currentPage === item.page;
  const childIsActive = hasChildren && item.children.some((c) => c.page === currentPage);
  const [open, setOpen] = useState(childIsActive);
  const Icon = item.icon;

  if (!hasChildren) {
    return (
      <button
        onClick={() => onNavigate(item.page)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${depth > 0 ? "pl-8" : ""} ${
          isActive
            ? "bg-[#22c55e] text-[#1e1e1e] shadow-sm"
            : "text-gray-300 hover:bg-[#2d2d2d] hover:text-gray-100"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {item.label}
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => {
          if (item.page) onNavigate(item.page);
          setOpen(!open);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive || childIsActive
            ? "bg-[#22c55e] text-[#1e1e1e]"
            : "text-gray-300 hover:bg-[#2d2d2d] hover:text-gray-100"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="mt-0.5 ml-3 space-y-0.5 border-l-2 border-[#2d2d2d] pl-2">
          {item.children.map((child) => (
            <NavItem
              key={child.page}
              item={child}
              currentPage={currentPage}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DemoSidebar({ currentPage, onNavigate, isMobileMenuOpen, onToggleMobileMenu }) {
  return (
    <>
      <button
        onClick={onToggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#2d2d2d] rounded-lg text-gray-100"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => onToggleMobileMenu()} />
      )}

      <aside className={`fixed left-0 top-0 w-64 h-screen bg-[#1e1e1e] border-r border-[#2d2d2d] flex flex-col z-40 ${isMobileMenuOpen ? "block" : "hidden"} md:flex`}>
        <div className="px-6 py-5 border-b border-[#2d2d2d]">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c370741b119950032ab62/7a1f75278_NextHunt_logo_transparent.png"
            alt="NextHunt Logo"
            className="w-40 h-auto"
          />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              currentPage={currentPage}
              onNavigate={(page) => {
                onNavigate(page);
                if (window.innerWidth < 768) onToggleMobileMenu();
              }}
            />
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[#2d2d2d]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center text-[#1e1e1e] text-xs font-bold">
              M
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-100 truncate">Max Müller</p>
              <p className="text-[10px] text-gray-500 truncate">max@nexthunt.de</p>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-[#2d2d2d] text-gray-500 hover:text-gray-300">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function Demo() {
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const PageComponent = PAGES[currentPage] || (() => <DefaultPage title={currentPage} icon={LayoutDashboard} />);

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-gray-100">
      <DemoSidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <main className="md:ml-64 p-4 md:p-8">
        <PageComponent />
      </main>
    </div>
  );
}