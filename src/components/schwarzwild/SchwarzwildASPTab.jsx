import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, MapPin, AlertTriangle } from "lucide-react";

const INPUT = "w-full bg-[#111] border border-[#2a2a2a] text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#22c55e] text-sm";
const LABEL = "block text-xs text-gray-500 mb-1";
const STATUS_STYLES = {
  offen: "bg-red-900/30 text-red-400",
  gemeldet: "bg-orange-900/30 text-orange-400",
  beprobt: "bg-yellow-900/30 text-yellow-400",
  abgeschlossen: "bg-gray-800 text-gray-500",
};

const HYGIENE_CHECKS = [
  "Tier nicht berührt",
  "Fundort markiert / GPS erfasst",
  "Hunde angeleint",
  "Veterinäramt informiert",
  "Eigene Kleidung & Schuhe desinfiziert",
  "Revier-Kollegen informiert",
];

const emptyForm = () => ({ datum_fund: new Date().toISOString().slice(0, 10), fund_typ: "Fallwild", wildart: "Wildschwein", anzahl_stueck: 1, zustand: "frisch", ort_lat: "", ort_lng: "", ort_beschreibung: "", veterinaeramt_gemeldet: false, probe_entnommen: false, ergebnis: "ausstehend", status: "offen", massnahmen: "", hygieneChecks: {} });

export default function SchwarzwildASPTab({ tenant, openForm, onFormClose }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());

  useEffect(() => { if (openForm) { setShowForm(true); onFormClose(); } }, [openForm]);

  const { data: meldungen = [] } = useQuery({ queryKey: ["asp_meldungen", tenant?.id], queryFn: () => base44.entities.ASPMeldung.filter({ tenant_id: tenant.id }), enabled: !!tenant?.id });
  const { data: reviere = [] } = useQuery({ queryKey: ["reviere", tenant?.id], queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant.id }), enabled: !!tenant?.id });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const { hygieneChecks, ...rest } = data;
      const allChecked = Object.values(hygieneChecks).filter(Boolean).length === HYGIENE_CHECKS.length;
      return base44.entities.ASPMeldung.create({ ...rest, tenant_id: tenant.id, revier_id: reviere[0]?.id || "", hygieneprotokoll_eingehalten: allChecked });
    },
    onSuccess: () => { qc.invalidateQueries(["asp_meldungen", tenant?.id]); setShowForm(false); setForm(emptyForm()); }
  });

  const getLocation = () => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setForm(p => ({ ...p, ort_lat: pos.coords.latitude.toFixed(6), ort_lng: pos.coords.longitude.toFixed(6) }));
    });
  };

  const offene = meldungen.filter(m => m.status !== "abgeschlossen");
  const sorted = [...meldungen].sort((a, b) => new Date(b.datum_fund) - new Date(a.datum_fund));

  return (
    <div>
      {/* ASP Warnung */}
      <div className="bg-[#1a0a0a] border border-red-700/60 rounded-xl px-4 py-3 mb-5 flex gap-3">
        <span className="text-xl shrink-0">🚨</span>
        <p className="text-xs text-red-300 leading-relaxed">
          <strong>Afrikanische Schweinepest (ASP):</strong> Bei jedem Schwarzwild-Kadaver oder auffällig krankem Tier sofort die untere Veterinärbehörde informieren! Tier <strong>NICHT anfassen</strong> ohne Schutzausrüstung. Handschuhe, Stiefel desinfizieren.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500">Offene Meldungen</p>
          <p className="text-2xl font-bold text-red-400">{offene.length}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500">Gesamt erfasst</p>
          <p className="text-2xl font-bold text-gray-200">{meldungen.length}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">ASP-Meldungen</p>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-2 bg-red-700 text-white font-semibold rounded-xl text-sm hover:bg-red-800">
          <Plus className="w-4 h-4" /> Verdacht melden
        </button>
      </div>

      {showForm && (
        <div className="bg-[#1a0a0a] border border-red-800/50 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-sm font-semibold text-red-300">ASP-Verdacht melden</p>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LABEL}>Funddatum</label><input type="date" className={INPUT} value={form.datum_fund} onChange={e => setForm(p => ({ ...p, datum_fund: e.target.value }))} /></div>
              <div>
                <label className={LABEL}>Fund-Typ</label>
                <select className={INPUT} value={form.fund_typ} onChange={e => setForm(p => ({ ...p, fund_typ: e.target.value }))}>
                  {["Fallwild","Verdachtsfall_lebend","Kadaver","Blutspuren"].map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Zustand</label>
                <select className={INPUT} value={form.zustand} onChange={e => setForm(p => ({ ...p, zustand: e.target.value }))}>
                  <option value="frisch">Frisch</option><option value="verwest">Verwest</option><option value="skelettiert">Skelettiert</option>
                </select>
              </div>
              <div><label className={LABEL}>Anzahl Stück</label><input type="number" min={1} className={INPUT} value={form.anzahl_stueck} onChange={e => setForm(p => ({ ...p, anzahl_stueck: e.target.value }))} /></div>
            </div>
            <div>
              <label className={LABEL}>Standort</label>
              <div className="flex gap-2">
                <input className={INPUT} placeholder="Breite" value={form.ort_lat} onChange={e => setForm(p => ({ ...p, ort_lat: e.target.value }))} />
                <input className={INPUT} placeholder="Länge" value={form.ort_lng} onChange={e => setForm(p => ({ ...p, ort_lng: e.target.value }))} />
                <button onClick={getLocation} className="px-3 py-2 bg-[#1a1a2a] border border-[#22c55e]/40 text-[#22c55e] rounded-xl"><MapPin className="w-4 h-4" /></button>
              </div>
            </div>
            <div><label className={LABEL}>Ortsbeschreibung</label><input className={INPUT} value={form.ort_beschreibung} onChange={e => setForm(p => ({ ...p, ort_beschreibung: e.target.value }))} placeholder="z.B. 200m westlich der Autobahnbrücke" /></div>

            {/* Hygiene Checkliste */}
            <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-400 mb-2">☑️ Hygieneprotokoll-Checkliste</p>
              <div className="space-y-2">
                {HYGIENE_CHECKS.map((item, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={!!form.hygieneChecks[i]} onChange={e => setForm(p => ({ ...p, hygieneChecks: { ...p.hygieneChecks, [i]: e.target.checked } }))} className="w-4 h-4 accent-[#22c55e]" />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.veterinaeramt_gemeldet} onChange={e => setForm(p => ({ ...p, veterinaeramt_gemeldet: e.target.checked }))} className="w-4 h-4 accent-[#22c55e]" />
                Veterinäramt bereits gemeldet
              </label>
            </div>
            <div><label className={LABEL}>Maßnahmen / Notizen</label><textarea className={INPUT} rows={2} value={form.massnahmen} onChange={e => setForm(p => ({ ...p, massnahmen: e.target.value }))} /></div>
            <div className="flex gap-2">
              <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="flex-1 py-2.5 bg-red-700 text-white font-semibold rounded-xl text-sm hover:bg-red-800 disabled:opacity-50">{createMutation.isPending ? "Speichern..." : "Meldung speichern"}</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-[#2a2a2a] text-gray-300 rounded-xl text-sm">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sorted.length === 0 && <div className="text-center py-12 text-gray-600 text-sm">Keine ASP-Meldungen.</div>}
        {sorted.map(m => (
          <div key={m.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[m.status]}`}>{m.status}</span>
                  <span className="text-xs text-gray-400">{m.fund_typ?.replace("_", " ")}</span>
                  <span className="text-xs text-gray-600">{new Date(m.datum_fund).toLocaleDateString("de-DE")}</span>
                </div>
                {m.ort_beschreibung && <p className="text-xs text-gray-500">{m.ort_beschreibung}</p>}
              </div>
              {m.veterinaeramt_gemeldet
                ? <span className="text-xs text-green-400">✓ Gemeldet</span>
                : <span className="text-xs text-red-400">⚠ Nicht gemeldet</span>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}