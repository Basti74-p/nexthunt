import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, AlertTriangle, ExternalLink, FlaskConical, CheckCircle, Clock, XCircle, Link2 } from "lucide-react";
import { Link } from "react-router-dom";

const INPUT = "w-full bg-[#111] border border-[#2a2a2a] text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#22c55e] text-sm";
const LABEL = "block text-xs text-gray-500 mb-1";

const ERGEBNIS_CONFIG = {
  ausstehend: { icon: <Clock className="w-4 h-4 text-yellow-400" />, label: "Ausstehend", color: "text-yellow-400", border: "border-yellow-800/40", bg: "bg-yellow-900/10" },
  negativ: { icon: <CheckCircle className="w-4 h-4 text-green-400" />, label: "Negativ – freigegeben", color: "text-green-400", border: "border-green-800/40", bg: "bg-green-900/10" },
  positiv: { icon: <XCircle className="w-4 h-4 text-red-400" />, label: "Positiv – GESPERRT", color: "text-red-400", border: "border-red-800/60", bg: "bg-red-900/20" },
  nicht_untersucht: { icon: <XCircle className="w-4 h-4 text-gray-500" />, label: "Nicht untersucht", color: "text-gray-500", border: "border-[#2a2a2a]", bg: "" },
};

const emptyForm = () => ({
  datum_erlegung: new Date().toISOString().slice(0, 10),
  wildart: "Wildschwein",
  altersklasse: "Frischling",
  geschlecht: "unbekannt",
  gewicht_kg: "",
  ergebnis: "ausstehend",
  probe_entnommen: false,
  untersuchungsstelle: "",
  notizen: "",
  strecke_id: "",
  wildkammer_id: "",
});

export default function SchwarzwildTrichineTab({ tenant, isPro }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState(null);

  // Trichinenprotokolle aus dem Schwarzwild-Modul
  const { data: protokolle = [] } = useQuery({
    queryKey: ["trichinen", tenant?.id],
    queryFn: () => base44.entities.Trichinenprotokoll.filter({ tenant_id: tenant.id }),
    enabled: !!tenant?.id,
  });

  // Schwarzwild-Strecke (für Verknüpfung)
  const { data: strecken = [] } = useQuery({
    queryKey: ["strecke_schwarzwild", tenant?.id],
    queryFn: () => base44.entities.Strecke.filter({ tenant_id: tenant.id, species: "schwarzwild" }),
    enabled: !!tenant?.id,
  });

  // Wildkammer-Einträge für Schwarzwild (für Sync)
  const { data: wildkammer = [] } = useQuery({
    queryKey: ["wildkammer_schwarzwild", tenant?.id],
    queryFn: () => base44.entities.Wildkammer.filter({ tenant_id: tenant.id, species: "schwarzwild" }),
    enabled: !!tenant?.id,
  });

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant.id }),
    enabled: !!tenant?.id,
  });

  // Strecken ohne eigenes Trichinenprotokoll ermitteln
  const streckenOhneProtokoll = strecken.filter(s =>
    !protokolle.some(p => p.strecke_id === s.id)
  );

  // Wildkammer-Einträge mit ausstehender Trichinenprobe (noch kein Protokoll verknüpft)
  const wildkammerAusstehend = wildkammer.filter(w =>
    w.trichinenprobe_ergebnis === "ausstehend" &&
    !protokolle.some(p => p.wildkammer_id === w.id)
  );

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { strecke_id, wildkammer_id, ...rest } = data;
      const protokoll = await base44.entities.Trichinenprotokoll.create({
        ...rest,
        tenant_id: tenant.id,
        revier_id: reviere[0]?.id || "",
        strecke_id: strecke_id || undefined,
        wildkammer_id: wildkammer_id || undefined,
      });

      // Sync: wenn Strecken-ID angegeben, Strecken-Notizen updaten
      if (strecke_id) {
        await base44.entities.Strecke.update(strecke_id, {
          notes: `Trichinenprobe ${rest.ergebnis === "negativ" ? "negativ ✓" : rest.ergebnis === "positiv" ? "POSITIV ⚠" : "ausstehend"}`,
        });
      }

      // Sync: Wildkammer-Eintrag aktualisieren wenn verknüpft
      if (wildkammer_id && rest.ergebnis !== "ausstehend") {
        await base44.entities.Wildkammer.update(wildkammer_id, {
          trichinenprobe: true,
          trichinenprobe_datum: rest.probe_datum || rest.datum_erlegung,
          trichinenprobe_ergebnis: rest.ergebnis === "negativ" ? "negativ" : "positiv",
          freigabe: rest.ergebnis === "negativ",
          freigabe_datum: rest.ergebnis === "negativ" ? (rest.ergebnis_datum || new Date().toISOString().slice(0, 10)) : undefined,
        });
      }

      return protokoll;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trichinen", tenant?.id] });
      qc.invalidateQueries({ queryKey: ["wildkammer_schwarzwild", tenant?.id] });
      qc.invalidateQueries({ queryKey: ["wildkammer", tenant?.id] });
      qc.invalidateQueries({ queryKey: ["strecke_schwarzwild", tenant?.id] });
      setShowForm(false);
      setForm(emptyForm());
    },
  });

  const updateErgebnisMutation = useMutation({
    mutationFn: async ({ protokoll, ergebnis, ergebnis_datum }) => {
      await base44.entities.Trichinenprotokoll.update(protokoll.id, {
        ergebnis,
        ergebnis_datum,
        freigabe_erteilt: ergebnis === "negativ",
        freigabe_datum: ergebnis === "negativ" ? ergebnis_datum : undefined,
        sperrfrist_aktiv: ergebnis === "positiv",
      });

      // Sync Wildkammer
      if (protokoll.wildkammer_id) {
        await base44.entities.Wildkammer.update(protokoll.wildkammer_id, {
          trichinenprobe_ergebnis: ergebnis === "negativ" ? "negativ" : "positiv",
          freigabe: ergebnis === "negativ",
          freigabe_datum: ergebnis === "negativ" ? ergebnis_datum : undefined,
          status: ergebnis === "negativ" ? "lager" : undefined,
        });
      }

      // Sync Strecke
      if (protokoll.strecke_id) {
        await base44.entities.Strecke.update(protokoll.strecke_id, {
          notes: `Trichinenprobe ${ergebnis === "negativ" ? "negativ ✓" : "POSITIV ⚠"}`,
          status: ergebnis === "negativ" ? "bestaetigt" : "erfasst",
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trichinen", tenant?.id] });
      qc.invalidateQueries({ queryKey: ["wildkammer", tenant?.id] });
      qc.invalidateQueries({ queryKey: ["strecke_schwarzwild", tenant?.id] });
      setEditId(null);
    },
  });

  // Beim Öffnen des Formulars: automatisch von Strecke vorausfüllen
  const prefillFromStrecke = (strecke_id) => {
    const s = strecken.find(s => s.id === strecke_id);
    if (!s) return;
    setForm(prev => ({
      ...prev,
      strecke_id,
      datum_erlegung: s.date || prev.datum_erlegung,
      gewicht_kg: s.weight_kg || "",
      geschlecht: s.gender === "maennlich" ? "männlich" : s.gender === "weiblich" ? "weiblich" : "unbekannt",
      altersklasse: s.age_class || "Frischling",
    }));
  };

  const prefillFromWildkammer = (wildkammer_id) => {
    const w = wildkammer.find(w => w.id === wildkammer_id);
    if (!w) return;
    setForm(prev => ({
      ...prev,
      wildkammer_id,
      datum_erlegung: w.eingang_datum || prev.datum_erlegung,
      gewicht_kg: w.gewicht_aufgebrochen || "",
      altersklasse: w.age_class || "Frischling",
      geschlecht: w.gender === "maennlich" ? "männlich" : w.gender === "weiblich" ? "weiblich" : "unbekannt",
    }));
  };

  const sorted = [...protokolle].sort((a, b) => new Date(b.datum_erlegung) - new Date(a.datum_erlegung));

  // Ausstehende aus Wildkammer die noch kein Protokoll haben
  const pendingFromWildkammer = wildkammerAusstehend.length;

  return (
    <div>
      {/* Pflichthinweis */}
      <div className="bg-[#1a0a0a] border border-red-800/50 rounded-xl px-4 py-3 mb-4 flex gap-3">
        <span className="text-lg shrink-0">🔬</span>
        <p className="text-xs text-red-300 leading-relaxed">
          <strong>Trichinenuntersuchung gesetzlich Pflicht</strong> bei jedem Wildschwein und Dachs — kein Stück darf ohne negatives Ergebnis verwertet werden. <em>(§ 6 Tier-LMHV + EU-VO 2015/1375)</em>
        </p>
      </div>

      {/* Sync-Hinweise */}
      {pendingFromWildkammer > 0 && (
        <div className="bg-[#1a1400] border border-yellow-700/40 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <FlaskConical className="w-5 h-5 text-yellow-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-yellow-300 font-semibold">
              {pendingFromWildkammer} Wildkammer-Eintrag{pendingFromWildkammer !== 1 ? "e" : ""} ohne Trichinenprotokoll
            </p>
            <p className="text-xs text-yellow-500 mt-0.5">Lege ein Protokoll an und verknüpfe es mit dem Wildkammer-Eintrag — der Status wird automatisch synchronisiert.</p>
          </div>
        </div>
      )}

      {streckenOhneProtokoll.length > 0 && (
        <div className="bg-[#0a0a1a] border border-blue-700/40 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <Link2 className="w-5 h-5 text-blue-400 shrink-0" />
          <p className="text-xs text-blue-300">
            <strong>{streckenOhneProtokoll.length} Schwarzwild-Abschuss{streckenOhneProtokoll.length !== 1 ? "e" : ""}</strong> in der Strecke ohne verknüpftes Trichinenprotokoll.
          </p>
        </div>
      )}

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

            {/* Verknüpfung mit Strecke */}
            {strecken.length > 0 && (
              <div>
                <label className={LABEL}>🔗 Mit Strecken-Eintrag verknüpfen (optional)</label>
                <select className={INPUT} value={form.strecke_id}
                  onChange={e => { setForm(p => ({ ...p, strecke_id: e.target.value, wildkammer_id: "" })); if (e.target.value) prefillFromStrecke(e.target.value); }}>
                  <option value="">— Kein Strecken-Eintrag —</option>
                  {streckenOhneProtokoll.map(s => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.date).toLocaleDateString("de-DE")} · {s.age_class || "Schwarzwild"} {s.weight_kg ? `· ${s.weight_kg}kg` : ""}
                    </option>
                  ))}
                </select>
                {form.strecke_id && <p className="text-xs text-[#22c55e] mt-1">✓ Daten wurden vorausgefüllt. Strecke wird nach Ergebnis automatisch aktualisiert.</p>}
              </div>
            )}

            {/* Verknüpfung mit Wildkammer */}
            {wildkammer.length > 0 && (
              <div>
                <label className={LABEL}>🔗 Mit Wildkammer-Eintrag verknüpfen (optional)</label>
                <select className={INPUT} value={form.wildkammer_id}
                  onChange={e => { setForm(p => ({ ...p, wildkammer_id: e.target.value, strecke_id: "" })); if (e.target.value) prefillFromWildkammer(e.target.value); }}>
                  <option value="">— Kein Wildkammer-Eintrag —</option>
                  {wildkammer.map(w => (
                    <option key={w.id} value={w.id}>
                      {new Date(w.eingang_datum).toLocaleDateString("de-DE")} · {w.age_class || "Schwarzwild"} {w.gewicht_aufgebrochen ? `· ${w.gewicht_aufgebrochen}kg` : ""}
                      {w.trichinenprobe_ergebnis === "ausstehend" ? " ⚠ Probe ausstehend" : ""}
                    </option>
                  ))}
                </select>
                {form.wildkammer_id && <p className="text-xs text-[#22c55e] mt-1">✓ Wildkammer wird nach Ergebnis automatisch freigegeben/gesperrt.</p>}
              </div>
            )}

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
                {Object.entries(ERGEBNIS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
            </div>
            {form.ergebnis === "positiv" && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-400">🚨 Positiver Trichinenbefund!</p>
                  <p className="text-xs text-red-300 mt-1">Das Fleisch darf NICHT verwertet werden. Veterinäramt sofort informieren!</p>
                </div>
              </div>
            )}
            <div><label className={LABEL}>Notizen</label><textarea className={INPUT} rows={2} value={form.notizen} onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))} /></div>
            <div className="flex gap-2">
              <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="flex-1 py-2.5 bg-[#22c55e] text-black font-semibold rounded-xl text-sm hover:bg-[#16a34a] disabled:opacity-50">
                {createMutation.isPending ? "Speichern..." : "Protokoll speichern"}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-[#2a2a2a] text-gray-300 rounded-xl text-sm">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sorted.length === 0 && <div className="text-center py-12 text-gray-600 text-sm">Noch keine Protokolle.</div>}
        {sorted.map(p => {
          const cfg = ERGEBNIS_CONFIG[p.ergebnis] || ERGEBNIS_CONFIG.ausstehend;
          const isEditing = editId === p.id;
          const verknuepfteStrecke = strecken.find(s => s.id === p.strecke_id);
          const verknuepfteWK = wildkammer.find(w => w.id === p.wildkammer_id);

          return (
            <div key={p.id} className={`border rounded-xl px-4 py-3 ${cfg.border} ${cfg.bg} bg-[#1a1a1a]`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {cfg.icon}
                    <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                    {p.freigabe_erteilt && <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-400 rounded-full">✓ Freigabe erteilt</span>}
                    {p.sperrfrist_aktiv && <span className="text-xs px-2 py-0.5 bg-red-900/30 text-red-400 rounded-full">⚠ Sperrfrist aktiv</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                    <span>{new Date(p.datum_erlegung).toLocaleDateString("de-DE")}</span>
                    <span>{p.wildart}</span>
                    <span>{p.altersklasse}</span>
                    {p.gewicht_kg && <span>{p.gewicht_kg} kg</span>}
                    {p.untersuchungsstelle && <span>· {p.untersuchungsstelle}</span>}
                    {p.probe_entnommen && <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded-full">Probe entnommen</span>}
                  </div>

                  {/* Verknüpfungen */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {verknuepfteStrecke && (
                      <Link to="/Strecke" className="flex items-center gap-1 text-xs text-[#22c55e]/80 hover:text-[#22c55e] transition-colors">
                        <ExternalLink className="w-3 h-3" /> Strecke {new Date(verknuepfteStrecke.date).toLocaleDateString("de-DE")}
                      </Link>
                    )}
                    {verknuepfteWK && (
                      <Link to="/StreckeWildkammer" className="flex items-center gap-1 text-xs text-purple-400/80 hover:text-purple-400 transition-colors">
                        <ExternalLink className="w-3 h-3" /> Wildkammer {new Date(verknuepfteWK.eingang_datum).toLocaleDateString("de-DE")}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Ergebnis nachtragen wenn ausstehend */}
                {p.ergebnis === "ausstehend" && (
                  <div>
                    {isEditing ? (
                      <div className="flex flex-col gap-2 min-w-36">
                        <select className="bg-[#111] border border-[#2a2a2a] text-gray-100 rounded-lg px-2 py-1.5 text-xs"
                          onChange={e => {
                            const datum = new Date().toISOString().slice(0, 10);
                            updateErgebnisMutation.mutate({ protokoll: p, ergebnis: e.target.value, ergebnis_datum: datum });
                          }}>
                          <option value="">Ergebnis wählen…</option>
                          <option value="negativ">🟢 Negativ</option>
                          <option value="positiv">🔴 Positiv</option>
                          <option value="nicht_untersucht">⚫ Nicht untersucht</option>
                        </select>
                        <button onClick={() => setEditId(null)} className="text-xs text-gray-500 hover:text-gray-300">Abbrechen</button>
                      </div>
                    ) : (
                      <button onClick={() => setEditId(p.id)}
                        className="text-xs px-3 py-1.5 bg-yellow-900/30 border border-yellow-700/40 text-yellow-400 rounded-lg hover:bg-yellow-900/50 transition-colors whitespace-nowrap">
                        Ergebnis eintragen
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}