import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_STEPS = ["Gesammelt", "Verpackt", "An Labor gesendet", "Im Labor", "Ergebnis erhalten", "An Behörde übermittelt", "Abgeschlossen"];
const STATUS_COLORS = ["#6b7280", "#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#06b6d4", "#10b981"];

const SAMPLE_HINTS = {
  "Kotprobe/Losung": "Frische Losung, äußere Schicht mit sterilem Stäbchen abstreichen. KEIN Plastik! Papiertüte verwenden.",
  "Haarprobe": "Mind. 10 Haare MIT Wurzel. Mit Pinzette greifen, nicht berühren. In Papiertüte.",
  "Speichelprobe Riss": "Steriles Wattestäbchen in frische Bisswunde drücken. Sofort in Ethanol 96% einlegen.",
  "Blutprobe": "Frisches Blut vom Tatort mit sterilem Tupfer aufnehmen. Gefrieren wenn möglich.",
  "Gewebeprobe Totfund": "Muskelgewebe, erbsgroß, aus Innenseite. In Ethanol 96% oder gefrieren.",
  "Haarprobe": "Mind. 10 Haare mit Wurzel, möglichst frisch. Papiertüte.",
  "Urinprobe": "Frischer Urin aus Schnee/Boden mit Pipette. In Kunststoffgefäß gefrieren.",
  "Knochenprobe": "Kleines Knochenstück ohne Gelenk. Trocken einpacken.",
  "Sonstiges": "Bitte Typ und Zustand in den Notizen beschreiben.",
};

const SAMPLE_ICONS = {
  "Kotprobe/Losung": "💩", "Haarprobe": "💇", "Blutprobe": "🩸",
  "Speichelprobe Riss": "🦷", "Urinprobe": "🧪", "Gewebeprobe Totfund": "🔬",
  "Knochenprobe": "🦴", "Sonstiges": "📦"
};

function SampleProgressBar({ status }) {
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex gap-0.5 mt-1">
      {STATUS_STEPS.map((s, i) => (
        <div key={s} title={s}
          className="flex-1 h-1.5 rounded-full transition-all"
          style={{ background: i <= idx ? STATUS_COLORS[i] : "#374151" }} />
      ))}
    </div>
  );
}

function ResultBlock({ sample }) {
  if (!sample.result_received) return null;
  return (
    <div className="mt-2 p-2 rounded-lg" style={{ background: "#1a2e1a", border: "1px solid #2d5a27" }}>
      <div className="text-xs font-bold text-green-400 mb-1">🧬 Genetik-Ergebnis</div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <span className="text-gray-400">Wolf bestätigt:</span>
        <span>{sample.result_species_confirmed ? "✅ Ja" : "❌ Nein"}</span>
        <span className="text-gray-400">Hybrid:</span>
        <span>{sample.result_hybrid ? "⚠️ Ja" : "✅ Nein"}</span>
        {sample.result_individual_id && <><span className="text-gray-400">Individuum:</span><span className="font-bold text-yellow-400">{sample.result_individual_id}</span></>}
        {sample.result_haplotype && <><span className="text-gray-400">Haplotyp:</span><span className="font-bold">{sample.result_haplotype}</span></>}
        {sample.result_sex && <><span className="text-gray-400">Geschlecht:</span><span>{sample.result_sex}</span></>}
      </div>
      {sample.result_notes && <p className="text-xs text-gray-300 mt-1">{sample.result_notes}</p>}
    </div>
  );
}

function VersandModal({ sample, onClose, onSave }) {
  const [tracking, setTracking] = useState(sample?.tracking_number || "");
  const [checked, setChecked] = useState({ a: false, b: false, c: false, d: false });
  const allChecked = Object.values(checked).every(Boolean);

  function printBegleitformular() {
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>Begleitformular WolfSample</title>
      <style>body{font-family:Arial,sans-serif;padding:30px;color:#000}h1{font-size:18px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #000;padding:8px;font-size:12px}.addr{font-size:14px;font-weight:bold;margin:20px 0;padding:15px;border:2px solid #000}</style>
      </head><body>
      <h1>Probeneinsendungsformular – Wolfsgenetik</h1>
      <div class="addr">
        <strong>EMPFÄNGER:</strong><br>
        Senckenberg Zentrum für Wildtiergenetik<br>
        Leipziger Str. 44<br>
        63571 Gelnhausen<br>
        Tel: +49 6051 61954-0<br>
        wildtiergenetik@senckenberg.de
      </div>
      <table>
        <tr><th>Proben-ID</th><td>${sample.sample_id || "—"}</td></tr>
        <tr><th>Probentyp</th><td>${sample.sample_type || "—"}</td></tr>
        <tr><th>Entnahmedatum</th><td>${sample.collection_date ? new Date(sample.collection_date).toLocaleDateString("de") : "—"}</td></tr>
        <tr><th>Entnahmeort</th><td>${sample.location_name || "—"}</td></tr>
        <tr><th>Zustand</th><td>${sample.sample_condition || "—"}</td></tr>
        <tr><th>Lagerung</th><td>${sample.storage_method || "—"}</td></tr>
        <tr><th>Einschicker</th><td>${sample.collector_name || "—"} (${sample.collector_role || "—"})</td></tr>
      </table>
      <p style="margin-top:30px;font-size:11px">Erstellt mit NextHunt WolfTrack | DBBW-Monitoringstandards</p>
      </body></html>`);
    w.document.close(); w.print();
  }

  async function handleSave() {
    await base44.entities.WolfSample.update(sample.id, {
      sent_to_lab: true,
      sent_date: new Date().toISOString().split("T")[0],
      tracking_number: tracking,
      status: "An Labor gesendet"
    });
    onSave();
  }

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg" style={{ background: "#1a1a2e", border: "1px solid #3b4a8b" }}>
        <div className="font-bold text-sm text-blue-300 mb-2">📦 Versandcheckliste</div>
        {[
          { k: "a", l: "Probe in Papiertüte (kein Plastik)" },
          { k: "b", l: `Proben-ID außen: ${sample?.sample_id || "?"}` },
          { k: "c", l: "Begleitformular ausgefüllt" },
          { k: "d", l: "Paket gepolstert & gekühltes Kühlmittel" }
        ].map(item => (
          <label key={item.k} className="flex items-center gap-2 py-1.5 cursor-pointer">
            <input type="checkbox" checked={checked[item.k]} onChange={e => setChecked(c => ({ ...c, [item.k]: e.target.checked }))}
              className="w-4 h-4 accent-green-500" />
            <span className="text-sm text-gray-200">{item.l}</span>
          </label>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={printBegleitformular} className="w-full">🖨️ Begleitformular drucken</Button>
      <div>
        <Label className="text-sm">Paketnummer / Sendungsverfolgung</Label>
        <Input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="z.B. DE123456789" className="mt-1" />
      </div>
      <div className="text-xs text-gray-400 p-2 rounded" style={{ background: "#1a2e1a" }}>
        📮 <strong>Senckenberg Zentrum für Wildtiergenetik</strong><br />
        Leipziger Str. 44, 63571 Gelnhausen<br />
        wildtiergenetik@senckenberg.de
      </div>
      <Button onClick={handleSave} disabled={!allChecked} className="w-full">
        ✅ Als versendet markieren
      </Button>
      {!allChecked && <p className="text-xs text-red-400 text-center">Bitte alle Punkte der Checkliste abhaken</p>}
    </div>
  );
}

function AnleitungModal() {
  return (
    <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-2">
      <div className="p-3 rounded-lg" style={{ background: "#1a2e1a", border: "1px solid #2d5a27" }}>
        <div className="font-bold text-green-400 mb-1">📋 DBBW-Standard Probenprotokoll</div>
        <p className="text-xs text-gray-300">Dokumentations- und Bewertungssystem für den Wolfsnachweis in Deutschland</p>
      </div>
      {Object.entries(SAMPLE_HINTS).map(([type, hint]) => (
        <div key={type} className="p-3 rounded-lg" style={{ background: "#2a2a2a" }}>
          <div className="font-semibold text-white">{SAMPLE_ICONS[type]} {type}</div>
          <p className="text-gray-300 text-xs mt-1">{hint}</p>
        </div>
      ))}
      <div className="p-3 rounded-lg" style={{ background: "#2a1a1a", border: "1px solid #8B0000" }}>
        <div className="font-bold text-red-400 mb-1">⚠️ Allgemeine Hinweise</div>
        <ul className="text-xs text-gray-300 space-y-1 list-disc ml-4">
          <li>Immer Einweghandschuhe tragen</li>
          <li>Proben sofort beschriften (Proben-ID + Datum)</li>
          <li>Nicht in direktem Sonnenlicht lagern</li>
          <li>So schnell wie möglich einsenden (max. 48h bei Raumtemperatur)</li>
          <li>Bei Totfunden: Behörde informieren BEVOR Probe entnommen wird</li>
        </ul>
      </div>
    </div>
  );
}

export default function WolfSamplesTab({ samples = [], tenantId, onRefresh }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showVersand, setShowVersand] = useState(null);
  const [showAnleitung, setShowAnleitung] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sample_type: "", collection_date: new Date().toISOString().slice(0, 16),
    collector_name: "", collector_role: "Jäger",
    location_name: "", location_description: "",
    sample_condition: "", storage_method: "",
    lab_name: "Senckenberg Zentrum für Wildtiergenetik Gelnhausen",
    notes: ""
  });

  async function generateSampleId() {
    const year = new Date().getFullYear();
    const existing = samples.filter(s => s.sample_id?.startsWith(`WP-${year}-`));
    const maxN = existing.reduce((m, s) => {
      const n = parseInt(s.sample_id?.split("-")[2] || "0");
      return Math.max(m, n);
    }, 0);
    return `WP-${year}-${String(maxN + 1).padStart(4, "0")}`;
  }

  async function handleSave() {
    if (!form.sample_type || !form.collection_date) return;
    setSaving(true);
    const sample_id = await generateSampleId();
    await base44.entities.WolfSample.create({ ...form, tenant_id: tenantId, sample_id, status: "Gesammelt" });
    setSaving(false);
    setShowForm(false);
    setForm(f => ({ ...f, sample_type: "", location_name: "", collector_name: "" }));
    onRefresh?.();
  }

  function copyId(id) {
    navigator.clipboard?.writeText(id);
  }

  async function updateStatus(sample, status) {
    await base44.entities.WolfSample.update(sample.id, { status });
    onRefresh?.();
  }

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="p-3 rounded-xl flex items-start gap-3" style={{ background: "#1a1a2e", border: "1px solid #3b4a8b" }}>
        <span className="text-2xl">🧪</span>
        <div>
          <div className="font-bold text-blue-300 text-sm">DBBW-Standard Probenmanagement</div>
          <div className="text-xs text-gray-300">Proben werden nach DBBW-Standard gesammelt und an <strong>Senckenberg Wildtiergenetik Gelnhausen</strong> eingeschickt</div>
        </div>
      </div>

      {/* Action row */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setShowForm(true)} className="flex-1 min-w-[140px]">+ Neue Probe</Button>
        <Button variant="outline" onClick={() => setShowAnleitung(true)} className="flex-1 min-w-[140px]">❓ Proben-Anleitung</Button>
      </div>

      {/* List */}
      {samples.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">🧪</div>
          <div>Noch keine Proben erfasst</div>
        </div>
      ) : (
        <div className="space-y-3">
          {samples.map(s => (
            <div key={s.id} className="p-3 rounded-xl" style={{ background: "#2a2a2a", border: "1px solid #3a3a3a" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl">{SAMPLE_ICONS[s.sample_type] || "📦"}</span>
                    <button onClick={() => copyId(s.sample_id)}
                      className="font-mono font-bold text-yellow-400 text-base hover:text-yellow-300 transition-colors"
                      title="Kopieren">
                      {s.sample_id || "—"} 📋
                    </button>
                    <span className="text-xs text-gray-400">{s.sample_type}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {s.collector_name && `${s.collector_name} · `}
                    {s.collection_date && new Date(s.collection_date).toLocaleDateString("de")}
                    {s.location_name && ` · ${s.location_name}`}
                  </div>
                  <div className="text-xs mt-0.5">
                    <span className="text-gray-400">Zustand: </span>
                    <span className="text-gray-200">{s.sample_condition || "—"}</span>
                    {s.sent_to_lab && <span className="ml-2 text-blue-400">📦 Labor: {s.lab_name?.split(" ")[0]}</span>}
                  </div>
                  <SampleProgressBar status={s.status} />
                  <div className="text-xs text-gray-500 mt-0.5">{s.status}</div>
                  <ResultBlock sample={s} />
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {!s.sent_to_lab && s.status === "Verpackt" && (
                    <Button size="sm" variant="outline" onClick={() => setShowVersand(s)} className="text-xs">📮 An Senckenberg</Button>
                  )}
                  {s.status === "Gesammelt" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(s, "Verpackt")} className="text-xs">✅ Verpackt</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: "#2a2a2a", border: "1px solid #3a3a3a" }}>
          <DialogHeader><DialogTitle>🧪 Neue Probe erfassen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Probentyp *</Label>
              <Select value={form.sample_type} onValueChange={v => setForm(f => ({ ...f, sample_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Typ wählen" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(SAMPLE_ICONS).map(t => (
                    <SelectItem key={t} value={t}>{SAMPLE_ICONS[t]} {t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.sample_type && (
                <div className="mt-1 p-2 rounded text-xs text-green-300" style={{ background: "#1a2e1a" }}>
                  💡 {SAMPLE_HINTS[form.sample_type]}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Entnahmedatum *</Label>
                <Input type="datetime-local" value={form.collection_date} onChange={e => setForm(f => ({ ...f, collection_date: e.target.value }))} />
              </div>
              <div>
                <Label>Rolle Sammler</Label>
                <Select value={form.collector_role} onValueChange={v => setForm(f => ({ ...f, collector_role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Jäger", "Wolfsberater", "Behördenmitarbeiter", "Wissenschaftler"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Sammler Name</Label>
              <Input value={form.collector_name} onChange={e => setForm(f => ({ ...f, collector_name: e.target.value }))} placeholder="Vorname Nachname" />
            </div>
            <div>
              <Label>Fundort</Label>
              <Input value={form.location_name} onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))} placeholder="Ortsname / Flurname" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Probenzustand</Label>
                <Select value={form.sample_condition} onValueChange={v => setForm(f => ({ ...f, sample_condition: v }))}>
                  <SelectTrigger><SelectValue placeholder="Zustand" /></SelectTrigger>
                  <SelectContent>
                    {["Frisch unter 24h", "Gut 1-3 Tage", "Mittel 3-7 Tage", "Alt über 7 Tage"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lagerung</Label>
                <Select value={form.storage_method} onValueChange={v => setForm(f => ({ ...f, storage_method: v }))}>
                  <SelectTrigger><SelectValue placeholder="Lagerung" /></SelectTrigger>
                  <SelectContent>
                    {["Trocken in Papier", "Gefrostet", "In Ethanol 96%", "In DMSO-Puffer"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Abbrechen</Button>
              <Button onClick={handleSave} disabled={saving || !form.sample_type} className="flex-1">
                {saving ? "Speichern..." : "Probe speichern"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Versand Modal */}
      <Dialog open={!!showVersand} onOpenChange={() => setShowVersand(null)}>
        <DialogContent style={{ background: "#2a2a2a", border: "1px solid #3a3a3a" }}>
          <DialogHeader><DialogTitle>📮 An Senckenberg senden</DialogTitle></DialogHeader>
          {showVersand && <VersandModal sample={showVersand} onClose={() => setShowVersand(null)} onSave={() => { setShowVersand(null); onRefresh?.(); }} />}
        </DialogContent>
      </Dialog>

      {/* Anleitung Modal */}
      <Dialog open={showAnleitung} onOpenChange={setShowAnleitung}>
        <DialogContent className="max-w-lg" style={{ background: "#2a2a2a", border: "1px solid #3a3a3a" }}>
          <DialogHeader><DialogTitle>❓ Proben-Anleitung (DBBW-Standard)</DialogTitle></DialogHeader>
          <AnleitungModal />
        </DialogContent>
      </Dialog>
    </div>
  );
}