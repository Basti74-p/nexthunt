import React from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const ZAHLUNGSART_LABEL = { bar: "Bar", ueberweisung: "Überweisung", ec: "EC-Karte", sonstiges: "Sonstiges" };

const FONT_SIZE = { klein: "11px", normal: "13px", gross: "15px" };

export default function RechnungPrint({ verkauf, kunde, tenantSettings, mode = "rechnung" }) {
  const isLieferschein = mode === "lieferschein";
  const docTitle = isLieferschein ? "LIEFERSCHEIN" : "RECHNUNG";
  const docNr = isLieferschein
    ? `LS-${verkauf.rechnungsnummer?.replace("RE-", "") || verkauf.id?.slice(-8)}`
    : (verkauf.rechnungsnummer || `RE-${verkauf.id?.slice(-8)}`);

  const accentColor = tenantSettings?.rechnung_farbe || "#1a1a1a";
  const fontSize = FONT_SIZE[tenantSettings?.rechnung_schriftgroesse] || "13px";

  const formatDate = (d) => {
    if (!d) return "–";
    try { return format(new Date(d), "dd.MM.yyyy", { locale: de }); } catch { return d; }
  };

  return (
    <div className="w-full bg-white text-black font-sans" style={{ width: "210mm", minHeight: "297mm", padding: "10mm 12mm", boxSizing: "border-box", fontSize, margin: "0 auto" }}>

      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          {tenantSettings?.logoUrl && (
            <img src={tenantSettings.logoUrl} alt="Logo" className="h-8 object-contain mb-1"
              onError={(e) => { e.target.style.display = "none"; }} />
          )}
          <p className="font-bold text-base">{tenantSettings?.betriebsname || "Jagdbetrieb"}</p>
          {tenantSettings?.adresse && <p className="text-xs text-gray-600 whitespace-pre-line">{tenantSettings.adresse}</p>}
          {tenantSettings?.rechnung_kontakt && <p className="text-xs text-gray-600">{tenantSettings.rechnung_kontakt}</p>}
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold uppercase tracking-wide" style={{ color: accentColor }}>{docTitle}</h1>
          <p className="text-sm text-gray-600 mt-1">Nr.: <span className="font-mono font-bold text-black">{docNr}</span></p>
          <p className="text-sm text-gray-600">Datum: {formatDate(verkauf.datum)}</p>
          {!isLieferschein && verkauf.faelligkeitsdatum && (
            <p className="text-sm text-gray-600">Fällig: {formatDate(verkauf.faelligkeitsdatum)}</p>
          )}
        </div>
      </div>

      {/* Empfänger */}
      <div className="mb-5 pl-3" style={{ borderLeft: `3px solid ${accentColor}` }}>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Empfänger</p>
        <p className="font-bold text-sm">{kunde?.name || verkauf.kunde_name || "–"}</p>
        {kunde?.contact_person && <p className="text-sm">{kunde.contact_person}</p>}
        {kunde?.address && <p className="text-sm text-gray-700 whitespace-pre-line">{kunde.address}</p>}
        {kunde?.email && <p className="text-sm text-gray-600">{kunde.email}</p>}
      </div>

      {/* Positionen */}
      <table className="w-full text-xs mb-4" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${accentColor}` }}>
            <th className="text-left py-2 font-semibold">Bezeichnung</th>
            <th className="text-right py-2 font-semibold">Gewicht (kg)</th>
            {!isLieferschein && (
              <>
                <th className="text-right py-2 font-semibold">€/kg</th>
                <th className="text-right py-2 font-semibold">Gesamt</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {(verkauf.positionen || []).map((pos, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #e5e5e5" }}>
              <td className="py-2">{pos.bezeichnung}</td>
              <td className="text-right py-2">{pos.gewicht_kg?.toFixed(2)}</td>
              {!isLieferschein && (
                <>
                  <td className="text-right py-2">€ {pos.preis_pro_kg?.toFixed(2)}</td>
                  <td className="text-right py-2 font-medium">€ {pos.gesamtpreis?.toFixed(2)}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summen (nur Rechnung) */}
      {!isLieferschein && (
        <div className="ml-auto w-56 space-y-0.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Nettobetrag</span>
            <span>€ {(verkauf.gesamtbetrag || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">MwSt. {verkauf.mwst_prozent || 7}%</span>
            <span>€ {(verkauf.mwst_betrag || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base" style={{ borderTop: `2px solid ${accentColor}`, paddingTop: "6px", marginTop: "6px" }}>
            <span>Gesamtbetrag</span>
            <span>€ {(verkauf.brutto_betrag || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600 text-xs pt-1">
            <span>Zahlungsart</span>
            <span>{ZAHLUNGSART_LABEL[verkauf.zahlungsart] || verkauf.zahlungsart}</span>
          </div>
        </div>
      )}

      {/* Notizen */}
      {verkauf.notizen && (
        <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-700">
          <p className="font-semibold mb-1">Hinweise:</p>
          <p>{verkauf.notizen}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6">
        {tenantSettings?.rechnung_bankverbindung && (
          <div className="mb-1.5 text-xs text-gray-600 whitespace-pre-line">
            <span className="font-semibold">Bankverbindung:</span>{"\n"}{tenantSettings.rechnung_bankverbindung}
          </div>
        )}
        {tenantSettings?.rechnung_steuernummer && (
          <p className="text-xs text-gray-600 mb-2">
            <span className="font-semibold">Steuernummer:</span> {tenantSettings.rechnung_steuernummer}
          </p>
        )}
        {tenantSettings?.rechnung_fusszeile && (
          <p className="text-xs text-gray-600 italic mb-4">{tenantSettings.rechnung_fusszeile}</p>
        )}
        <div className="pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
          {tenantSettings?.betriebsname || "Jagdbetrieb"} · Erstellt am {formatDate(new Date().toISOString().split("T")[0])}
        </div>
      </div>

      <style>{`
        @page {
          margin: 0;
          size: A4;
        }
        @media print {
          html { margin: 0; padding: 0; }
          body { margin: 0; padding: 0; background: white; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          a[href]:after { content: none !important; }
          .no-print { display: none !important; }
          .line-clamp-2, .line-clamp-3 { -webkit-line-clamp: unset !important; }
        }
        @media (max-width: 768px) {
          body { font-size: 12px; }
        }
      `}</style>
    </div>
  );
}