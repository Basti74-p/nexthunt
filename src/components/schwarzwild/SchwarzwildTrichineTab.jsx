import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, AlertTriangle } from "lucide-react";

const INPUT = "w-full bg-[#111] border border-[#2a2a2a] text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#22c55e] text-sm";
const LABEL = "block text-xs text-gray-500 mb-1";

const ERGEBNIS_CONFIG = {
  ausstehend: { icon: "🟡", label: "Ausstehend", color: "text-yellow-400" },
  negativ: { icon: "🟢", label: "Negativ – freigegeben", color: "text-green-400" },
  positiv: { icon: "🔴", label: "Positiv – GESPERRT", color: "text-red-400" },
  nicht_untersucht: { icon: "⚫", label: "Nicht untersucht", color: "text-gray-500" },
};

const emptyForm = () => ({ datum_erlegung: new Date().toISOString().slice(0, 10), wildart: "Wildschwein", altersklasse: "Frischling", geschlecht: "unbekannt", gewicht_kg: "", ergebnis: "ausstehend", probe_entnommen: false, untersuchungsstelle: "", notizen: "" });

export default function SchwarzwildTrichineTab({ tenant, isPro }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const { data: protokolle = [] } = useQuery({ queryKey: ["trichinen", tenant?.id], queryFn: () => base44.entities.Trichinenprotokoll.filter({ tenant_id: tenant.id }), enabled: !!tenant?.id });
  const { data: reviere = [] } = useQuery({ queryKey: ["reviere", tenant?.id], queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant.id }), enabled: !!tenant?.id });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Trichinenprotokoll.create({ ...data, tenant_id: tenant.id, revier_id: reviere[0]?.id || "" }),
    onSuccess: () => { qc.invalidateQueries(["trichinen", tenant?.id]); setShowForm(false); setForm(emptyForm()); }
  });

  const sorted = [...protokolle].sort((a, b) => new Date(b.datum_erlegung) - new Date(a.datum_erlegung));

  return (
    <div>
      {/* Pflichthinweis */}
      <div className="bg-[#1a0a0a] border border-red-800/50 rounded-xl px-4 py-3 mb-5 flex gap-3">
        <span className="text-lg shrink-0">🔬</span>
        <p className="text-xs text-red-300 leading-relaxed">
          <strong>Bei jedem erlegten Wildschwein und Dachs ist eine Trichinenuntersuchung gesetzlich Pflicht</strong> — unabhängig vom Bundesland! Kein Stück darf ohne negatives Ergebnis verwertet werden. <em>(§ 6 Tier-LMHV + EU-VO 2015/1375)</em>
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">{protokolle.length} Protokoll{protokolle.length !== 1 ? "e" : ""}</p>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-2 bg-[#22c55e] text-black font-semibold rounded-xl text-sm hover:bg-[#16a34a]">
          <Plus className="w-4 h-4" /> Protokoll
        </button>
      </div>

      {showForm && (
        <div className="bg-[#1a1a1a] border border-[#22c55e]/40 rounded-2xl p-4 mb-4">
          <p className="text-sm font-semibold text-gray-200 mb-4">Trichinenprotokoll anlegen</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LABEL}>Erlegungsdatum</label><input type="date" className={INPUT} value={form.datum_erlegung} onChange={e => setForm(p => ({ ...p, datum_erlegung: e.target.value }))} /></div>
              <div>
                <label className={LABEL}>Wildart</label>
                <select className={INPUT} value={form.wildart} onChange={e => setForm(p => ({ ...p, wildart: e.target.value }))}>
                  <option>Wildschwein</option><option>Dachs</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Altersklasse</label>
                <select className={INPUT} value={form.altersklasse} onChange={e => setForm(p => ({ ...p, altersklasse: e.target.value }))}>
                  {["Frischling","Überläufer","2-jährig","3-jährig","Angehendes Schwein"].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Geschlecht</label>
                <select className={INPUT} value={form.geschlecht} onChange={e => setForm(p => ({ ...p, geschlecht: e.target.value }))}>
                  <option value="männlich">Männlich</option><option value="weiblich">Weiblich</option><option value="unbekannt">Unbekannt</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LABEL}>Gewicht (kg)</label><input type="number" className={INPUT} value={form.gewicht_kg} onChange={e => setForm(p => ({ ...p, gewicht_kg: e.target.value }))} /></div>
              <div>
                <label className={LABEL}>Wildmarkennummer {!isPro && <span className="text-gray-600">(🔒 ab PRO)</span>}</label>
                <input className={INPUT} disabled={!isPro} value={form.wildmarken_nummer || ""} onChange={e => setForm(p => ({ ...p, wildmarken_nummer: e.target.value }))} placeholder={isPro ? "NH-XXXXX" : "Nur PRO/Enterprise"} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.probe_entnommen} onChange={e => setForm(p => ({ ...p, probe_entnommen: e.target.checked }))} className="w-4 h-4 accent-[#22c55e]" />
                Probe entnommen
              </label>
            </div>
            <div><label className={LABEL}>Untersuchungsstelle</label><input className={INPUT} value={form.untersuchungsstelle} onChange={e => setForm(p => ({ ...p, untersuchungsstelle: e.target.value }))} placeholder="z.B. Tiergesundheitsamt München" /></div>
            <div>
              <label className={LABEL}>Ergebnis</label>
              <select className={INPUT} value={form.ergebnis} onChange={e => setForm(p => ({ ...p, ergebnis: e.target.value }))}>
                {Object.entries(ERGEBNIS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            {form.ergebnis === "positiv" && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-400">🚨 Positiver Trichinenbefund!</p>
                  <p className="text-xs text-red-300 mt-1">Das Fleisch darf NICHT verwertet werden. Melde dies sofort dem zuständigen Veterinäramt!</p>
                  <a href="tel:110" className="mt-2 inline-block text-xs px-3 py-1.5 bg-red-700 text-white rounded-lg">Veterinäramt kontaktieren</a>
                </div>
              </div>
            )}
            <div><label className={LABEL}>Notizen</label><textarea className={INPUT} rows={2} value={form.notizen} onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))} /></div>
            <div className="flex gap-2">
              <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="flex-1 py-2.5 bg-[#22c55e] text-black font-semibold rounded-xl text-sm hover:bg-[#16a34a] disabled:opacity-50">{createMutation.isPending ? "Speichern..." : "Protokoll speichern"}</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-[#2a2a2a] text-gray-300 rounded-xl text-sm">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sorted.length === 0 && <div className="text-center py-12 text-gray-600 text-sm">Noch keine Protokolle.</div>}
        {sorted.map(p => {
          const cfg = ERGEBNIS_CONFIG[p.ergebnis] || ERGEBNIS_CONFIG.ausstehend;
          return (
            <div key={p.id} className={`bg-[#1a1a1a] border rounded-xl px-4 py-3 ${p.ergebnis === "positiv" ? "border-red-800/50" : "border-[#2a2a2a]"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{cfg.icon}</span>
                    <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{new Date(p.datum_erlegung).toLocaleDateString("de-DE")}</span>
                    <span>{p.wildart}</span>
                    <span>{p.altersklasse}</span>
                    {p.gewicht_kg && <span>{p.gewicht_kg} kg</span>}
                  </div>
                </div>
                {p.probe_entnommen && <span className="text-xs px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded-full">Probe entnommen</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}