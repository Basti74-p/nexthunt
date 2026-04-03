import React, { useState, useRef } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { Check, X, Lock, Star, Zap, Mail, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

// ─── Plan Definitions ─────────────────────────────────────────────────────────

const PLAN_LABELS = {
  solo: "Solo",
  pro: "Pro",
  enterprise: "Enterprise",
  enterprise_s: "Enterprise",
  enterprise_m: "Enterprise",
  enterprise_l: "Enterprise",
  free_trial: "Free Trial",
};

const PLANS = [
  {
    key: "solo",
    name: "Solo",
    price_monthly: "7,99",
    price_yearly: "59,99",
    accent: "border-[#3a3a3a]",
    tag: null,
    tagColor: null,
    limits: "bis 800 ha · max. 5 Mitglieder",
    features: [
      { label: "Revierkarte & Einrichtungen", ok: true },
      { label: "Sichtungen & Strecke Basic", ok: true },
      { label: "Jagdkalender", ok: true },
      { label: "Einchecken & Kanzel-Reservierung", ok: true },
      { label: "PC Dashboard", ok: false },
      { label: "Wildmarken & Aufgaben", ok: false },
      { label: "Wildkammer", ok: false },
      { label: "WolfTrack", ok: false },
    ],
    addons: null,
    enterpriseExclusive: null,
    ctaLabel: "Paket anfragen",
    ctaStyle: "border border-[#3a3a3a] text-gray-300 hover:border-[#22c55e] hover:text-[#22c55e]",
  },
  {
    key: "pro",
    name: "Pro",
    price_monthly: "14,99",
    price_yearly: "119,99",
    accent: "border-[#22c55e]",
    tag: "Beliebt",
    tagColor: "bg-[#22c55e]/20 text-[#22c55e]",
    limits: "bis 3.000 ha · max. 15 Mitglieder",
    features: [
      { label: "Alles aus Solo", ok: true },
      { label: "PC Dashboard", ok: true },
      { label: "Wildmarken & Aufgaben", ok: true },
      { label: "Vollständige Streckenliste & Abschussplan", ok: true },
      { label: "Mitgliederverwaltung", ok: true },
    ],
    addons: [
      { label: "Wildkammer", price: "4,99", tooltip: "Verwalte deine gesamte Wildkammer, erstelle Rechnungen und verkaufe Wildfleisch direkt über die App." },
      { label: "Wildmanagement", price: "3,99", tooltip: null },
      { label: "Öffentlichkeit & Umfragen", price: "2,99", tooltip: null },
      { label: "Kamera & Fallenmelder", price: "4,99", tooltip: null },
    ],
    enterpriseExclusive: [
      { label: "Gesellschaftsjagd & Drückjagd", tooltip: "Plane und koordiniere Drückjagden mit automatischer Streckenerfassung und Gästeverwaltung." },
      { label: "WolfTrack", tooltip: "Dokumentiere Wolfssichtungen und Risse nach DBBW-Standard und melde direkt an Behörden." },
      { label: "API-Zugang", tooltip: "Verbinde NextHunt mit externen Systemen wie Buchhaltung, Behördenportalen oder eigenen Tools." },
    ],
    ctaLabel: "Paket anfragen",
    ctaStyle: "bg-[#22c55e] text-black hover:bg-[#16a34a]",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price_monthly: "249",
    price_yearly: "2.499",
    accent: "border-amber-500/50",
    tag: "Enterprise",
    tagColor: "bg-amber-500/20 text-amber-400",
    limits: "bis 5.000 ha · max. 50 Mitglieder",
    features: [
      { label: "Alles aus Pro inkl. aller Add-ons", ok: true },
      { label: "Wildkammer komplett mit Verkauf & Rechnungen", ok: true },
      { label: "Gesellschaftsjagd & Drückjagd", ok: true },
      { label: "Schadensprotokoll", ok: true },
      { label: "WolfTrack", ok: true },
      { label: "Lager & Wildprodukte", ok: true },
      { label: "Kundenverwaltung", ok: true },
      { label: "API-Zugang", ok: true },
      { label: "Dedizierter Support", ok: true },
      { label: "Unbegrenzte Reviere bis 5.000 ha", ok: true },
    ],
    addons: null,
    enterpriseExclusive: null,
    ctaLabel: "Kontakt aufnehmen",
    ctaStyle: "border border-amber-500/50 text-amber-400 hover:bg-amber-500/10",
    isEnterprise: true,
  },
];

// ─── Addon row with optional tooltip ─────────────────────────────────────────
function AddonRow({ label, price, tooltip }) {
  const [show, setShow] = useState(false);
  return (
    <li
      className="relative flex items-center justify-between text-xs gap-2"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="flex items-center gap-1.5 text-gray-300 cursor-default">
        <Lock className="w-3 h-3 text-[#22c55e] shrink-0" />
        {label}
        {tooltip && (
          <span className="text-[10px] text-gray-500">ℹ</span>
        )}
      </span>
      <span className="text-[#22c55e] font-medium shrink-0">+{price}€/Mo.</span>
      {show && tooltip && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-64 bg-[#111] border border-[#22c55e]/30 text-gray-200 text-xs rounded-xl p-3 shadow-2xl pointer-events-none">
          {tooltip}
        </div>
      )}
    </li>
  );
}

// ─── Locked enterprise feature ────────────────────────────────────────────────
function LockedFeature({ label, tooltip }) {
  const [show, setShow] = useState(false);
  return (
    <li
      className="relative flex items-start gap-2 text-sm cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
      <span className="text-amber-300 font-medium">{label}</span>
      <span className="ml-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full shrink-0 self-center">
        Nur Enterprise
      </span>
      {show && tooltip && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-64 bg-[#111] border border-amber-500/30 text-gray-200 text-xs rounded-xl p-3 shadow-2xl pointer-events-none">
          {tooltip}
        </div>
      )}
    </li>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, currentPlan, billing, enterpriseRef }) {
  const isCurrentPlan = currentPlan === plan.key ||
    (plan.key === "enterprise" && ["enterprise_s", "enterprise_m", "enterprise_l"].includes(currentPlan));
  const isEnterprise = !!plan.isEnterprise;
  const price = billing === "monthly" ? plan.price_monthly : plan.price_yearly;
  const period = billing === "monthly" ? "/Monat" : "/Jahr";

  const handleCta = () => {
    const subject = isEnterprise
      ? "Upgrade Anfrage — Enterprise"
      : `Upgrade Anfrage — ${plan.name}`;
    window.location.href = `mailto:info@nexthunt-portal.de?subject=${encodeURIComponent(subject)}`;
  };

  return (
    <div
      ref={isEnterprise ? enterpriseRef : null}
      className={`relative flex flex-col rounded-2xl border-2 p-5 transition-all
        ${plan.accent}
        ${isEnterprise ? "bg-gradient-to-b from-amber-950/30 to-[#1a1a1a]" : "bg-[#1a1a1a]"}
        ${isCurrentPlan ? "ring-2 ring-[#22c55e]/40" : ""}
      `}
    >
      {/* Tag & current badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1">
          {plan.tag && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${plan.tagColor}`}>
              {plan.tag}
            </span>
          )}
          <h2 className={`text-lg font-bold ${isEnterprise ? "text-amber-400" : "text-gray-100"}`}>{plan.name}</h2>
        </div>
        {isCurrentPlan && (
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#22c55e]/20 text-[#22c55e] px-2 py-0.5 rounded-full shrink-0">
            Ihr Plan
          </span>
        )}
      </div>

      {/* Price */}
      <div className="mb-1">
        <span className={`text-3xl font-bold ${isEnterprise ? "text-amber-300" : "text-gray-100"}`}>{price}€</span>
        <span className="text-gray-400 text-sm ml-1">{period}</span>
      </div>
      <p className="text-xs text-gray-500 mb-4">{plan.limits}</p>

      {/* Features */}
      <ul className="space-y-2 flex-1 mb-4">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            {f.ok
              ? <Check className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
              : <X className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />}
            <span className={f.ok ? "text-gray-200" : "text-gray-500"}>{f.label}</span>
          </li>
        ))}

        {/* Enterprise-exclusive locked features */}
        {plan.enterpriseExclusive?.map((f, i) => (
          <LockedFeature key={i} label={f.label} tooltip={f.tooltip} />
        ))}
      </ul>

      {/* Add-ons */}
      {plan.addons && (
        <div className="mb-4 border-t border-[#2a2a2a] pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Add-ons zubuchbar</p>
          <ul className="space-y-2">
            {plan.addons.map((a, i) => (
              <AddonRow key={i} label={a.label} price={a.price} tooltip={a.tooltip} />
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleCta}
        disabled={isCurrentPlan}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${plan.ctaStyle} ${
          isCurrentPlan ? "opacity-40 cursor-default" : "cursor-pointer"
        }`}
      >
        {isCurrentPlan ? "Aktueller Plan" : plan.ctaLabel}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PaketePreise() {
  const { tenant } = useAuth();
  const [billing, setBilling] = useState("monthly");
  const enterpriseRef = useRef(null);

  const currentPlan = tenant?.plan || "free_trial";
  const isPro = currentPlan === "pro";
  const gesamtflaeche = tenant?.gesamtflaeche_ha || 0;
  const maxFlaeche = tenant?.max_flaeche_ha || 3000;

  const scrollToEnterprise = () => {
    enterpriseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const displayPlanLabel = PLAN_LABELS[currentPlan] || currentPlan;

  return (
    <div className="max-w-5xl mx-auto pb-28">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Pakete & Preise</h1>
        <p className="text-sm text-gray-400">Wähle das passende Paket für dein Revier.</p>
      </div>

      {/* Current plan banner */}
      <div className="mb-5 flex items-center gap-3 bg-[#1a2e1a] border border-[#22c55e]/30 rounded-xl px-5 py-3">
        <Zap className="w-4 h-4 text-[#22c55e] shrink-0" />
        <div>
          <span className="text-sm text-gray-200">
            Ihr aktuelles Paket:{" "}
            <span className="font-bold text-[#22c55e]">{displayPlanLabel}</span>
          </span>
          {tenant?.max_flaeche_ha && (
            <p className="text-xs text-gray-400 mt-0.5">
              {gesamtflaeche.toFixed(1)} ha von {maxFlaeche.toLocaleString("de-DE")} ha genutzt
            </p>
          )}
        </div>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-[#22c55e]/20 text-[#22c55e] px-2 py-0.5 rounded-full">
          Aktiv
        </span>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center gap-2 mb-6 justify-center">
        <button
          onClick={() => setBilling("monthly")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            billing === "monthly" ? "bg-[#22c55e] text-black" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Monatlich
        </button>
        <button
          onClick={() => setBilling("yearly")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            billing === "yearly" ? "bg-[#22c55e] text-black" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Jährlich
          <span className="ml-1.5 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">-20%</span>
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.key}
            plan={plan}
            currentPlan={currentPlan}
            billing={billing}
            enterpriseRef={plan.isEnterprise ? enterpriseRef : null}
          />
        ))}
      </div>

      {/* Over 5k ha CTA */}
      <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-6 py-4 mb-6">
        <div>
          <p className="text-sm font-semibold text-gray-100">Über 5.000 ha?</p>
          <p className="text-xs text-gray-400 mt-0.5">Wir erstellen dir ein individuelles Angebot.</p>
        </div>
        <button
          onClick={() => window.location.href = "mailto:info@nexthunt-portal.de?subject=" + encodeURIComponent("Anfrage Enterprise Plus")}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-sm font-semibold hover:bg-amber-500/20 transition-colors"
        >
          <Mail className="w-4 h-4" />
          Kontakt aufnehmen
        </button>
      </div>

      {/* Trial notice */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-400 border border-[#2a2a2a] rounded-xl py-4 px-6 bg-[#1a1a1a] mb-4">
        <Star className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong className="text-gray-200">7 Tage kostenlos testen</strong> — keine Kreditkarte erforderlich.{" "}
          <a href="mailto:info@nexthunt-portal.de?subject=Free%20Trial%20Anfrage" className="text-[#22c55e] hover:underline">
            Jetzt anfragen
          </a>
        </span>
      </div>

      <div className="text-center">
        <Link to="/TenantSettings" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          ← Zurück zu den Einstellungen
        </Link>
      </div>

      {/* Sticky PRO banner */}
      {isPro && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-950/90 to-[#1a1a1a]/95 backdrop-blur-md border-t border-amber-500/30 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-sm text-gray-200 truncate">
              Du nutzt bereits <strong className="text-[#22c55e]">{gesamtflaeche.toFixed(1)} von {maxFlaeche.toLocaleString("de-DE")} ha</strong> — entdecke was Enterprise dir noch bietet
            </p>
          </div>
          <button
            onClick={scrollToEnterprise}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-black text-sm font-bold rounded-xl hover:bg-amber-400 transition-colors shrink-0"
          >
            Enterprise entdecken <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}