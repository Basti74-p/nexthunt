import React, { useState } from "react";
import {
  LayoutDashboard, TreePine, Shield, LogOut, ChevronDown, ChevronRight,
  Users, Crosshair, Calendar, ListTodo, Globe, Eye, Truck, Archive, Radio,
  UserCheck, UserCog, LifeBuoy, Settings, Menu, X, Plus, Map, Building,
  ArrowRight, Pencil, Trash2, MapPin, Check, Filter
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

// ===== DEMO DATA =====
const DEMO_REVIERE = [
  { id: 1, name: "Revier Mühlbach", region: "Thüringen", size_ha: 1240, status: "active", notes: "Hauptrevier mit guten Wildbeständen" },
  { id: 2, name: "Waldrevier Nord", region: "Kyffhäuser", size_ha: 870, status: "active", notes: "Wald- und Feldrevier" },
  { id: 3, name: "Feldrevier Süd", region: "Thüringen", size_ha: 520, status: "archived", notes: "Archiviert seit 2025" },
];

const DEMO_AUFGABEN = [
  { id: 1, title: "Hochsitz 4 reparieren", description: "Inspektions- und Reparaturarbeiten durchführen", due_date: "2026-03-15", priority: "high", status: "offen" },
  { id: 2, title: "Wildkamera Batterie wechseln", description: "Batterie in Waldrevier Nord austauschen", due_date: "2026-03-18", priority: "medium", status: "offen" },
  { id: 3, title: "Kirrung auffüllen", description: "Kirrung in Waldrevier Nord mit Körnerfutter auffüllen", due_date: "2026-03-20", priority: "medium", status: "erledigt" },
  { id: 4, title: "Jagdkarte aktualisieren", description: "Neue Jagdkarte für Q2 2026 erstellen", due_date: "2026-03-25", priority: "low", status: "offen" },
];

const DEMO_STRECKE = [
  { id: 1, species: "rehwild", gender: "maennlich", age_class: "Bock Klasse II", date: "2026-03-01", revier_id: 1, weight_kg: 18, wildmark_id: "", notes: "Gutes Stück", status: "erfasst" },
  { id: 2, species: "schwarzwild", gender: "weiblich", age_class: "Bache", date: "2026-03-03", revier_id: 2, weight_kg: 65, wildmark_id: "", notes: "Sehr gutes Fleisch", status: "bestaetigt" },
  { id: 3, species: "rotwild", gender: "maennlich", age_class: "Hirsch Klasse I", date: "2026-03-07", revier_id: 3, weight_kg: 185, wildmark_id: "", notes: "Schöner Hirsch", status: "wildkammer" },
  { id: 4, species: "damwild", gender: "weiblich", age_class: "Damtier", date: "2026-03-10", revier_id: 1, weight_kg: 55, wildmark_id: "", notes: "", status: "bestaetigt" },
];

const SPECIES = [
  { value: "rotwild", label: "Rotwild" },
  { value: "schwarzwild", label: "Schwarzwild" },
  { value: "rehwild", label: "Rehwild" },
  { value: "damwild", label: "Damwild" },
  { value: "sikawild", label: "Sikawild" },
  { value: "wolf", label: "Wolf" },
];

const GENDER = [
  { value: "maennlich", label: "Männlich" },
  { value: "weiblich", label: "Weiblich" },
  { value: "unbekannt", label: "Unbekannt" },
];

const STATUS_OPTIONS = [
  { value: "erfasst", label: "Erfasst", color: "bg-amber-100 text-amber-700" },
  { value: "bestaetigt", label: "Bestätigt", color: "bg-blue-100 text-blue-700" },
  { value: "wildkammer", label: "Wildkammer", color: "bg-purple-100 text-purple-700" },
  { value: "verkauft", label: "Verkauft", color: "bg-emerald-100 text-emerald-700" },
  { value: "archiviert", label: "Archiviert", color: "bg-gray-100 text-gray-500" },
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

function StatusBadge({ status }) {
  const statusMap = {
    "active": { bg: "bg-emerald-50", text: "text-emerald-700", label: "Aktiv" },
    "archived": { bg: "bg-gray-50", text: "text-gray-700", label: "Archiviert" },
    "erfasst": { bg: "bg-amber-100", text: "text-amber-700", label: "Erfasst" },
    "bestaetigt": { bg: "bg-blue-100", text: "text-blue-700", label: "Bestätigt" },
    "wildkammer": { bg: "bg-purple-100", text: "text-purple-700", label: "Wildkammer" },
    "high": { bg: "bg-red-100", text: "text-red-700", label: "Hoch" },
    "medium": { bg: "bg-amber-100", text: "text-amber-700", label: "Mittel" },
    "low": { bg: "bg-blue-100", text: "text-blue-700", label: "Niedrig" },
  };
  const s = statusMap[status] || statusMap["active"];
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>;
}

function Dialog({ open, onOpenChange, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function DashboardPage({ reviere, aufgaben, strecken }) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Willkommen, Max</h1>
        <p className="text-sm text-gray-500 mt-1">Revier Mühlbach</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Reviere", value: reviere.filter(r => r.status === "active").length, icon: Map, color: "bg-emerald-50 text-emerald-600" },
          { label: "Offene Aufgaben", value: aufgaben.filter(a => a.status === "offen").length, icon: ListTodo, color: "bg-amber-50 text-amber-600" },
          { label: "Strecke (gesamt)", value: strecken.length, icon: Crosshair, color: "bg-blue-50 text-blue-600" },
          { label: "Geplante Jagden", value: 2, icon: Calendar, color: "bg-purple-50 text-purple-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Ihre Reviere</h2>
          <a href="#" className="text-sm text-gray-900 font-medium flex items-center gap-1 hover:underline">Alle anzeigen <ArrowRight className="w-4 h-4" /></a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reviere.filter(r => r.status === "active").map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-300 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TreePine className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{r.name}</p>
                <p className="text-xs text-gray-400">{r.size_ha} ha</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300" />
            </div>
          ))}
        </div>
      </div>

      {aufgaben.filter(a => a.status === "offen").length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Offene Aufgaben</h2>
          <div className="space-y-2">
            {aufgaben.filter(a => a.status === "offen").slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-sm text-gray-700 flex-1">{a.title}</span>
                {a.due_date && <span className="text-xs text-gray-400">{a.due_date}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RevierePage({ reviere, onDelete }) {
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: "", region: "", size_ha: "", notes: "" });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reviere</h1>
          <p className="text-sm text-gray-500 mt-1">{reviere.length} Revier{reviere.length !== 1 ? "e" : ""} verwaltet</p>
        </div>
        <button onClick={() => setShowDialog(true)} className="bg-[#22c55e] text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#16a34a] transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Neues Revier
        </button>
      </div>

      {reviere.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <TreePine className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Keine Reviere vorhanden</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviere.map((r) => (
            <div key={r.id} className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 group">
              {r.status === "active" && (
                <button
                  onClick={() => {
                    if (confirm(`Revier "${r.name}" wirklich löschen?`)) onDelete(r.id);
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TreePine className="w-5 h-5 text-emerald-600" />
                </div>
                <StatusBadge status={r.status} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{r.name}</h3>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                {r.region && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.region}</span>}
                {r.size_ha && <span>{r.size_ha} ha</span>}
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs text-gray-900 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Öffnen <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog} title="Neues Revier">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Reviername" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22c55e]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Region</label>
              <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="z.B. Harz" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22c55e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Größe (ha)</label>
              <input type="number" value={form.size_ha} onChange={(e) => setForm({ ...form, size_ha: e.target.value })} placeholder="z.B. 500" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22c55e]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Notizen</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optionale Bemerkungen" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22c55e] resize-none h-20" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowDialog(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50">Abbrechen</button>
            <button onClick={() => setShowDialog(false)} className="flex-1 px-4 py-2 bg-[#22c55e] text-black rounded-lg hover:bg-[#16a34a] font-medium">Erstellen</button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function StreckeDetailPage({ reviere, strecken, onUpdate }) {
  const [showDialog, setShowDialog] = useState(false);
  const [filterSpecies, setFilterSpecies] = useState("alle");
  const [filterRevier, setFilterRevier] = useState("alle");
  const [filterStatus, setFilterStatus] = useState("alle");

  const filtered = strecken.filter(s => 
    (filterSpecies === "alle" || s.species === filterSpecies) &&
    (filterRevier === "alle" || s.revier_id === parseInt(filterRevier)) &&
    (filterStatus === "alle" || s.status === filterStatus)
  );

  const byStatus = (status) => strecken.filter(s => s.status === status).length;
  const speciesLabel = (v) => SPECIES.find(s => s.value === v)?.label || v;
  const genderLabel = (v) => GENDER.find(g => g.value === v)?.label || v;
  const revierName = (id) => reviere.find(r => r.id === id)?.name || "–";

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Strecke</h1>
          <p className="text-sm text-gray-500 mt-1">{strecken.length} Einträge gesamt</p>
        </div>
        <button onClick={() => setShowDialog(true)} className="bg-[#22c55e] text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#16a34a] transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Neuer Eintrag
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {STATUS_OPTIONS.filter(s => s.value !== "archiviert").map(({ value, label, color }) => (
          <div key={value} className="bg-white rounded-2xl border border-gray-100 p-4 text-center cursor-pointer hover:border-gray-300 transition-colors"
            onClick={() => setFilterStatus(filterStatus === value ? "alle" : value)}>
            <p className="text-2xl font-bold text-gray-900">{byStatus(value)}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <select value={filterSpecies} onChange={e => setFilterSpecies(e.target.value)} className="text-sm bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#22c55e]">
          <option value="alle">Alle Wildarten</option>
          {SPECIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filterRevier} onChange={e => setFilterRevier(e.target.value)} className="text-sm bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#22c55e]">
          <option value="alle">Alle Reviere</option>
          {reviere.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#22c55e]">
          <option value="alle">Alle Status</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Datum</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Wildart</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Geschlecht</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Altersklasse</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Revier</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Gewicht</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{item.date ? format(new Date(item.date + "T00:00:00"), "dd.MM.yyyy", { locale: de }) : "–"}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{speciesLabel(item.species)}</td>
                <td className="px-4 py-3 text-gray-600">{genderLabel(item.gender)}</td>
                <td className="px-4 py-3 text-gray-600">{item.age_class || "–"}</td>
                <td className="px-4 py-3 text-gray-600">{revierName(item.revier_id)}</td>
                <td className="px-4 py-3 text-gray-600">{item.weight_kg ? `${item.weight_kg} kg` : "–"}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog} title="Neuer Strecken-Eintrag">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Dialog-Funktionalität in dieser Demo-Version</p>
        </div>
      </Dialog>
    </div>
  );
}

function AufgabenPage({ aufgaben, onToggle }) {
  const [showDialog, setShowDialog] = useState(false);
  const open = aufgaben.filter(a => a.status !== "erledigt");
  const done = aufgaben.filter(a => a.status === "erledigt");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aufgaben</h1>
          <p className="text-sm text-gray-500 mt-1">{open.length} offen</p>
        </div>
        <button onClick={() => setShowDialog(true)} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Neue Aufgabe
        </button>
      </div>

      <div className="space-y-4">
        {open.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Offen ({open.length})</p>
            {open.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <button onClick={() => onToggle(a.id, a.status)} className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-900 transition-colors shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{a.title}</p>
                  {a.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{a.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.priority} />
                  {a.due_date && <span className="text-xs text-gray-400">{a.due_date}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        {done.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Erledigt ({done.length})</p>
            {done.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 opacity-50">
                <button onClick={() => onToggle(a.id, a.status)} className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" />
                </button>
                <p className="font-medium text-gray-500 line-through">{a.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DefaultPage({ title }) {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{title}</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p className="text-gray-600">{title}-Modul</p>
      </div>
    </div>
  );
}

const PAGES = {
  Dashboard: DashboardPage,
  Reviere: RevierePage,
  Karte: () => <DefaultPage title="Karte" />,
  Jagdeinrichtungen: () => <DefaultPage title="Jagdeinrichtungen" />,
  Wildmanagement: () => <DefaultPage title="Wildmanagement" />,
  WildRotwild: () => <DefaultPage title="Rotwild" />,
  WildSchwarzwild: () => <DefaultPage title="Schwarzwild" />,
  WildRehwild: () => <DefaultPage title="Rehwild" />,
  WildWolf: () => <DefaultPage title="Wolf" />,
  Strecke: StreckeDetailPage,
  StreckeAbschussplan: () => <DefaultPage title="Abschussplan" />,
  StreckeWildkammer: () => <DefaultPage title="Wildkammer" />,
  WildProdukte: () => <DefaultPage title="Lager" />,
  Wildverkauf: () => <DefaultPage title="Wildverkauf" />,
  StreckeArchiv: () => <DefaultPage title="Archiv" />,
  JagdkalenderMain: () => <DefaultPage title="Jagdkalender" />,
  Jagdkalender: () => <DefaultPage title="Live-Monitor" />,
  Jagdgaeste: () => <DefaultPage title="Jagdgäste" />,
  Personal: () => <DefaultPage title="Personal" />,
  Aufgaben: AufgabenPage,
  Personen: () => <DefaultPage title="Personen" />,
  TenantMembers: () => <DefaultPage title="Berechtigungen" />,
  Oeffentlichkeit: () => <DefaultPage title="Öffentlichkeit" />,
  SupportTickets: () => <DefaultPage title="Support" />,
  TenantSettings: () => <DefaultPage title="Einstellungen" />
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
            ? "bg-[#22c55e] text-[#1e1e1e]"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
      </button>
      {open && (
        <div className="mt-0.5 ml-3 space-y-0.5 border-l-2 border-gray-200 pl-2">
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
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg text-gray-900 border border-gray-200"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => onToggleMobileMenu()} />
      )}

      <aside className={`fixed left-0 top-0 w-64 h-screen bg-white border-r border-gray-200 flex flex-col z-40 ${isMobileMenuOpen ? "block" : "hidden"} md:flex`}>
        <div className="px-6 py-5 border-b border-gray-200">
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

        <div className="px-3 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center text-white text-xs font-bold">
              M
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Max Müller</p>
              <p className="text-[10px] text-gray-500 truncate">max@nexthunt.de</p>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700">
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
  const [reviere, setReviere] = useState(DEMO_REVIERE);
  const [aufgaben, setAufgaben] = useState(DEMO_AUFGABEN);
  const [strecken, setStrecken] = useState(DEMO_STRECKE);

  const handleDeleteRevier = (id) => {
    setReviere(reviere.filter(r => r.id !== id));
  };

  const handleToggleTask = (id, status) => {
    setAufgaben(aufgaben.map(a => 
      a.id === id ? { ...a, status: status === "erledigt" ? "offen" : "erledigt" } : a
    ));
  };

  const PageComponent = PAGES[currentPage];
  const pageProps = {
    Dashboard: { reviere, aufgaben, strecken },
    Reviere: { reviere, onDelete: handleDeleteRevier },
    Strecke: { reviere, strecken },
    Aufgaben: { aufgaben, onToggle: handleToggleTask },
  }[currentPage] || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoSidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <main className="md:ml-64 p-4 md:p-8">
        {PageComponent ? <PageComponent {...pageProps} /> : <DefaultPage title={currentPage} />}
      </main>
    </div>
  );
}