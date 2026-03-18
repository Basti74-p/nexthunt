import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";

const LANGUAGES = [
  {
    code: "de",
    label: "Deutsch",
    flag: "🇩🇪",
    subtitle: "German",
  },
  {
    code: "en",
    label: "English",
    flag: "🇬🇧",
    subtitle: "Englisch",
  },
  {
    code: "lt",
    label: "Lietuvių",
    flag: "🇱🇹",
    subtitle: "Litauisch",
  },
];

export default function LanguageSelector() {
  const { setLanguage, t } = useI18n();
  const [selected, setSelected] = React.useState("de");

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c370741b119950032ab62/7a1f75278_NextHunt_logo_transparent.png"
            alt="NextHunt Logo"
            className="w-40 h-auto"
          />
        </div>

        <h1 className="text-2xl font-bold text-gray-100 text-center mb-1">
          {t("sprache_waehlen")}
        </h1>
        <p className="text-sm text-gray-400 text-center mb-8">
          {t("sprache_waehlen_subtitle")}
        </p>

        <div className="space-y-3 mb-8">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelected(lang.code)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all text-left ${
                selected === lang.code
                  ? "border-[#22c55e] bg-[#22c55e]/10"
                  : "border-[#3a3a3a] bg-[#2d2d2d] hover:border-[#4a4a4a]"
              }`}
            >
              <span className="text-3xl">{lang.flag}</span>
              <div className="flex-1">
                <p className={`text-base font-semibold ${selected === lang.code ? "text-[#22c55e]" : "text-gray-100"}`}>
                  {lang.label}
                </p>
                <p className="text-xs text-gray-500">{lang.subtitle}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                selected === lang.code ? "border-[#22c55e]" : "border-[#5a5a5a]"
              }`}>
                {selected === lang.code && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setLanguage(selected)}
          className="w-full py-3.5 rounded-2xl bg-[#22c55e] text-black font-semibold text-base hover:bg-[#16a34a] transition-colors"
        >
          {t("weiter_btn")} →
        </button>
      </div>
    </div>
  );
}