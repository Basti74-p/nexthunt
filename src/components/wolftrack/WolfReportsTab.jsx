import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const STATUS_COLORS = { Entwurf: "#6b7280", Fertig: "#3b82f6", Eingereicht: "#f59e0b", Bestätigt: "#22c55e" };

function generateReportPDF(report, contacts = []) {
  const w = window.open("", "_blank");
  const primaryContact = contacts.find(c => c.is_primary) || contacts[0];
  w.document.write(`
    <html><head><title>WolfTrack Bericht ${report.period_from} – ${report.period_to}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:30px;color:#000;max-width:800px;margin:0 auto}
      h1{font-size:20px;color:#2d5a27}h2{font-size:15px;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:20px}
      table{border-collapse:collapse;width:100%;margin-top:8px}
      td,th{border:1px solid #ccc;padding:6px 10px;font-size:12px}th{background:#f0f0f0}
      .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold}
      .footer{margin-top:40px;font-size:10px;color:#666;border-top:1px solid #ccc;padding-top:8px}
    </style></head><body>
    <h1>🐺 WolfTrack ${report.report_type}</h1>
    <p><strong>Zeitraum:</strong> ${report.period_from} bis ${report.period_to}</p>
    <p><strong>Revier:</strong> ${report.revier_name || "—"} | <strong>Erstellt von:</strong> ${report.author_name || "—"}</p>
    <p><strong>Datum:</strong> ${new Date().toLocaleDateString("de")}</p>
    
    <h2>📊 Zusammenfassung</h2>
    <table>
      <tr><th>Kategorie</th><th>Anzahl</th></tr>
      <tr><td>Wildtiersichtungen</td><td>${report.sightings_count || 0}</td></tr>
      <tr><td>Nutztierrisse</td><td>${report.riss_count || 0}</td></tr>
      <tr><td>Proben gesammelt</td><td>${report.samples_count || 0}</td></tr>
      <tr><td>Proben eingeschickt</td><td>${report.samples_sent_count || 0}</td></tr>
      <tr><td>Jagdeinträge</td><td>${report.hunt_entries_count || 0}</td></tr>
    </table>

    ${report.summary ? `<h2>📝 Zusammenfassung</h2><p>${report.summary}</p>` : ""}
    ${report.recommendations ? `<h2>💡 Empfehlungen</h2><p>${report.recommendations}</p>` : ""}
    ${primaryContact ? `<h2>📬 Eingereicht an</h2><p>${primaryContact.org_name}<br>${primaryContact.contact_person || ""}<br>${primaryContact.email || ""}</p>` : ""}
    
    <div class="footer">Erstellt mit NextHunt WolfTrack | entspricht DBBW-Monitoringstandards | ${new Date().toLocaleDateString("de")}</div>
    </body></html>`);
  w.document.close();
  w.print();
}

export default function WolfReportsTab({ reports = [], sightings = [], risse = [], samples = [], hunts = [], contacts = [], tenantId, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    report_type: "Monatsbericht",
    period_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    period_to: new Date().toISOString().split("T")[0],
    revier_name: "", author_name: "", summary: "", recommendations: "",
    submitted_to: ""
  });

  function autoCount() {
    const from = new Date(form.period_from);
    const to = new Date(form.period_to);
    const inRange = arr => (arr || []).filter(i => {
      const d = new Date(i.incident_date || i.sighting_date || i.hunt_date || i.collection_date || i.created_date);
      return d >= from && d <= to;
    }).length;
    return {
      sightings_count: inRange(sightings),
      riss_count: inRange(risse),
      samples_count: inRange(samples),
      samples_sent_count: (samples || []).filter(s => s.sent_to_lab).length,
      hunt_entries_count: inRange(hunts),
    };
  }

  async function handleSave() {
    setSaving(true);
    const counts = autoCount();
    await base44.entities.WolfReport.create({ ...form, ...counts, tenant_id: tenantId, status: "Entwurf" });
    setSaving(false);
    setShowForm(false);
    onRefresh?.();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-bold text-lg">📊 Monitoringberichte</span>
        <Button onClick={() => setShowForm(true)}>📊 Bericht generieren</Button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <div>Noch keine Berichte erstellt</div>
          <div className="text-sm mt-1">Erstellen Sie Monats- oder Jahresberichte für Behörden</div>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="p-3 rounded-xl" style={{ background: "#2a2a2a", border: "1px solid #3a3a3a" }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">{r.report_type}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: STATUS_COLORS[r.status] + "33", color: STATUS_COLORS[r.status] }}>{r.status}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{r.period_from} – {r.period_to} · {r.author_name}</div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="text-center p-1 rounded" style={{ background: "#1a2e1a" }}>
                      <div className="font-bold text-green-400">{r.sightings_count}</div>
                      <div className="text-xs text-gray-400">Sichtungen</div>
                    </div>
                    <div className="text-center p-1 rounded" style={{ background: "#2a1a1a" }}>
                      <div className="font-bold text-red-400">{r.riss_count}</div>
                      <div className="text-xs text-gray-400">Risse</div>
                    </div>
                    <div className="text-center p-1 rounded" style={{ background: "#1a1a2e" }}>
                      <div className="font-bold text-purple-400">{r.samples_count}</div>
                      <div className="text-xs text-gray-400">Proben</div>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => generateReportPDF(r, contacts)} className="text-xs ml-2">🖨️ PDF</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg" style={{ background: "#2a2a2a", border: "1px solid #3a3a3a" }}>
          <DialogHeader><DialogTitle>📊 Neuen Bericht erstellen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Berichtstyp</Label>
                <Select value={form.report_type} onValueChange={v => setForm(f => ({ ...f, report_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Monatsbericht", "Quartalsbericht", "Jahresbericht"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Revier</Label>
                <Input value={form.revier_name} onChange={e => setForm(f => ({ ...f, revier_name: e.target.value }))} placeholder="Reviername" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Von</Label><Input type="date" value={form.period_from} onChange={e => setForm(f => ({ ...f, period_from: e.target.value }))} /></div>
              <div><Label>Bis</Label><Input type="date" value={form.period_to} onChange={e => setForm(f => ({ ...f, period_to: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Autor</Label>
              <Input value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} placeholder="Name Berichterstatter" />
            </div>
            <div className="p-2 rounded text-xs" style={{ background: "#1a1a1a" }}>
              <div className="text-gray-400 mb-1">Automatisch gezählte Einträge im Zeitraum:</div>
              {(() => { const c = autoCount(); return (
                <div className="grid grid-cols-2 gap-1 text-gray-300">
                  <span>Sichtungen: <strong>{c.sightings_count}</strong></span>
                  <span>Risse: <strong>{c.riss_count}</strong></span>
                  <span>Proben: <strong>{c.samples_count}</strong></span>
                  <span>Jagd: <strong>{c.hunt_entries_count}</strong></span>
                </div>
              );})()}
            </div>
            <div>
              <Label>Zusammenfassung</Label>
              <Textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Beschreibung der Wolfssituation im Zeitraum..." rows={3} />
            </div>
            <div>
              <Label>Empfehlungen</Label>
              <Textarea value={form.recommendations} onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} placeholder="Handlungsempfehlungen..." rows={2} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Abbrechen</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">{saving ? "..." : "Erstellen"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}