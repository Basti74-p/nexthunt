import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { Check, X, ChevronDown, ChevronRight, Globe, Package, User, Tag, FileText, Shield, HardDrive, Trash2, Zap, ClipboardList } from "lucide-react";
import OnboardingProfileSection from "@/components/settings/OnboardingProfileSection";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import EtikettSettings from "@/components/wildprodukte/EtikettSettings";
import EtikettPrintView from "@/components/wildprodukte/EtikettPrintView";
import RechnungSettings from "@/components/wildverkauf/RechnungSettings";
import RechnungPrint from "@/components/wildverkauf/RechnungPrint";
import DeleteAccountDialog from "@/components/wildverkauf/DeleteAccountDialog";
import BackupSection from "@/components/settings/BackupSection";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { Link } from "react-router-dom";

const DEFAULT_ETIKETT_SETTINGS = {
  betriebsname: "",
  adresse: "",
  logoUrl: "",
  schriftgroesse: "normal",
  zeigeLagerlocation: true,
  zeigeTemperatur: true,
  zeigeBeschreibung: true,
  zeigeEinfrierungsDatum: true,
  zeigeDruckdatum: true,
  rechnung_fusszeile: "",
  rechnung_bankverbindung: "",
  rechnung_steuernummer: "",
};

const FEATURE_LABELS = {
  feature_map: "Karte",
  feature_sightings: "Sichtungen",
  feature_strecke: "Strecke",
  feature_wildkammer: "Wildkammer",
  feature_tasks: "Aufgaben",
  feature_driven_hunt: "Gesellschaftsjagd",
  feature_public_portal: "Öffentliches Portal",
  feature_wildmarken: "Wildmarken",
};

const LANGUAGES = [
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "lt", label: "Lietuvių", flag: "🇱🇹" },
];

function AccordionSection({ icon: Icon, title, subtitle, defaultOpen = false, children, accentColor = "#22c55e" }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#222] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}18` }}>
            <Icon className="w-4 h-4" style={{ color: accentColor }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-100">{title}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 text-gray-500" />
          : <ChevronRight className="w-4 h-4 text-gray-500" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-[#2a2a2a]">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}

export default function TenantSettings() {
  const { tenant, user } = useAuth();
  const { lang, setLanguage, t } = useI18n();
  const [etikettSettings, setEtikettSettings] = useState(DEFAULT_ETIKETT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.etikett_settings) {
        setEtikettSettings({ ...DEFAULT_ETIKETT_SETTINGS, ...u.etikett_settings });
      }
    });
    const interval = setInterval(() => { base44.auth.me(); }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ etikett_settings: etikettSettings });
    setSaving(false);
  };

  if (!tenant) return null;

  return (
    <div className="max-w-3xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Einstellungen</h1>
        <p className="text-sm text-gray-500 mt-1">Mandanten-Informationen und Features</p>
      </div>

      {/* Pakete Banner */}
      <div className="flex items-center justify-between bg-[#1a2e1a] border border-[#22c55e]/30 rounded-2xl px-5 py-4 mb-5">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-[#22c55e]" />
          <div>
            <p className="text-sm font-semibold text-gray-100">Aktueller Plan: <span className="text-[#22c55e]">{tenant.plan || "—"}</span></p>
            {tenant.max_flaeche_ha && (
              <p className="text-xs text-gray-400 mt-0.5">{(tenant.gesamtflaeche_ha || 0).toFixed(1)} ha von {tenant.max_flaeche_ha.toLocaleString("de-DE")} ha genutzt</p>
            )}
          </div>
        </div>
        <Link to="/PaketePreise" className="px-4 py-2 bg-[#22c55e] text-black text-sm font-semibold rounded-xl hover:bg-[#16a34a] transition-colors shrink-0">
          Pakete ansehen
        </Link>
      </div>

      {/* Accordion Sections */}
      <AccordionSection
        icon={User}
        title="Allgemeine Informationen"
        subtitle={tenant.name}
        defaultOpen={true}
      >
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: "Name", value: tenant.name },
            { label: "Kontakt", value: tenant.contact_person || "—" },
            { label: "E-Mail", value: tenant.contact_email },
            { label: "Telefon", value: tenant.phone || "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#111] rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-500 mb-0.5">{label}</p>
              <p className="font-medium text-gray-100">{value}</p>
            </div>
          ))}
          <div className="bg-[#111] rounded-xl px-3 py-2.5">
            <p className="text-xs text-gray-500 mb-1">Plan</p>
            <StatusBadge status={tenant.plan} />
          </div>
          <div className="bg-[#111] rounded-xl px-3 py-2.5">
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <StatusBadge status={tenant.status} />
          </div>
          <div className="bg-[#111] rounded-xl px-3 py-2.5 col-span-2">
            <p className="text-xs text-gray-500 mb-0.5">Mandanten-ID</p>
            <p className="font-mono text-xs text-gray-300">{tenant.id}</p>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection
        icon={Shield}
        title="Freigeschaltete Features"
        subtitle="Übersicht der aktiven Module"
        accentColor="#6366f1"
      >
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(FEATURE_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between bg-[#111] rounded-xl px-3 py-2.5">
              <span className="text-sm text-gray-300">{label}</span>
              {tenant[key] ? (
                <span className="flex items-center gap-1 text-xs text-[#22c55e] font-medium">
                  <Check className="w-3.5 h-3.5" /> Aktiv
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                  <X className="w-3.5 h-3.5" /> Inaktiv
                </span>
              )}
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection
        icon={Tag}
        title="Etikett-Einstellungen"
        subtitle="Drucklayout für Wildprodukte"
        accentColor="#f59e0b"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EtikettSettings
            settings={etikettSettings}
            onChange={setEtikettSettings}
            onSave={handleSave}
            saving={saving}
          />
          <div>
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Vorschau</p>
            <div className="scale-90 origin-top-left">
              <EtikettPrintView
                product={{
                  wildnummer: "WP-12345678",
                  produkttyp: "filet",
                  wildart: "rehwild",
                  gewicht_kg: 1.8,
                  lager_location: "A1",
                  lager_temperatur: -18,
                  einfrierungs_datum: new Date().toISOString().split("T")[0],
                  beschreibung: "Beispiel-Produkt",
                }}
                settings={etikettSettings}
              />
            </div>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection
        icon={FileText}
        title="Rechnungs-Einstellungen"
        subtitle="Firmenangaben für Rechnungen"
        accentColor="#3b82f6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RechnungSettings
            settings={etikettSettings}
            onChange={setEtikettSettings}
            onSave={handleSave}
            saving={saving}
          />
          <div>
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Live-Vorschau</p>
            <div style={{ transform: "scale(0.45)", transformOrigin: "top left", width: "222%", pointerEvents: "none" }}>
              <RechnungPrint
                tenantSettings={etikettSettings}
                mode="rechnung"
                verkauf={{
                  rechnungsnummer: "RE-20240001",
                  datum: new Date().toISOString().split("T")[0],
                  faelligkeitsdatum: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
                  positionen: [
                    { bezeichnung: "Rehrücken (Filet)", gewicht_kg: 1.2, preis_pro_kg: 18.00, gesamtpreis: 21.60 },
                    { bezeichnung: "Wildschwein Keule", gewicht_kg: 2.5, preis_pro_kg: 12.00, gesamtpreis: 30.00 },
                  ],
                  gesamtbetrag: 51.60,
                  mwst_prozent: 7,
                  mwst_betrag: 3.61,
                  brutto_betrag: 55.21,
                  zahlungsart: "ueberweisung",
                  notizen: "Vielen Dank für Ihren Einkauf!",
                }}
                kunde={{ name: "Max Mustermann", address: "Musterstraße 1\n12345 Musterstadt", email: "max@mustermann.de" }}
              />
            </div>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection
        icon={Globe}
        title="Sprache"
        subtitle="Anzeigesprache der App"
        accentColor="#06b6d4"
      >
        <div className="flex gap-3 flex-wrap">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                lang === l.code
                  ? "border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]"
                  : "border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a] hover:text-gray-200"
              }`}
            >
              <span className="text-lg">{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection
        icon={ClipboardList}
        title="Profil & Onboarding"
        subtitle="Persönliche Daten, Jagdschein, Revier, Wildmarken"
        accentColor="#c8a84b"
      >
        <OnboardingProfileSection />
      </AccordionSection>

      <AccordionSection
        icon={HardDrive}
        title="Backup & Datensicherung"
        subtitle="Reviere sichern und wiederherstellen"
        accentColor="#8b5cf6"
      >
        <BackupSection />
      </AccordionSection>

      <AccordionSection
        icon={Trash2}
        title="Konto löschen"
        subtitle="Unwiderrufliche Löschung aller Daten"
        accentColor="#ef4444"
      >
        <p className="text-sm text-gray-400 mb-4">Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten werden dauerhaft gelöscht.</p>
        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
          Konto unwiderruflich löschen
        </Button>
      </AccordionSection>

      <DeleteAccountDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />
    </div>
  );
}