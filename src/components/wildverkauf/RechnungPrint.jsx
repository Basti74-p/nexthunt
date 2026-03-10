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
    <div className="w-full bg-white text-black font-sans" style={{ width: "210mm", minHeight: "297mm", padding: "15mm 15mm", boxSizing: "border-box", fontSize: "11px", margin: "0 auto" }}>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          {tenantSettings?.logoUrl && (
            <img src={tenantSettings.logoUrl} alt="Logo" style={{ height: "25px", marginBottom: "4px" }}
              onError={(e) => { e.target.style.display = "none"; }} />
          )}
          <p style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "2px" }}>{tenantSettings?.betriebsname || "Jagdbetrieb"}</p>
          {tenantSettings?.adresse && <p style={{ fontSize: "10px", color: "#4b5563", whiteSpace: "pre-line", lineHeight: "1.3" }}>{tenantSettings.adresse}</p>}
          {tenantSettings?.rechnung_kontakt && <p style={{ fontSize: "10px", color: "#4b5563" }}>{tenantSettings.rechnung_kontakt}</p>}
        </div>
        <div style={{ textAlign: "right" }}>
          <h1 style={{ color: accentColor, fontSize: "20px", fontWeight: "bold", letterSpacing: "1px", marginBottom: "4px" }}>{docTitle}</h1>
          <p style={{ fontSize: "11px", color: "#4b5563", marginBottom: "2px" }}>Nr.: <span style={{ fontFamily: "monospace", fontWeight: "bold", color: "black" }}>{docNr}</span></p>
          <p style={{ fontSize: "11px", color: "#4b5563" }}>Datum: {formatDate(verkauf.datum)}</p>
          {!isLieferschein && verkauf.faelligkeitsdatum && (
            <p style={{ fontSize: "11px", color: "#4b5563" }}>Fällig: {formatDate(verkauf.faelligkeitsdatum)}</p>
          )}
        </div>
      </div>

      {/* Empfänger */}
      <div style={{ marginBottom: "16px", paddingLeft: "10px", borderLeft: `3px solid ${accentColor}` }}>
        <p style={{ fontSize: "9px", color: "#7b8ba3", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", fontWeight: "bold" }}>Empfänger</p>
        <p style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "2px" }}>{kunde?.name || verkauf.kunde_name || "–"}</p>
        {kunde?.contact_person && <p style={{ fontSize: "11px", marginBottom: "2px" }}>{kunde.contact_person}</p>}
        {kunde?.address && <p style={{ fontSize: "11px", color: "#374151", whiteSpace: "pre-line", lineHeight: "1.3", marginBottom: "2px" }}>{kunde.address}</p>}
        {kunde?.email && <p style={{ fontSize: "11px", color: "#4b5563" }}>{kunde.email}</p>}
      </div>

      {/* Positionen */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px", fontSize: "11px" }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${accentColor}` }}>
            <th style={{ textAlign: "left", paddingBottom: "6px", fontWeight: "bold" }}>Bezeichnung</th>
            <th style={{ textAlign: "right", paddingBottom: "6px", fontWeight: "bold" }}>Gewicht (kg)</th>
            {!isLieferschein && (
              <>
                <th style={{ textAlign: "right", paddingBottom: "6px", fontWeight: "bold" }}>€/kg</th>
                <th style={{ textAlign: "right", paddingBottom: "6px", fontWeight: "bold" }}>Gesamt</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {(verkauf.positionen || []).map((pos, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #e5e5e5" }}>
              <td style={{ paddingTop: "4px", paddingBottom: "4px" }}>{pos.bezeichnung}</td>
              <td style={{ textAlign: "right", paddingTop: "4px", paddingBottom: "4px" }}>{pos.gewicht_kg?.toFixed(2)}</td>
              {!isLieferschein && (
                <>
                  <td style={{ textAlign: "right", paddingTop: "4px", paddingBottom: "4px" }}>€ {pos.preis_pro_kg?.toFixed(2)}</td>
                  <td style={{ textAlign: "right", paddingTop: "4px", paddingBottom: "4px", fontWeight: "bold" }}>€ {pos.gesamtpreis?.toFixed(2)}</td>
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
        }
      `}</style>
    </div>
  );
}