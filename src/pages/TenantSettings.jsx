import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { Check, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EtikettSettings from "@/components/wildprodukte/EtikettSettings";
import EtikettPrintView from "@/components/wildprodukte/EtikettPrintView";
import RechnungSettings from "@/components/wildverkauf/RechnungSettings";
import RechnungPrint from "@/components/wildverkauf/RechnungPrint";
import { base44 } from "@/api/base44Client";

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

export default function TenantSettings() {
  const { tenant } = useAuth();
  const [etikettSettings, setEtikettSettings] = useState(DEFAULT_ETIKETT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.etikett_settings) {
        setEtikettSettings({ ...DEFAULT_ETIKETT_SETTINGS, ...u.etikett_settings });
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ etikett_settings: etikettSettings });
    setSaving(false);
  };

  if (!tenant) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Einstellungen" subtitle="Mandanten-Informationen und Features" />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Allgemein</h2>
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
          <div><span className="text-gray-500">Name</span><p className="font-medium text-gray-900 mt-0.5">{tenant.name}</p></div>
          <div><span className="text-gray-500">Kontakt</span><p className="font-medium text-gray-900 mt-0.5">{tenant.contact_person || "—"}</p></div>
          <div><span className="text-gray-500">E-Mail</span><p className="font-medium text-gray-900 mt-0.5">{tenant.contact_email}</p></div>
          <div><span className="text-gray-500">Telefon</span><p className="font-medium text-gray-900 mt-0.5">{tenant.phone || "—"}</p></div>
          <div><span className="text-gray-500">Plan</span><div className="mt-1"><StatusBadge status={tenant.plan} /></div></div>
          <div><span className="text-gray-500">Status</span><div className="mt-1"><StatusBadge status={tenant.status} /></div></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Etikett-Einstellungen</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Rechnungs-Vorlage</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
        <div className="space-y-3">
          {Object.entries(FEATURE_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{label}</span>
              {tenant[key] ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><Check className="w-3.5 h-3.5" /> Aktiviert</span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-400 font-medium"><X className="w-3.5 h-3.5" /> Deaktiviert</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}