import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import WildmarkenCompliance from "@/components/onboarding/WildmarkenCompliance";

const BUNDESLAENDER = [
  "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen",
  "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen",
  "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen",
  "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen"
];

const REVIER_ARTEN = ["Eigenjagd", "Pachtrevier", "Gemeinschaftsjagd", "Forstbetrieb", "Staatsjagd"];

const INPUT = "w-full bg-[#0f1f0f] border border-[#2a4a2a] text-[#e8e0cc] placeholder-[#556655] rounded-xl px-4 py-3 focus:outline-none focus:border-[#c8a84b] transition-colors text-sm";
const SELECT = "w-full bg-[#0f1f0f] border border-[#2a4a2a] text-[#e8e0cc] rounded-xl px-4 py-3 focus:outline-none focus:border-[#c8a84b] transition-colors text-sm";
const LABEL = "block text-xs font-medium text-[#8a9a7a] mb-1.5";
const GOLD_BTN = "w-full py-3.5 bg-[#c8a84b] hover:bg-[#d4b85e] text-[#1a2e1a] font-bold rounded-xl transition-colors text-sm";
const SKIP_BTN = "w-full py-2 text-[#556655] hover:text-[#c8a84b] text-xs transition-colors";

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [skippedSteps, setSkippedSteps] = useState([]);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState({
    first_name: "", last_name: "", phone: "", birth_date: "",
    street: "", house_number: "", zip_code: "", city: "", bundesland: "", country: "Deutschland",
    jagdschein_nummer: "", jagdschein_ausstellendes_amt: "", jagdschein_gueltig_bis: "",
    revier_name: "", revier_groesse_ha: "", revier_bundesland: "", revier_art: "",
    wildmarken_system: ""
  });

  useEffect(() => {
    base44.auth.me().then((u) => {
      if (!u) return;
      setUser(u);
      if (u.onboarding_completed) {
        navigate("/");
        return;
      }
      // Restore progress
      if (u.onboarding_step > 0) setStep(u.onboarding_step);
      if (u.onboarding_skipped_steps) setSkippedSteps(u.onboarding_skipped_steps);
      // Pre-fill saved data
      setData(prev => ({
        ...prev,
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
        wildmarken_system: u.wildmarken_system || ""
      }));
    });
  }, []);

  const set = (key, val) => setData(prev => ({ ...prev, [key]: val }));

  const saveStep = async (extraData = {}) => {
    setSaving(true);
    await base44.auth.updateMe({ ...data, ...extraData, onboarding_step: step });
    setSaving(false);
  };

  const goNext = async (extraData = {}) => {
    await saveStep(extraData);
    setDirection(1);
    setStep(s => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

  const skipStep = async () => {
    const newSkipped = [...skippedSteps, step];
    setSkippedSteps(newSkipped);
    await base44.auth.updateMe({ onboarding_step: step, onboarding_skipped_steps: newSkipped });
    setDirection(1);
    setStep(s => s + 1);
  };

  const finish = async () => {
    setSaving(true);
    // Create Revier if name was entered
    if (data.revier_name && user) {
      const members = await base44.entities.TenantMember?.filter?.({ user_email: user.email }).catch(() => []);
      const tenant_id = members?.[0]?.tenant_id;
      if (tenant_id) {
        await base44.entities.Revier.create({
          tenant_id,
          name: data.revier_name,
          region: data.revier_bundesland,
          size_ha: data.revier_groesse_ha ? Number(data.revier_groesse_ha) : undefined,
          status: "active"
        }).catch(() => {});
      }
    }
    await base44.auth.updateMe({ ...data, onboarding_completed: true, onboarding_step: 7 });
    setSaving(false);
    navigate("/");
  };

  const STEPS = [
    { id: 0, icon: "🦌", title: "Willkommen bei NextHunt!" },
    { id: 1, icon: "👤", title: "Deine Kontaktdaten" },
    { id: 2, icon: "🏠", title: "Deine Adresse" },
    { id: 3, icon: "📋", title: "Dein Jagdschein" },
    { id: 4, icon: "🗺️", title: "Dein Revier" },
    { id: 5, icon: "🏷️", title: "Dein Wildmarken-System" },
    { id: 6, icon: "🎉", title: "Dein Revier ist bereit!" },
  ];

  const totalSteps = 7;
  const progress = Math.round((step / (totalSteps - 1)) * 100);

  return (
    <div className="min-h-screen bg-[#1a2e1a] flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <img
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c370741b119950032ab62/7a1f75278_NextHunt_logo_transparent.png"
        alt="NextHunt"
        className="w-32 mb-6"
      />

      {/* Progress */}
      {step > 0 && (
        <div className="w-full max-w-lg mb-4">
          <div className="flex justify-between text-xs text-[#556655] mb-2">
            <span>Schritt {step} von {totalSteps - 1}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-[#0f1f0f] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#c8a84b] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Card */}
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -60, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-[#0f1f0f] border border-[#2a4a2a] rounded-2xl p-6 shadow-2xl"
          >
            {/* Step content */}
            {step === 0 && <StepWelcome onNext={() => { setDirection(1); setStep(1); }} />}
            {step === 1 && <StepPersoenlich data={data} set={set} onNext={goNext} onSkip={skipStep} onBack={goBack} saving={saving} />}
            {step === 2 && <StepAdresse data={data} set={set} onNext={goNext} onSkip={skipStep} onBack={goBack} saving={saving} />}
            {step === 3 && <StepJagdschein data={data} set={set} onNext={goNext} onSkip={skipStep} onBack={goBack} saving={saving} />}
            {step === 4 && <StepRevier data={data} set={set} onNext={goNext} onSkip={skipStep} onBack={goBack} saving={saving} />}
            {step === 5 && <StepWildmarken data={data} set={set} onNext={goNext} onSkip={skipStep} onBack={goBack} saving={saving} />}
            {step === 6 && <StepFertig data={data} skippedSteps={skippedSteps} onFinish={finish} onNavigateStep={setStep} saving={saving} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Step 0: Willkommen ────────────────────────────────────────────────────────
function StepWelcome({ onNext }) {
  return (
    <div className="text-center space-y-6">
      <div className="text-5xl">🦌</div>
      <div>
        <h1 className="text-2xl font-bold text-[#e8e0cc] mb-3">Willkommen bei NextHunt!</h1>
        <p className="text-sm text-[#8a9a7a] leading-relaxed">
          Schön dass du dabei bist. In den nächsten 2 Minuten richten wir dein Revier ein.
          Du kannst jeden Schritt überspringen und später in den Einstellungen vervollständigen.
        </p>
      </div>
      <button onClick={onNext} className={GOLD_BTN}>Los geht's →</button>
    </div>
  );
}

// ── Step 1: Persönliche Daten ─────────────────────────────────────────────────
function StepPersoenlich({ data, set, onNext, onSkip, onBack, saving }) {
  return (
    <div className="space-y-5">
      <StepHeader icon="👤" title="Deine Kontaktdaten" onBack={onBack} />
      <InfoBox>💡 Dein Name und deine Kontaktdaten werden für Abschusslisten, Streckenmeldungen und offizielle Dokumente verwendet. Du sparst dir später viel Tipparbeit.</InfoBox>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Vorname *</label>
          <input className={INPUT} value={data.first_name} onChange={e => set("first_name", e.target.value)} placeholder="Max" />
        </div>
        <div>
          <label className={LABEL}>Nachname *</label>
          <input className={INPUT} value={data.last_name} onChange={e => set("last_name", e.target.value)} placeholder="Müller" />
        </div>
      </div>
      <div>
        <label className={LABEL}>Telefonnummer (optional)</label>
        <input className={INPUT} value={data.phone} onChange={e => set("phone", e.target.value)} placeholder="+49 123 456789" />
      </div>
      <div>
        <label className={LABEL}>Geburtsdatum (optional)</label>
        <input type="date" className={INPUT} value={data.birth_date} onChange={e => set("birth_date", e.target.value)} />
      </div>
      <button onClick={() => onNext()} disabled={saving} className={GOLD_BTN}>{saving ? "Speichern..." : "Weiter →"}</button>
      <button onClick={onSkip} className={SKIP_BTN}>Später in Einstellungen → Profil ausfüllen</button>
    </div>
  );
}

// ── Step 2: Adresse ───────────────────────────────────────────────────────────
function StepAdresse({ data, set, onNext, onSkip, onBack, saving }) {
  return (
    <div className="space-y-5">
      <StepHeader icon="🏠" title="Deine Adresse" onBack={onBack} />
      <InfoBox>💡 Deine Adresse wird für die automatische Erstellung von Wildursprungsscheinen und behördlichen Dokumenten benötigt.</InfoBox>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className={LABEL}>Straße</label>
          <input className={INPUT} value={data.street} onChange={e => set("street", e.target.value)} placeholder="Hauptstraße" />
        </div>
        <div>
          <label className={LABEL}>Nr.</label>
          <input className={INPUT} value={data.house_number} onChange={e => set("house_number", e.target.value)} placeholder="12" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>PLZ</label>
          <input className={INPUT} value={data.zip_code} onChange={e => set("zip_code", e.target.value)} placeholder="12345" />
        </div>
        <div>
          <label className={LABEL}>Stadt</label>
          <input className={INPUT} value={data.city} onChange={e => set("city", e.target.value)} placeholder="München" />
        </div>
      </div>
      <div>
        <label className={LABEL}>Bundesland</label>
        <select className={SELECT} value={data.bundesland} onChange={e => set("bundesland", e.target.value)}>
          <option value="">— Bundesland wählen —</option>
          {BUNDESLAENDER.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        {data.bundesland && (
          <p className="text-xs text-yellow-400 mt-1.5">⚠️ Dein Bundesland bestimmt welche Wildmarken-Pflichten für dich gelten — bitte korrekt auswählen!</p>
        )}
      </div>
      <div>
        <label className={LABEL}>Land</label>
        <input className={INPUT} value={data.country} onChange={e => set("country", e.target.value)} placeholder="Deutschland" />
      </div>
      <button onClick={() => onNext()} disabled={saving} className={GOLD_BTN}>{saving ? "Speichern..." : "Weiter →"}</button>
      <button onClick={onSkip} className={SKIP_BTN}>Später in Einstellungen → Profil ausfüllen</button>
    </div>
  );
}

// ── Step 3: Jagdschein ────────────────────────────────────────────────────────
function StepJagdschein({ data, set, onNext, onSkip, onBack, saving }) {
  return (
    <div className="space-y-5">
      <StepHeader icon="📋" title="Dein Jagdschein" onBack={onBack} />
      <InfoBox>💡 Deine Jagdscheinnummer wird für offizielle Dokumente benötigt. NextHunt erinnert dich automatisch 30 Tage vor Ablauf!</InfoBox>
      <div>
        <label className={LABEL}>Jagdscheinnummer</label>
        <input className={INPUT} value={data.jagdschein_nummer} onChange={e => set("jagdschein_nummer", e.target.value)} placeholder="z.B. JS-2024-001234" />
      </div>
      <div>
        <label className={LABEL}>Ausstellendes Amt</label>
        <input className={INPUT} value={data.jagdschein_ausstellendes_amt} onChange={e => set("jagdschein_ausstellendes_amt", e.target.value)} placeholder="z.B. Landratsamt München" />
      </div>
      <div>
        <label className={LABEL}>Gültig bis</label>
        <input type="date" className={INPUT} value={data.jagdschein_gueltig_bis} onChange={e => set("jagdschein_gueltig_bis", e.target.value)} />
      </div>
      <button onClick={() => onNext()} disabled={saving} className={GOLD_BTN}>{saving ? "Speichern..." : "Weiter →"}</button>
      <button onClick={onSkip} className={SKIP_BTN}>Später in Einstellungen → Jagdschein ausfüllen</button>
    </div>
  );
}

// ── Step 4: Revier ────────────────────────────────────────────────────────────
function StepRevier({ data, set, onNext, onSkip, onBack, saving }) {
  return (
    <div className="space-y-5">
      <StepHeader icon="🗺️" title="Dein Revier" onBack={onBack} />
      <InfoBox>💡 Mit diesen Grundinfos legen wir dein erstes Revier automatisch an. Du kannst es danach mit Karte und Mitgliedern vervollständigen.</InfoBox>
      <div>
        <label className={LABEL}>Reviername</label>
        <input className={INPUT} value={data.revier_name} onChange={e => set("revier_name", e.target.value)} placeholder="z.B. Revier Mühlbach" />
      </div>
      <div>
        <label className={LABEL}>Reviergröße (Hektar)</label>
        <input type="number" className={INPUT} value={data.revier_groesse_ha} onChange={e => set("revier_groesse_ha", e.target.value)} placeholder="z.B. 500" />
      </div>
      <div>
        <label className={LABEL}>Revier-Bundesland</label>
        <select className={SELECT} value={data.revier_bundesland} onChange={e => set("revier_bundesland", e.target.value)}>
          <option value="">— Bundesland wählen —</option>
          {BUNDESLAENDER.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        {data.revier_bundesland && (
          <p className="text-xs text-[#8a9a7a] mt-1.5">Bestimmt die geltenden Jagdgesetze für dein Revier</p>
        )}
      </div>
      <div>
        <label className={LABEL}>Revierart</label>
        <select className={SELECT} value={data.revier_art} onChange={e => set("revier_art", e.target.value)}>
          <option value="">— Revierart wählen —</option>
          {REVIER_ARTEN.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <button onClick={() => onNext()} disabled={saving} className={GOLD_BTN}>{saving ? "Speichern..." : "Weiter →"}</button>
      <button onClick={onSkip} className={SKIP_BTN}>Später unter Reviere → Neu anlegen</button>
    </div>
  );
}

// ── Step 5: Wildmarken ────────────────────────────────────────────────────────
function StepWildmarken({ data, set, onNext, onSkip, onBack, saving }) {
  const bundesland = data.revier_bundesland || data.bundesland;
  const isNeueBundeslaender = ["Brandenburg", "Sachsen", "Thüringen", "Mecklenburg-Vorpommern", "Sachsen-Anhalt", "Berlin"].includes(bundesland);

  const options = [
    { value: "behoerdlich", label: "Nur behördliche Wildmarken", desc: "Ich trage ausschließlich die offiziellen Nummern von der Behörde ein" },
    { value: "beides", label: "Behördliche + eigene Kontrollmarken", desc: "Ich möchte zusätzlich eigene interne Nummern für meine persönliche Übersicht vergeben (ohne rechtliche Funktion)" },
    { value: "eigen", label: "Nur eigene Kontrollmarken", desc: "Nur für interne Verwaltung", disabled: isNeueBundeslaender },
  ];

  return (
    <div className="space-y-4">
      <StepHeader icon="🏷️" title="Dein Wildmarken-System" onBack={onBack} />
      <InfoBox>💡 In Deutschland gibt es zwei Arten von Wildmarken: Behördliche Pflichtmarken (gesetzlich vorgeschrieben) und eigene Kontrollmarken (nur für deine interne Verwaltung, ohne rechtliche Funktion). NextHunt unterstützt beide.</InfoBox>

      {bundesland && <WildmarkenCompliance bundesland={bundesland} />}

      <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-3">
        <p className="text-xs text-green-300 leading-relaxed">
          ✅ Bundesweit gilt: § 2b Abs. 2 Tier-LMHV — Bei Schwarzwild und Dachs ist Wildmarke + Wildursprungsschein immer Pflicht wenn du die Trichinenprobe selbst entnimmst. Keine Ausnahme in keinem Bundesland.
        </p>
      </div>

      <div className="space-y-2">
        {options.map(opt => (
          <button
            key={opt.value}
            disabled={opt.disabled}
            onClick={() => set("wildmarken_system", opt.value)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              opt.disabled
                ? "opacity-40 cursor-not-allowed border-[#2a4a2a] bg-[#0f1f0f]"
                : data.wildmarken_system === opt.value
                ? "border-[#c8a84b] bg-[#c8a84b]/10"
                : "border-[#2a4a2a] hover:border-[#3a6a3a] bg-[#0f1f0f]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-4 h-4 mt-0.5 rounded-full border-2 shrink-0 flex items-center justify-center ${data.wildmarken_system === opt.value ? "border-[#c8a84b]" : "border-[#556655]"}`}>
                {data.wildmarken_system === opt.value && <div className="w-2 h-2 rounded-full bg-[#c8a84b]" />}
              </div>
              <div>
                <p className="text-sm font-medium text-[#e8e0cc]">{opt.label}</p>
                <p className="text-xs text-[#8a9a7a] mt-0.5">{opt.desc}</p>
                {opt.disabled && <p className="text-xs text-red-400 mt-1">Nicht verfügbar — in deinem Bundesland gilt Pflicht für Schalenwild</p>}
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-[#556655]">ℹ️ Eigene Kontrollmarken sind kein Ersatz für behördliche Wildmarken — sie dienen ausschließlich deiner internen Revierorganisation und haben keine rechtliche Gültigkeit.</p>

      <button onClick={() => onNext()} disabled={saving} className={GOLD_BTN}>{saving ? "Speichern..." : "Weiter →"}</button>
      <button onClick={onSkip} className={SKIP_BTN}>Standard wird automatisch nach Bundesland gesetzt</button>
    </div>
  );
}

// ── Step 6: Fertig ────────────────────────────────────────────────────────────
function StepFertig({ data, skippedSteps, onFinish, onNavigateStep, saving }) {
  const summary = [
    { step: 1, label: "Persönliche Daten", value: data.first_name ? `${data.first_name} ${data.last_name}` : null },
    { step: 2, label: "Adresse", value: data.city ? `${data.street} ${data.house_number}, ${data.zip_code} ${data.city}` : null },
    { step: 3, label: "Jagdschein", value: data.jagdschein_nummer || null },
    { step: 4, label: "Revier", value: data.revier_name || null },
    { step: 5, label: "Wildmarken-System", value: data.wildmarken_system || null },
  ];

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-xl font-bold text-[#e8e0cc]">Dein Revier ist bereit!</h2>
        <p className="text-sm text-[#8a9a7a] mt-2">NextHunt ist jetzt für dich eingerichtet. Hier ist deine Zusammenfassung:</p>
      </div>

      <div className="space-y-2">
        {summary.map(({ step, label, value }) => {
          const isSkipped = skippedSteps.includes(step) || !value;
          return (
            <div key={step} className={`flex items-center justify-between p-3 rounded-xl border ${isSkipped ? "border-[#2a4a2a] opacity-60" : "border-[#c8a84b]/30 bg-[#c8a84b]/5"}`}>
              <div>
                <p className="text-xs font-medium text-[#8a9a7a]">{label}</p>
                <p className={`text-sm ${isSkipped ? "text-[#556655]" : "text-[#e8e0cc]"}`}>
                  {value || "Nicht ausgefüllt"}
                </p>
              </div>
              {isSkipped ? (
                <button onClick={() => onNavigateStep(step)} className="text-xs text-[#c8a84b] hover:underline whitespace-nowrap ml-3">
                  Jetzt ergänzen →
                </button>
              ) : (
                <span className="text-[#c8a84b] text-sm ml-3">✓</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-2 pt-2">
        <button onClick={() => { onFinish(); }} disabled={saving} className={GOLD_BTN}>
          📊 Zum Dashboard
        </button>
        <button
          onClick={() => { onFinish(); }}
          disabled={saving}
          className="w-full py-3 border border-[#2a4a2a] text-[#8a9a7a] hover:text-[#c8a84b] hover:border-[#c8a84b] rounded-xl text-sm transition-colors"
        >
          🗺️ Revier auf Karte einzeichnen
        </button>
        <button
          onClick={() => { onFinish(); }}
          disabled={saving}
          className="w-full py-3 border border-[#2a4a2a] text-[#8a9a7a] hover:text-[#c8a84b] hover:border-[#c8a84b] rounded-xl text-sm transition-colors"
        >
          👥 Erste Mitglieder einladen
        </button>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function StepHeader({ icon, title, onBack }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      {onBack && (
        <button onClick={onBack} className="text-[#556655] hover:text-[#c8a84b] transition-colors text-lg leading-none">←</button>
      )}
      <span className="text-2xl">{icon}</span>
      <h2 className="text-lg font-bold text-[#e8e0cc]">{title}</h2>
    </div>
  );
}

function InfoBox({ children }) {
  return (
    <div className="bg-[#c8a84b]/10 border border-[#c8a84b]/30 rounded-xl p-3">
      <p className="text-xs text-[#c8a84b] leading-relaxed">{children}</p>
    </div>
  );
}