import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { Check, X, Star, Mail, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const PLANS = [
  {
    key: "solo",
    name: "Solo",
    price_monthly: "7,99",
    price_yearly: "59,99",
    color: "border-[#3a3a3a]",
    badge: null,
    features: [
      { label: "Revierkarte & Einrichtungen", ok: true },
      { label: "Einchecken & Kanzel-Reservierung", ok: true },
      { label: "Jagdwetter & Wildaktivität", ok: true },
      { label: "Sichtungen Basic", ok: true },
      { label: "Streckenliste Basic", ok: true },
      { label: "Jagdkalender", ok: true },
      { label: "1 Revier / max. 5 Mitglieder", ok: true },
      { label: "PC Dashboard", ok: false },
      { label: "Wildkammer", ok: false },
      { label: "WolfTrack", ok: false },
    ],
    addons: null,
    cta: "Paket anfragen",
    ctaStyle: "border border-[#3a3a3a] text-gray-300 hover:border-[#22c55e] hover:text-[#22c55e]",
  },
  {
    key: "pro",
    name: "Pro",
    price_monthly: "14,99",
    price_yearly: "119,99",
    color: "border-[#22c55e]",
    badge: "Beliebt",
    features: [
      { label: "Alles aus Solo", ok: true },
      { label: "PC Dashboard", ok: true },
      { label: "Einrichtungs- & Mitgliederverwaltung", ok: true },
      { label: "Vollständige Streckenliste & Abschussplan", ok: true },
      { label: "Wildmarken", ok: true },
      { label: "Aufgabenverwaltung", ok: true },
      { label: "Personen", ok: true },
      { label: "3 Reviere / max. 15 Mitglieder", ok: true },
      { label: "Wildkammer", ok: false },
      { label: "WolfTrack", ok: false },
      { label: "Gesellschaftsjagd", ok: false },
    ],
    addons: [
      { label: "Wildmanagement", price: "3,99" },
      { label: "Öffentlichkeit & Umfragen", price: "2,99" },
      { label: "Kamera & Fallenmelder", price: "4,99" },
      { label: "Wildkammer Basic", price: "4,99" },
    ],
    cta: "Paket anfragen",
    ctaStyle: "bg-[#22c55e] text-black hover:bg-[#16a34a]",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price_monthly: "149",
    price_yearly: "999",
    color: "border-amber-500/50",
    badge: "Vollständig",
    features: [
      { label: "Alles aus Pro", ok: true },
      { label: "Wildkammer komplett", ok: true },
      { label: "Lager & Verkauf", ok: true },
      { label: "Kundenverwaltung", ok: true },
      { label: "Gesellschaftsjagd & Drückjagd", ok: true },
      { label: "Schadensprotokoll", ok: true },
      { label: "WolfTrack komplett", ok: true },
      { label: "Backup & API-Zugang", ok: true },
      { label: "Unbegrenzte Reviere & Mitglieder", ok: true },
      { label: "Dedizierter Support", ok: true },
    ],
    addons: null,
    cta: "Kontakt aufnehmen",
    ctaStyle: "border border-amber-500/50 text-amber-400 hover:bg-amber-500/10",
    ctaEmail: true,
  },
];

const PLAN_LABELS = {
  solo: "Solo",
  pro: "Pro",
  enterprise: "Enterprise",
  free_trial: "Free Trial",
  starter: "Starter",
};

export default function PaketePreise() {
  const { tenant } = useAuth();
  const [billing, setBilling] = useState("monthly");

  const currentPlan = tenant?.plan || "free_trial";

  const handleCta = (plan) => {
    const subject = plan.ctaEmail
      ? "Enterprise Anfrage — NextHunt"
      : `Upgrade Anfrage — ${plan.name}`;
    window.location.href = `mailto:info@nexthunt-portal.de?subject=${encodeURIComponent(subject)}`;
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Pakete & Preise</h1>
        <p className="text-sm text-gray-400">Wähle das passende Paket für dein Revier.</p>
      </div>

      {/* Current plan banner */}
      {currentPlan && (
        <div className="mb-6 flex items-center gap-3 bg-[#1a2e1a] border border-[#22c55e]/30 rounded-xl px-5 py-3">
          <Zap className="w-4 h-4 text-[#22c55e] shrink-0" />
          <p className="text-sm text-gray-200">
            Ihr aktuelles Paket:{" "}
            <span className="font-bold text-[#22c55e]">{PLAN_LABELS[currentPlan] || currentPlan}</span>
          </p>
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider bg-[#22c55e]/20 text-[#22c55e] px-2 py-0.5 rounded-full">
            Aktiv
          </span>
        </div>
      )}

      {/* Billing toggle */}
      <div className="flex items-center gap-3 mb-8 justify-center">
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
          <span className="ml-1.5 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">-20%</span>
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.key;
          const price = billing === "monthly" ? plan.price_monthly : plan.price_yearly;
          const period = billing === "monthly" ? "/Monat" : "/Jahr";
          const isEnterprise = plan.key === "enterprise";

          return (
            <div
              key={plan.key}
              className={`relative flex flex-col rounded-2xl border-2 bg-[#1a1a1a] p-6 transition-all ${plan.color} ${
                isEnterprise ? "bg-gradient-to-b from-amber-950/30 to-[#1a1a1a]" : ""
              } ${isCurrentPlan ? "ring-2 ring-[#22c55e]/40" : ""}`}
            >
              {/* Badges */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  {plan.badge && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 inline-block ${
                      isEnterprise ? "bg-amber-500/20 text-amber-400" : "bg-[#22c55e]/20 text-[#22c55e]"
                    }`}>
                      {plan.badge}
                    </span>
                  )}
                  <h2 className={`text-xl font-bold ${isEnterprise ? "text-amber-400" : "text-gray-100"}`}>
                    {plan.name}
                  </h2>
                </div>
                {isCurrentPlan && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#22c55e]/20 text-[#22c55e] px-2 py-0.5 rounded-full shrink-0">
                    Ihr Plan
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className={`text-3xl font-bold ${isEnterprise ? "text-amber-300" : "text-gray-100"}`}>
                  {price}€
                </span>
                <span className="text-gray-400 text-sm ml-1">{period}</span>
                {billing === "yearly" && (
                  <p className="text-xs text-gray-500 mt-0.5">zzgl. MwSt. — bei jährlicher Zahlung</p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {f.ok ? (
                      <Check className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                    )}
                    <span className={f.ok ? "text-gray-200" : "text-gray-500"}>{f.label}</span>
                  </li>
                ))}
              </ul>

              {/* Add-ons */}
              {plan.addons && (
                <div className="mb-5 border-t border-[#2a2a2a] pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Add-ons zubuchbar</p>
                  <ul className="space-y-1.5">
                    {plan.addons.map((a, i) => (
                      <li key={i} className="flex items-center justify-between text-xs">
                        <span className="text-gray-300">{a.label}</span>
                        <span className="text-[#22c55e] font-medium">{a.price}€/Monat</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA Button */}
              <button
                onClick={() => handleCta(plan)}
                disabled={isCurrentPlan && !isEnterprise}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${plan.ctaStyle} ${
                  isCurrentPlan && !isEnterprise ? "opacity-40 cursor-default" : "cursor-pointer"
                }`}
              >
                {isCurrentPlan && !isEnterprise ? "Aktueller Plan" : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trial notice */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-400 border border-[#2a2a2a] rounded-xl py-4 px-6 bg-[#1a1a1a]">
        <Star className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong className="text-gray-200">7 Tage kostenlos testen</strong> — keine Kreditkarte erforderlich.{" "}
          <a href="mailto:info@nexthunt-portal.de" className="text-[#22c55e] hover:underline">
            Jetzt anfragen
          </a>
        </span>
      </div>

      {/* Back link */}
      <div className="mt-6 text-center">
        <Link to="/TenantSettings" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          ← Zurück zu den Einstellungen
        </Link>
      </div>
    </div>
  );
}