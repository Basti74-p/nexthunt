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

export default function EtikettPrintView({ product }) {
  return (
    <div className="w-full h-full bg-white p-0 flex items-center justify-center">
      <div className="w-96 bg-white border-2 border-black p-6 rounded-none" style={{ pageBreakAfter: 'always' }}>
        {/* Etikett für Wildprodukt */}
        <div className="text-center space-y-3 font-mono">
          <div className="text-xl font-bold border-b-2 border-black pb-2">
            WILDPRODUKT
          </div>
          
          <div className="border-2 border-black p-4 space-y-2">
            <div className="text-2xl font-bold text-center mb-4">
              {product.wildnummer}
            </div>
            
            <div className="text-sm space-y-1">
              <div><span className="font-bold">Produkttyp:</span> {PRODUKTTYPEN[product.produkttyp]}</div>
              <div><span className="font-bold">Gewicht:</span> {product.gewicht_kg} kg</div>
              <div><span className="font-bold">Lagerlocation:</span> {product.lager_location}</div>
              <div><span className="font-bold">Temperatur:</span> {product.lager_temperatur}°C</div>
              <div><span className="font-bold">Eingefrorenes:</span> {product.einfrierungs_datum}</div>
              {product.beschreibung && (
                <div><span className="font-bold">Beschreibung:</span> {product.beschreibung}</div>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-600 border-t-2 border-black pt-2 mt-3">
            Erstellt: {new Date().toLocaleDateString('de-DE')}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}