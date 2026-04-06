import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, MapPin, Phone } from "lucide-react";

const INPUT = "w-full bg-[#111] border border-[#2a2a2a] text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#22c55e] text-sm";
const LABEL = "block text-xs text-gray-500 mb-1";
const STATUS_STYLES = {
  offen: { bg: "bg-red-900/30", text: "text-red-400", label: "Offen" },
  gemeldet: { bg: "bg-orange-900/30", text: "text-orange-400", label: "Gemeldet" },
  in_bearbeitung: { bg: "bg-yellow-900/30", text: "text-yellow-400", label: "In Bearbeitung" },
  reguliert: { bg: "bg-green-900/30", text: "text-green-400", label: "Reguliert" },
  abgeschlossen: { bg: "bg-gray-800", text: "text-gray-500", label: "Abgeschlossen" },
};

const emptyForm = () => ({ datum: new Date().toISOString().slice(0, 10), schadensart: "Umbruch", flaeche_qm: "", schadenshoehe_euro: "", landwirt_name: "", landwirt_kontakt: "", ort_lat: "", ort_lng: "", ort_beschreibung: "", status: "offen", notizen: "" });

export default function SchwarzwildSchadenTab({ tenant, openForm, onFormClose }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());

  useEffect(() => { if (openForm) { setShowForm(true); onFormClose(); } }, [openForm]);

  const { data: schaeden = [] } = useQuery({ queryKey: ["schwarzwild_schaeden", tenant?.id], queryFn: () => base44.entities.SchwarzwildSchaden.filter({ tenant_id: tenant.id }), enabled: !!tenant?.id });
  const { data: reviere = [] } = useQuery({ queryKey: ["reviere", tenant?.id], queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant.id }), enabled: !!tenant?.id });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SchwarzwildSchaden.create({
      ...data,
      tenant_id: tenant.id, revier_id: reviere[0]?.id || "",
      flaeche_ha: data.flaeche_qm ? (Number(data.flaeche_qm) / 10000).toFixed(4) : undefined
    }),
    onSuccess: () => { qc.invalidateQueries(["schwarzwild_schaeden", tenant?.id]); setShowForm(false); setForm(emptyForm()); }
  });

  const getLocation = () => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setForm(p => ({ ...p, ort_lat: pos.coords.latitude.toFixed(6), ort_lng: pos.coords.longitude.toFixed(6) }));
    });
  };

  const sorted = [...schaeden].sort((a, b) => new Date(b.datum) - new Date(a.datum));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">{schaeden.length} Schaden/Schäden</p>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white font-semibold rounded-xl text-sm hover:bg-orange-700">
          <Plus className="w-4 h-4" /> Schaden
        </button>
      </div>

      {showForm && (
        <div className="bg-[#1a1a1a] border border-orange-800/40 rounded-2xl p-4 mb-4">
          <p className="text-sm font-semibold text-gray-200 mb-4">Schaden erfassen</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LABEL}>Datum</label><input type="date" className={INPUT} value={form.datum} onChange={e => setForm(p => ({ ...p, datum: e.target.value }))} /></div>
              <div>
                <label className={LABEL}>Schadensart</label>
                <select className={INPUT} value={form.schadensart} onChange={e => setForm(p => ({ ...p, schadensart: e.target.value }))}>
                  {["Umbruch","Mais","Getreide","Wiese/Weide","Wald","Garten","Sonstiges"].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LABEL}>Fläche (m²)</label><input type="number" className={INPUT} value={form.flaeche_qm} onChange={e => setForm(p => ({ ...p, flaeche_qm: e.target.value }))} placeholder="z.B. 500" /></div>
              <div><label className={LABEL}>Schadenshöhe (€)</label><input type="number" className={INPUT} value={form.schadenshoehe_euro} onChange={e => setForm(p => ({ ...p, schadenshoehe_euro: e.target.value }))} /></div>
            </div>
            {form.flaeche_qm && <p className="text-xs text-gray-500">= {(form.flaeche_qm / 10000).toFixed(4)} ha</p>}
            <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-xl px-3 py-2 text-xs text-yellow-400">
              📸 Mindestens 1 Foto empfohlen für die Schadensdokumentation
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LABEL}>Landwirt Name</label><input className={INPUT} value={form.landwirt_name} onChange={e => setForm(p => ({ ...p, landwirt_name: e.target.value }))} /></div>
              <div><label className={LABEL}>Kontakt (Tel./Mail)</label><input className={INPUT} value={form.landwirt_kontakt} onChange={e => setForm(p => ({ ...p, landwirt_kontakt: e.target.value }))} /></div>
            </div>
            <div>
              <label className={LABEL}>Standort</label>
              <div className="flex gap-2">
                <input className={INPUT} placeholder="Breite" value={form.ort_lat} onChange={e => setForm(p => ({ ...p, ort_lat: e.target.value }))} />
                <input className={INPUT} placeholder="Länge" value={form.ort_lng} onChange={e => setForm(p => ({ ...p, ort_lng: e.target.value }))} />
                <button onClick={getLocation} className="px-3 py-2 bg-[#1a1a2a] border border-[#22c55e]/40 text-[#22c55e] rounded-xl"><MapPin className="w-4 h-4" /></button>
              </div>
            </div>
            <div><label className={LABEL}>Beschreibung</label><input className={INPUT} value={form.ort_beschreibung} onChange={e => setForm(p => ({ ...p, ort_beschreibung: e.target.value }))} placeholder="z.B. Maisfeld östlich der Waldkante" /></div>
            <div><label className={LABEL}>Notizen</label><textarea className={INPUT} rows={2} value={form.notizen} onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))} /></div>
            <div className="flex gap-2">
              <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="flex-1 py-2.5 bg-orange-600 text-white font-semibold rounded-xl text-sm hover:bg-orange-700 disabled:opacity-50">{createMutation.isPending ? "Speichern..." : "Schaden speichern"}</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-[#2a2a2a] text-gray-300 rounded-xl text-sm">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sorted.length === 0 && <div className="text-center py-12 text-gray-600 text-sm">Keine Schäden erfasst.</div>}
        {sorted.map(s => {
          const st = STATUS_STYLES[s.status] || STATUS_STYLES.offen;
          return (
            <div key={s.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text}`}>{st.label}</span>
                    <span className="text-xs text-gray-500">{new Date(s.datum).toLocaleDateString("de-DE")}</span>
                    <span className="text-xs font-medium text-gray-300">{s.schadensart}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {s.flaeche_qm && <span>{s.flaeche_qm} m²</span>}
                    {s.schadenshoehe_euro && <span className="text-orange-400 font-semibold">{Number(s.schadenshoehe_euro).toLocaleString("de-DE")} €</span>}
                    {s.landwirt_name && <span>{s.landwirt_name}</span>}
                  </div>
                </div>
                {s.landwirt_kontakt && (
                  <a href={`tel:${s.landwirt_kontakt}`} className="p-2 bg-[#22c55e]/10 rounded-xl text-[#22c55e]">
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}