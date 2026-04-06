import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Check, X, ChevronRight } from "lucide-react";

const STATUS_COLORS = { aktiv: "#22c55e", abgewandert: "#6b7280", unbekannt: "#f97316" };
const STATUS_LABELS = { aktiv: "Aktiv", abgewandert: "Abgewandert", unbekannt: "Unbekannt" };
const BUNDESLAENDER = ["Baden-Württemberg","Bayern","Berlin","Brandenburg","Bremen","Hamburg","Hessen","Mecklenburg-Vorpommern","Niedersachsen","Nordrhein-Westfalen","Rheinland-Pfalz","Saarland","Sachsen","Sachsen-Anhalt","Schleswig-Holstein","Thüringen"];

const INPUT = "w-full bg-[#111] border border-[#2a2a2a] text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#22c55e] text-sm";
const LABEL = "block text-xs text-gray-500 mb-1";

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  return diff === 0 ? "heute" : `vor ${diff} Tag${diff === 1 ? "" : "en"}`;
}

export default function SchwarzwildRottenTab({ tenant, isPro }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: "", geschaetzte_stueckzahl: "", status: "aktiv", leitbache_bekannt: false, aktivitaet_morgens: false, aktivitaet_mittags: false, aktivitaet_abends: false, aktivitaet_nachts: true, notizen: "" });

  const { data: reviere = [] } = useQuery({ queryKey: ["reviere", tenant?.id], queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant.id }), enabled: !!tenant?.id });
  const { data: rotten = [] } = useQuery({ queryKey: ["schwarzwild_rotten", tenant?.id], queryFn: () => base44.entities.SchwarzwildRotte.filter({ tenant_id: tenant.id }), enabled: !!tenant?.id });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SchwarzwildRotte.create({ ...data, tenant_id: tenant.id, revier_id: reviere[0]?.id || "" }),
    onSuccess: () => { qc.invalidateQueries(["schwarzwild_rotten", tenant?.id]); setShowForm(false); setForm({ name: "", geschaetzte_stueckzahl: "", status: "aktiv", leitbache_bekannt: false, aktivitaet_morgens: false, aktivitaet_mittags: false, aktivitaet_abends: false, aktivitaet_nachts: true, notizen: "" }); }
  });

  const maxRotten = !isPro ? 3 : Infinity;
  const canAdd = rotten.length < maxRotten;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">{rotten.length} Rotte{rotten.length !== 1 ? "n" : ""} erfasst</p>
        <button
          onClick={() => canAdd ? setShowForm(true) : null}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${canAdd ? "bg-[#22c55e] text-black hover:bg-[#16a34a]" : "bg-[#1a1a1a] text-gray-600 border border-[#2a2a2a] cursor-not-allowed"}`}
        >
          <Plus className="w-4 h-4" /> {canAdd ? "Neue Rotte" : `🔒 Max. ${maxRotten} (Solo)`}
        </button>
      </div>

      {!isPro && (
        <div className="bg-[#1a1a0a] border border-yellow-800/40 rounded-xl px-4 py-3 mb-4 text-xs text-yellow-400">
          💡 Solo: max. 3 Rotten. Upgrade auf PRO für unbegrenzte Rotten-Verwaltung.
        </div>
      )}

      {showForm && (
        <div className="bg-[#1a1a1a] border border-[#22c55e]/40 rounded-2xl p-4 mb-4">
          <p className="text-sm font-semibold text-gray-200 mb-1">Neue Rotte anlegen</p>
          <p className="text-xs text-gray-500 mb-4">💡 Eine Rotte ist ein Familienverband rund um eine Leitbache. Das Erfassen von Rotten hilft dir die Bewegungsmuster zu verstehen und gezielt zu bejagen.</p>
          <div className="space-y-3">
            <div><label className={LABEL}>Rottenname *</label><input className={INPUT} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="z.B. Rotte Nordhang" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LABEL}>Geschätzte Stückzahl</label><input type="number" className={INPUT} value={form.geschaetzte_stueckzahl} onChange={e => setForm(p => ({ ...p, geschaetzte_stueckzahl: e.target.value }))} /></div>
              <div>
                <label className={LABEL}>Status</label>
                <select className={INPUT} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="aktiv">Aktiv</option><option value="abgewandert">Abgewandert</option><option value="unbekannt">Unbekannt</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.leitbache_bekannt} onChange={e => setForm(p => ({ ...p, leitbache_bekannt: e.target.checked }))} className="w-4 h-4 accent-[#22c55e]" />
                Leitbache bekannt
              </label>
            </div>
            {form.leitbache_bekannt && (
              <div><label className={LABEL}>Merkmale Leitbache</label><input className={INPUT} value={form.leitbache_beschreibung || ""} onChange={e => setForm(p => ({ ...p, leitbache_beschreibung: e.target.value }))} placeholder="Besondere Merkmale zur Wiedererkennung" /></div>
            )}
            <div>
              <label className={LABEL}>Aktivitätsmuster</label>
              <div className="flex gap-3">
                {[["aktivitaet_morgens", "🌅 Morgens"], ["aktivitaet_mittags", "🌞 Mittags"], ["aktivitaet_abends", "🌆 Abends"], ["aktivitaet_nachts", "🌙 Nachts"]].map(([key, lbl]) => (
                  <label key={key} className="flex flex-col items-center gap-1 text-xs text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} className="w-4 h-4 accent-[#22c55e]" />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>
            <div><label className={LABEL}>Notizen</label><textarea className={INPUT} rows={2} value={form.notizen} onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))} /></div>
            <div className="flex gap-2">
              <button onClick={() => createMutation.mutate(form)} disabled={!form.name || createMutation.isPending} className="flex-1 py-2.5 bg-[#22c55e] text-black font-semibold rounded-xl text-sm hover:bg-[#16a34a] disabled:opacity-50">{createMutation.isPending ? "Speichern..." : "Rotte anlegen"}</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-[#2a2a2a] text-gray-300 rounded-xl text-sm">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rotten.length === 0 && <div className="text-center py-12 text-gray-600 text-sm">Noch keine Rotten erfasst.<br />Lege jetzt deine erste Rotte an.</div>}
        {rotten.map(r => (
          <div key={r.id} onClick={() => setSelected(selected?.id === r.id ? null : r)} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 cursor-pointer hover:border-[#3a3a3a] transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[r.status] }} />
                <div>
                  <p className="text-sm font-semibold text-gray-100">{r.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[r.status]}20`, color: STATUS_COLORS[r.status] }}>{STATUS_LABELS[r.status]}</span>
                    {r.geschaetzte_stueckzahl && <span className="text-xs text-gray-500">~{r.geschaetzte_stueckzahl} Stück</span>}
                    {r.letzte_sichtung_datum && <span className="text-xs text-gray-600">{daysSince(r.letzte_sichtung_datum)}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {r.aktivitaet_morgens && <span title="Morgens">🌅</span>}
                  {r.aktivitaet_mittags && <span title="Mittags">🌞</span>}
                  {r.aktivitaet_abends && <span title="Abends">🌆</span>}
                  {r.aktivitaet_nachts && <span title="Nachts">🌙</span>}
                </div>
                {r.leitbache_bekannt ? <Check className="w-4 h-4 text-[#22c55e]" /> : <X className="w-4 h-4 text-red-500" />}
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </div>
            </div>
            {selected?.id === r.id && r.notizen && (
              <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                <p className="text-xs text-gray-500">{r.notizen}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}