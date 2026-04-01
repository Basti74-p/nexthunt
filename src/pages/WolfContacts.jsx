import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ORG_TYPES = ["Landesjagdverband", "Untere Jagdbehörde", "Obere Jagdbehörde", "Wolfsbeauftragter", "Rissgutachter", "Forschungsinstitut", "DBBW", "Senckenberg Labor", "Naturschutzbehörde"];
const FEDERAL_STATES = ["Baden-Württemberg","Bayern","Berlin","Brandenburg","Bremen","Hamburg","Hessen","Mecklenburg-Vorpommern","Niedersachsen","Nordrhein-Westfalen","Rheinland-Pfalz","Saarland","Sachsen","Sachsen-Anhalt","Schleswig-Holstein","Thüringen"];

const TYPE_ICONS = {
  "DBBW": "🇩🇪", "Senckenberg Labor": "🔬", "Landesjagdverband": "🏹",
  "Untere Jagdbehörde": "🏛️", "Obere Jagdbehörde": "🏛️", "Wolfsbeauftragter": "🐺",
  "Rissgutachter": "🔍", "Forschungsinstitut": "📚", "Naturschutzbehörde": "🌿"
};

const DEFAULT_CONTACTS = [
  { org_name: "DBBW – Dokumentations- und Beratungsstelle des Bundes zum Thema Wolf", org_type: "DBBW", contact_person: "DBBW Team", email: "dbbw@bfn.de", address: "Bundesamt für Naturschutz, Konstantinstr. 110, 53179 Bonn", federal_state: "", is_primary: true },
  { org_name: "Senckenberg Zentrum für Wildtiergenetik", org_type: "Senckenberg Labor", contact_person: "Labor Wildtiergenetik", email: "wildtiergenetik@senckenberg.de", address: "Leipziger Str. 44, 63571 Gelnhausen", phone: "+49 6051 61954-0", federal_state: "", is_primary: true },
  { org_name: "Deutscher Jagdverband (DJV)", org_type: "Landesjagdverband", contact_person: "DJV Geschäftsstelle", email: "info@jagdverband.de", address: "Rudi-Lesser-Weg 3, 22605 Hamburg", federal_state: "", is_primary: false },
];

export default function WolfContacts() {
  const { tenant } = useAuth();
  const qc = useQueryClient();
  const [filterState, setFilterState] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [form, setForm] = useState({
    org_name: "", org_type: "", federal_state: "", contact_person: "",
    phone: "", email: "", address: "", notes: "", is_primary: false
  });

  const { data: contacts = [], refetch } = useQuery({
    queryKey: ["wolf-contacts", tenant?.id],
    queryFn: () => tenant?.id ? base44.entities.WolfContact.filter({ tenant_id: tenant.id }) : [],
    enabled: !!tenant?.id
  });

  async function seedDefaults() {
    for (const c of DEFAULT_CONTACTS) {
      await base44.entities.WolfContact.create({ ...c, tenant_id: tenant.id });
    }
    refetch();
    setSeeded(true);
  }

  async function handleSave() {
    if (!form.org_name || !form.org_type) return;
    setSaving(true);
    await base44.entities.WolfContact.create({ ...form, tenant_id: tenant.id });
    setSaving(false);
    setShowForm(false);
    setForm({ org_name: "", org_type: "", federal_state: "", contact_person: "", phone: "", email: "", address: "", notes: "", is_primary: false });
    refetch();
  }

  async function handleDelete(id) {
    if (!confirm("Kontakt wirklich löschen?")) return;
    await base44.entities.WolfContact.delete(id);
    refetch();
  }

  const filtered = contacts.filter(c => {
    const stateOk = filterState === "all" || c.federal_state === filterState;
    const typeOk = filterType === "all" || c.org_type === filterType;
    return stateOk && typeOk;
  });

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: "#1e1e1e" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl" style={{ background: "#2d5a27" }}>
            <span className="text-2xl">📞</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Behörden-Adressbuch</h1>
            <p className="text-gray-400 text-sm">WolfTrack Kontakte · Behörden · Labore · Gutachter</p>
          </div>
          <div className="ml-auto flex gap-2">
            {contacts.length === 0 && !seeded && (
              <Button variant="outline" onClick={seedDefaults} className="text-sm">📋 Standard-Kontakte laden</Button>
            )}
            <Button onClick={() => setShowForm(true)}>+ Kontakt</Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Bundesland" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Bundesländer</SelectItem>
              {FEDERAL_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Typ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              {ORG_TYPES.map(t => <SelectItem key={t} value={t}>{TYPE_ICONS[t]} {t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📞</div>
            <div className="text-lg">Keine Kontakte gefunden</div>
            {contacts.length === 0 && <Button className="mt-4" onClick={seedDefaults}>📋 Standard-Kontakte laden</Button>}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <div key={c.id} className="p-4 rounded-xl" style={{ background: "#2a2a2a", border: c.is_primary ? "1px solid #22c55e" : "1px solid #3a3a3a" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl">{TYPE_ICONS[c.org_type] || "🏢"}</span>
                      <span className="font-bold text-white">{c.org_name}</span>
                      {c.is_primary && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#22c55e33", color: "#22c55e" }}>★ Primär</span>}
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#374151", color: "#9ca3af" }}>{c.org_type}</span>
                      {c.federal_state && <span className="text-xs text-gray-400">{c.federal_state}</span>}
                    </div>
                    {c.contact_person && <div className="text-sm text-gray-300 mt-1">👤 {c.contact_person}</div>}
                    <div className="flex gap-3 mt-2 flex-wrap">
                      {c.phone && <a href={`tel:${c.phone}`} className="text-blue-400 text-sm hover:underline">📞 {c.phone}</a>}
                      {c.email && <a href={`mailto:${c.email}`} className="text-blue-400 text-sm hover:underline">✉️ {c.email}</a>}
                    </div>
                    {c.address && <div className="text-xs text-gray-500 mt-1">📍 {c.address}</div>}
                    {c.notes && <div className="text-xs text-gray-400 mt-1 italic">{c.notes}</div>}
                  </div>
                  <button onClick={() => handleDelete(c.id)} className="text-gray-600 hover:text-red-400 text-lg transition-colors">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg" style={{ background: "#2a2a2a", border: "1px solid #3a3a3a" }}>
          <DialogHeader><DialogTitle>+ Neuer Kontakt</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Organisation *</Label>
              <Input value={form.org_name} onChange={e => setForm(f => ({ ...f, org_name: e.target.value }))} placeholder="Organisationsname" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Typ *</Label>
                <Select value={form.org_type} onValueChange={v => setForm(f => ({ ...f, org_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Typ wählen" /></SelectTrigger>
                  <SelectContent>{ORG_TYPES.map(t => <SelectItem key={t} value={t}>{TYPE_ICONS[t]} {t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bundesland</Label>
                <Select value={form.federal_state} onValueChange={v => setForm(f => ({ ...f, federal_state: v }))}>
                  <SelectTrigger><SelectValue placeholder="Bundesland" /></SelectTrigger>
                  <SelectContent>{FEDERAL_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Ansprechpartner</Label><Input value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="Name" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Telefon</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+49 ..." /></div>
              <div><Label>E-Mail</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="mail@..." /></div>
            </div>
            <div><Label>Adresse</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Straße, PLZ Ort" /></div>
            <div><Label>Notizen</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_primary} onChange={e => setForm(f => ({ ...f, is_primary: e.target.checked }))} className="accent-green-500 w-4 h-4" />
              <span className="text-sm text-gray-300">Als Primärkontakt markieren</span>
            </label>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Abbrechen</Button>
              <Button onClick={handleSave} disabled={saving || !form.org_name || !form.org_type} className="flex-1">{saving ? "..." : "Speichern"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}