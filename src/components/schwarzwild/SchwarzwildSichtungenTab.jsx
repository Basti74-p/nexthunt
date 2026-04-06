import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, MapPin } from "lucide-react";

const INPUT = "w-full bg-[#111] border border-[#2a2a2a] text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#22c55e] text-sm";
const LABEL = "block text-xs text-gray-500 mb-1";
const WITTERUNG_ICONS = { klar: "☀️", bewoelkt: "☁️", regen: "🌧️", nebel: "🌫️", schnee: "❄️" };
const VERHALTEN_LABELS = { ruhig: "Ruhig", fluechtig: "Flüchtig", aesend: "Äsend", wuehlend: "Wühlend", aggressiv: "Aggressiv" };

function formatStueckzahl(s) {
  const parts = [];
  if (s.anzahl_frischlinge > 0) parts.push(`${s.anzahl_frischlinge}F`);
  if (s.anzahl_ueberlaeufer > 0) parts.push(`${s.anzahl_ueberlaeufer}Ü`);
  if (s.anzahl_bachen > 0) parts.push(`${s.anzahl_bachen}B`);
  if (s.anzahl_keiler > 0) parts.push(`${s.anzahl_keiler}K`);
  if (s.anzahl_unbekannt > 0) parts.push(`${s.anzahl_unbekannt}?`);
  return parts.join(" / ") || "—";
}

const emptyForm = () => ({
  datum: new Date().toISOString().slice(0, 16),
  rotte_id: "",
  anzahl_frischlinge: 0, anzahl_ueberlaeufer: 0, anzahl_bachen: 0, anzahl_keiler: 0, anzahl_unbekannt: 0,
  leitbache_gesehen: false,
  verhalten: "ruhig", witterung: "klar", wind: "windstill",
  ort_lat: "", ort_lng: "",
  notizen: ""
});

export default function SchwarzwildSichtungenTab({ tenant, openForm, onFormClose }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [filterRotte, setFilterRotte] = useState("");

  useEffect(() => { if (openForm) { setShowForm(true); onFormClose(); } }, [openForm]);

  const { data: sichtungen = [] } = useQuery({ queryKey: ["schwarzwild_sichtungen", tenant?.id], queryFn: () => base44.entities.SchwarzwildSichtung.filter({ tenant_id: tenant.id }), enabled: !!tenant?.id });
  const { data: rotten = [] } = useQuery({ queryKey: ["schwarzwild_rotten", tenant?.id], queryFn: () => base44.entities.SchwarzwildRotte.filter({ tenant_id: tenant.id }), enabled: !!tenant?.id });
  const { data: reviere = [] } = useQuery({ queryKey: ["reviere", tenant?.id], queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant.id }), enabled: !!tenant?.id });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SchwarzwildSichtung.create({ ...data, tenant_id: tenant.id, revier_id: reviere[0]?.id || "" }),
    onSuccess: () => { qc.invalidateQueries(["schwarzwild_sichtungen", tenant?.id]); setShowForm(false); setForm(emptyForm()); }
  });

  const getLocation = () => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setForm(p => ({ ...p, ort_lat: pos.coords.latitude.toFixed(6), ort_lng: pos.coords.longitude.toFixed(6) }));
    });
  };

  const filtered = filterRotte ? sichtungen.filter(s => s.rotte_id === filterRotte) : sichtungen;
  const sorted = [...filtered].sort((a, b) => new Date(b.datum) - new Date(a.datum));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <select className="bg-[#111] border border-[#2a2a2a] text-gray-300 rounded-xl px-3 py-2 text-sm" value={filterRotte} onChange={e => setFilterRotte(e.target.value)}>
          <option value="">Alle Rotten</option>
          {rotten.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-2 bg-[#22c55e] text-black font-semibold rounded-xl text-sm hover:bg-[#16a34a]">
          <Plus className="w-4 h-4" /> Sichtung
        </button>
      </div>

      {showForm && (
        <div className="bg-[#1a1a1a] border border-[#22c55e]/40 rounded-2xl p-4 mb-4">
          <p className="text-sm font-semibold text-gray-200 mb-4">Sichtung erfassen</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LABEL}>Datum & Uhrzeit</label><input type="datetime-local" className={INPUT} value={form.datum} onChange={e => setForm(p => ({ ...p, datum: e.target.value }))} /></div>
              <div>
                <label className={LABEL}>Rotte</label>
                <select className={INPUT} value={form.rotte_id} onChange={e => setForm(p => ({ ...p, rotte_id: e.target.value }))}>
                  <option value="">Unbekannte Rotte</option>
                  {rotten.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL}>Stückzahl nach Altersklasse</label>
              <div className="grid grid-cols-4 gap-2">
                {[["anzahl_frischlinge","Frischlinge"],["anzahl_ueberlaeufer","Überläufer"],["anzahl_bachen","Bachen"],["anzahl_keiler","Keiler"]].map(([key,lbl]) => (
                  <div key={key}><label className="block text-xs text-gray-600 mb-1">{lbl}</label><input type="number" min={0} className={INPUT} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: Number(e.target.value) }))} /></div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Verhalten</label>
                <select className={INPUT} value={form.verhalten} onChange={e => setForm(p => ({ ...p, verhalten: e.target.value }))}>
                  {Object.entries(VERHALTEN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Witterung</label>
                <select className={INPUT} value={form.witterung} onChange={e => setForm(p => ({ ...p, witterung: e.target.value }))}>
                  {Object.entries(WITTERUNG_ICONS).map(([v, i]) => <option key={v} value={v}>{i} {v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL}>Standort</label>
              <div className="flex gap-2">
                <input className={INPUT} placeholder="Breite" value={form.ort_lat} onChange={e => setForm(p => ({ ...p, ort_lat: e.target.value }))} />
                <input className={INPUT} placeholder="Länge" value={form.ort_lng} onChange={e => setForm(p => ({ ...p, ort_lng: e.target.value }))} />
                <button onClick={getLocation} className="px-3 py-2 bg-[#1a1a2a] border border-[#22c55e]/40 text-[#22c55e] rounded-xl text-sm whitespace-nowrap">
                  <MapPin className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div><label className={LABEL}>Notizen</label><textarea className={INPUT} rows={2} value={form.notizen} onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))} /></div>
            <div className="flex gap-2">
              <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="flex-1 py-2.5 bg-[#22c55e] text-black font-semibold rounded-xl text-sm hover:bg-[#16a34a] disabled:opacity-50">{createMutation.isPending ? "Speichern..." : "Sichtung speichern"}</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-[#2a2a2a] text-gray-300 rounded-xl text-sm">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sorted.length === 0 && <div className="text-center py-12 text-gray-600 text-sm">Noch keine Sichtungen erfasst.</div>}
        {sorted.map(s => {
          const rotte = rotten.find(r => r.id === s.rotte_id);
          return (
            <div key={s.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-100">{new Date(s.datum).toLocaleDateString("de-DE")}</span>
                    <span className="text-xs text-gray-500">{new Date(s.datum).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr</span>
                    <span className="text-base">{WITTERUNG_ICONS[s.witterung]}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {rotte && <span className="text-xs px-2 py-0.5 bg-[#22c55e]/10 text-[#22c55e] rounded-full">{rotte.name}</span>}
                    <span className="text-xs text-gray-400 font-mono">{formatStueckzahl(s)}</span>
                    <span className="text-xs text-gray-600">{VERHALTEN_LABELS[s.verhalten]}</span>
                  </div>
                </div>
                {s.ort_lat && <MapPin className="w-4 h-4 text-gray-600" />}
              </div>
              {s.notizen && <p className="text-xs text-gray-600 mt-2">{s.notizen}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}