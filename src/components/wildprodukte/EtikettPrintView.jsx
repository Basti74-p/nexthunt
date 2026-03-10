import React from "react";

const PRODUKTTYPEN = {
  filet: "Filet",
  keule: "Keule",
  rind: "Rind",
  schnitzel: "Schnitzel",
  wurst: "Wurst",
  schinken: "Schinken",
  sonstiges: "Sonstiges"
};

const WILDARTEN = {
  rotwild: "Rotwild",
  schwarzwild: "Schwarzwild",
  rehwild: "Rehwild",
  damwild: "Damwild",
  sikawild: "Sikawild",
  wolf: "Wolf"
};

const FONT_SIZES = {
  klein: { title: "text-base", number: "text-xl", body: "text-xs" },
  normal: { title: "text-xl", number: "text-2xl", body: "text-sm" },
  gross: { title: "text-2xl", number: "text-3xl", body: "text-base" },
};

export default function EtikettPrintView({ product, settings }) {
  const fs = FONT_SIZES[settings?.schriftgroesse || "normal"];

  return (
    <div className="w-full flex items-center justify-center bg-white">
      <div className="w-96 bg-white border-2 border-black p-6" style={{ pageBreakAfter: 'always' }}>
        <div className={`space-y-3 font-mono`}>

          {/* Header: Logo + Betriebsname */}
          <div className="flex items-center gap-3 border-b-2 border-black pb-3">
            {settings?.logoUrl && (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="h-10 w-10 object-contain"
                onError={e => e.target.style.display = 'none'}
              />
            )}
            <div>
              {settings?.betriebsname && (
                <div className={`font-bold ${fs.title}`}>{settings.betriebsname}</div>
              )}
              {settings?.adresse && (
                <div className="text-xs text-gray-600">{settings.adresse}</div>
              )}
            </div>
            {!settings?.betriebsname && !settings?.logoUrl && (
              <div className={`font-bold ${fs.title} w-full text-center`}>WILDPRODUKT</div>
            )}
          </div>

          {/* Wildnummer */}
          <div className={`font-bold text-center ${fs.number} py-2`}>
            {product.wildnummer}
          </div>

          {/* Produktdaten */}
          <div className={`border border-black p-3 space-y-1 ${fs.body}`}>
            <div><span className="font-bold">Produkttyp:</span> {PRODUKTTYPEN[product.produkttyp]}</div>
            <div><span className="font-bold">Gewicht:</span> {product.gewicht_kg} kg</div>

            {settings?.zeigeLagerlocation !== false && product.lager_location && (
              <div><span className="font-bold">Lagerlocation:</span> {product.lager_location}</div>
            )}
            {settings?.zeigeTemperatur !== false && (
              <div><span className="font-bold">Temperatur:</span> {product.lager_temperatur}°C</div>
            )}
            {settings?.zeigeEinfrierungsDatum !== false && (
              <div><span className="font-bold">Eingefrorenes:</span> {product.einfrierungs_datum}</div>
            )}
            {settings?.zeigeBeschreibung !== false && product.beschreibung && (
              <div><span className="font-bold">Beschreibung:</span> {product.beschreibung}</div>
            )}
          </div>

          {/* Freitext-Felder */}
          {(settings?.empfaenger || settings?.eigeneNotiz) && (
            <div className={`border-t border-gray-400 pt-2 space-y-1 ${fs.body}`}>
              {settings.empfaenger && (
                <div><span className="font-bold">Empfänger:</span> {settings.empfaenger}</div>
              )}
              {settings.eigeneNotiz && (
                <div><span className="font-bold">Notiz:</span> {settings.eigeneNotiz}</div>
              )}
            </div>
          )}

          {/* Footer */}
          {settings?.zeigeDruckdatum !== false && (
            <div className="text-xs text-gray-500 border-t border-black pt-2 text-right">
              {new Date().toLocaleDateString('de-DE')}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; padding: 0; background: white; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}