import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WildmarkenCompliance from "@/components/onboarding/WildmarkenCompliance";
import { Check, AlertTriangle } from "lucide-react";

const BUNDESLAENDER = [
  "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen",
  "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen",
  "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen",
  "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen"
];
const REVIER_ARTEN = ["Eigenjagd", "Pachtrevier", "Gemeinschaftsjagd", "Forstbetrieb", "Staatsjagd"];

const INPUT = "w-full bg-[#111] border border-[#2a2a2a] text-gray-100 placeholder-gray-600 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#22c55e] transition-colors text-sm";
const SELECT = "w-full bg-[#111] border border-[#2a2a2a] text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#22c55e] transition-colors text-sm";
const LABEL = "block text-xs text-gray-500 mb-1";

const STEPS_CONFIG = [
  { id: 1, label: "Persönliche Daten", fields: ["first_name", "last_name"] },
  { id: 2, label: "Adresse", fields: ["street", "city"] },
  { id: 3, label: "Jagdschein", fields: ["jagdschein_nummer"] },
  { id: 4, label: "Revier", fields: ["revier_name"] },
  { id: 5, label: "Wildmarken-System", fields: ["wildmarken_system"] },
];

export default function OnboardingProfileSection() {
  const [userData, setUserData] = useState(null);
  const [openStep, setOpenStep] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedStep, setSavedStep] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u) {
        setUserData(u);
        setForm({
          first_name: u.first_name || "",
          last_name: u.last_name || "",
          phone: u.phone || "",
          birth_date: u.birth_date || "",
          street: u.street || "",
          house_number: u.house_number || "",
          zip_code: u.zip_code || "",
          city: u.city || "",
          bundesland: u.bundesland || "",
          country: u.country || "Deutschland",
          jagdschein_nummer: u.jagdschein_nummer || "",
          jagdschein_ausstellendes_amt: u.jagdschein_ausstellendes_amt || "",
          jagdschein_gueltig_bis: u.jagdschein_gueltig_bis || "",
          revier_name: u.revier_name || "",
          revier_groesse_ha: u.revier_groesse_ha || "",
          revier_bundesland: u.revier_bundesland || "",
          revier_art: u.revier_art || "",
          wildmarken_system: u.wildmarken_system || "",
        });
      }
    });
  }, []);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const isStepComplete = (step) => {
    if (!userData) return false;
    return step.fields.every(f => !!userData[f]);
  };

  const completedCount = STEPS_CONFIG.filter(isStepComplete).length;

  const handleSave = async (stepId) => {
    setSaving(true);
    await base44.auth.updateMe(form);
    const u = await base44.auth.me();
    setUserData(u);
    setSaving(false);
    setSavedStep(stepId);
    setTimeout(() => setSavedStep(null), 2000);
  };

  if (!userData) return null;

  const bundesland = form.revier_bundesland || form.bundesland;

  return (
    <div className="space-y-3">
      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>{completedCount} von {STEPS_CONFIG.length} Schritten abgeschlossen</span>
          <span>{Math.round((completedCount / STEPS_CONFIG.length) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-[#111] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#22c55e] rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / STEPS_CONFIG.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      {STEPS_CONFIG.map((step) => {
        const complete = isStepComplete(step);
        const isOpen = openStep === step.id;
        return (
          <div key={step.id} className="border border-[#2a2a2a] rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenStep(isOpen ? null : step.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${complete ? "bg-[#22c55e]" : "bg-[#2a2a2a]"}`}>
                  {complete
                    ? <Check className="w-3.5 h-3.5 text-black" />
                    : <AlertTriangle className="w-3 h-3 text-yellow-500" />
                  }
                </div>
                <span className="text-sm font-medium text-gray-200">{step.label}</span>
              </div>
              {!complete && <span className="text-xs text-yellow-500">Ausfüllen →</span>}
              {complete && <span className="text-xs text-[#22c55e]">✓ Vollständig</span>}
            </button>

            {isOpen && (
              <div className="px-4 pb-4 border-t border-[#2a2a2a] pt-4 space-y-3">

                {step.id === 1 && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={LABEL}>Vorname</label><input className={INPUT} value={form.first_name} onChange={e => set("first_name", e.target.value)} placeholder="Max" /></div>
                      <div><label className={LABEL}>Nachname</label><input className={INPUT} value={form.last_name} onChange={e => set("last_name", e.target.value)} placeholder="Müller" /></div>
                    </div>
                    <div><label className={LABEL}>Telefon</label><input className={INPUT} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+49 123 456789" /></div>
                    <div><label className={LABEL}>Geburtsdatum</label><input type="date" className={INPUT} value={form.birth_date} onChange={e => set("birth_date", e.target.value)} /></div>
                  </>
                )}

                {step.id === 2 && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2"><label className={LABEL}>Straße</label><input className={INPUT} value={form.street} onChange={e => set("street", e.target.value)} placeholder="Hauptstraße" /></div>
                      <div><label className={LABEL}>Nr.</label><input className={INPUT} value={form.house_number} onChange={e => set("house_number", e.target.value)} placeholder="12" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={LABEL}>PLZ</label><input className={INPUT} value={form.zip_code} onChange={e => set("zip_code", e.target.value)} placeholder="12345" /></div>
                      <div><label className={LABEL}>Stadt</label><input className={INPUT} value={form.city} onChange={e => set("city", e.target.value)} placeholder="München" /></div>
                    </div>
                    <div>
                      <label className={LABEL}>Bundesland</label>
                      <select className={SELECT} value={form.bundesland} onChange={e => set("bundesland", e.target.value)}>
                        <option value="">— wählen —</option>
                        {BUNDESLAENDER.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div><label className={LABEL}>Land</label><input className={INPUT} value={form.country} onChange={e => set("country", e.target.value)} /></div>
                  </>
                )}

                {step.id === 3 && (
                  <>
                    <div><label className={LABEL}>Jagdscheinnummer</label><input className={INPUT} value={form.jagdschein_nummer} onChange={e => set("jagdschein_nummer", e.target.value)} placeholder="JS-2024-001234" /></div>
                    <div><label className={LABEL}>Ausstellendes Amt</label><input className={INPUT} value={form.jagdschein_ausstellendes_amt} onChange={e => set("jagdschein_ausstellendes_amt", e.target.value)} placeholder="Landratsamt München" /></div>
                    <div><label className={LABEL}>Gültig bis</label><input type="date" className={INPUT} value={form.jagdschein_gueltig_bis} onChange={e => set("jagdschein_gueltig_bis", e.target.value)} /></div>
                  </>
                )}

                {step.id === 4 && (
                  <>
                    <div><label className={LABEL}>Reviername</label><input className={INPUT} value={form.revier_name} onChange={e => set("revier_name", e.target.value)} placeholder="Revier Mühlbach" /></div>
                    <div><label className={LABEL}>Größe (ha)</label><input type="number" className={INPUT} value={form.revier_groesse_ha} onChange={e => set("revier_groesse_ha", e.target.value)} /></div>
                    <div>
                      <label className={LABEL}>Revier-Bundesland</label>
                      <select className={SELECT} value={form.revier_bundesland} onChange={e => set("revier_bundesland", e.target.value)}>
                        <option value="">— wählen —</option>
                        {BUNDESLAENDER.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL}>Revierart</label>
                      <select className={SELECT} value={form.revier_art} onChange={e => set("revier_art", e.target.value)}>
                        <option value="">— wählen —</option>
                        {["Eigenjagd", "Pachtrevier", "Gemeinschaftsjagd", "Forstbetrieb", "Staatsjagd"].map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {step.id === 5 && (
                  <>
                    {bundesland && <WildmarkenCompliance bundesland={bundesland} />}
                    <div className="space-y-2">
                      {[
                        { value: "behoerdlich", label: "Nur behördliche Wildmarken" },
                        { value: "beides", label: "Behördliche + eigene Kontrollmarken" },
                        { value: "eigen", label: "Nur eigene Kontrollmarken" },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => set("wildmarken_system", opt.value)}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${form.wildmarken_system === opt.value ? "border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]" : "border-[#2a2a2a] text-gray-300 hover:border-[#3a3a3a]"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <button
                  onClick={() => handleSave(step.id)}
                  disabled={saving}
                  className="w-full py-2.5 bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold rounded-xl text-sm transition-colors"
                >
                  {savedStep === step.id ? "✅ Gespeichert" : saving ? "Speichern..." : "Speichern"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}