import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c370741b119950032ab62/7a1f75278_NextHunt_logo_transparent.png";

// Hochauflösend: 10px pro mm (300dpi ≈ 11.8px/mm, wir nutzen 10 für saubere Rechnung)
const PX_PER_MM = 10;

function mm(v) { return v * PX_PER_MM; }

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function generateLabelCanvas(nummer) {
  // Etikett: 50x30mm → 500x300px bei 10px/mm
  const W = mm(50);
  const H = mm(30);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Weißer Hintergrund
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // === QR-Code Seite (x: 9.5mm bis 28.5mm, also 19mm breit) ===
  const qrAreaX = mm(9.5);
  const qrAreaW = mm(19);
  const qrSize = mm(17);
  const qrX = qrAreaX + (qrAreaW - qrSize) / 2;
  const qrY = (H - qrSize) / 2;

  // QR-Code mit hoher Auflösung generieren
  const qrCanvas = document.createElement("canvas");
  // Intern größer rendern für Schärfe, dann skalieren
  await QRCode.toCanvas(qrCanvas, `https://nexthunt-portal.de/wm/${nummer}`, {
    errorCorrectionLevel: "H",
    width: qrSize,
    margin: 0,
    color: { dark: "#000000", light: "#ffffff" },
  });
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  // Logo-Overlay im QR-Code (5x5mm, zentriert)
  const overlaySize = mm(5);
  const overlayPad = mm(0.3);
  const overlayR = mm(0.5);
  const overlayX = qrX + (qrSize - overlaySize) / 2;
  const overlayY = qrY + (qrSize - overlaySize) / 2;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(overlayX - overlayPad, overlayY - overlayPad, overlaySize + overlayPad * 2, overlaySize + overlayPad * 2, overlayR);
  ctx.fill();
  ctx.restore();

  const logo = await loadImage(LOGO_URL);
  ctx.drawImage(logo, overlayX, overlayY, overlaySize, overlaySize);

  // === Falzlinie (x: 28.5mm und 30.5mm) ===
  ctx.save();
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 0.5;
  ctx.setLineDash([mm(1), mm(0.8)]);
  [mm(28.5), mm(30.5)].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  });
  ctx.restore();

  // === Info-Seite (x: 30.5mm, w: 19mm) — Text um 90° gedreht ===
  // Die Info-Seite soll hochkant gelesen werden (von unten nach oben)
  // Wir drehen den Canvas-Kontext um -90° um den Mittelpunkt der Info-Seite

  const infoX = mm(30.5);
  const infoW = mm(19);
  const infoCenterX = infoX + infoW / 2;
  const infoCenterY = H / 2;

  ctx.save();
  // Rotationspunkt: Mitte der Info-Seite
  ctx.translate(infoCenterX, infoCenterY);
  ctx.rotate(-Math.PI / 2); // -90° = von unten nach oben lesbar
  // Nach der Rotation: "x" ist jetzt die alte "y"-Achse
  // Die Info-Seite hat jetzt virtuell Breite=H (30mm) und Höhe=infoW (19mm)
  const virtualW = H;    // 30mm
  const virtualH = infoW; // 19mm
  const pad = mm(1);

  // Logo (10mm breit)
  const logoW = mm(10);
  const logoRatio = logo.naturalHeight / logo.naturalWidth;
  const logoH = logoW * logoRatio;
  ctx.drawImage(logo, -logoW / 2, -virtualH / 2 + pad, logoW, logoH);

  // Nummer (8pt → skaliert auf 10px/mm Basis: 8pt ≈ 2.8mm)
  const numFontSize = mm(2.8);
  ctx.font = `bold ${numFontSize}px -apple-system, Arial, sans-serif`;
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const numY = -virtualH / 2 + pad + logoH + mm(1);
  ctx.fillText(nummer, 0, numY);

  // URL (4pt ≈ 1.4mm)
  const urlFontSize = mm(1.4);
  ctx.font = `${urlFontSize}px -apple-system, Arial, sans-serif`;
  ctx.fillStyle = "#888888";
  ctx.fillText("nexthunt-portal.de", 0, numY + numFontSize + mm(1));

  ctx.restore();

  return canvas;
}

export default function WildmarkenDruck({ marken, onClose }) {
  const [status, setStatus] = useState("idle");
  const [canvases, setCanvases] = useState([]);
  const printFrameRef = useRef(null);

  useEffect(() => {
    (async () => {
      setStatus("generating");
      const results = [];
      for (const m of marken) {
        const c = await generateLabelCanvas(m.nummer);
        results.push({ nummer: m.nummer, dataUrl: c.toDataURL("image/png") });
      }
      setCanvases(results);
      setStatus("ready");
    })();
  }, []);

  const handlePrint = () => {
    const frame = printFrameRef.current;
    if (!frame) return;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: 50mm 30mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 50mm; background: white; }
  .label { width: 50mm; height: 30mm; page-break-after: always; overflow: hidden; display: block; }
  .label:last-child { page-break-after: avoid; }
  img { width: 50mm; height: 30mm; display: block; image-rendering: crisp-edges; }
</style>
</head>
<body>
${canvases.map(c => `<div class="label"><img src="${c.dataUrl}" /></div>`).join("")}
</body>
</html>`;

    frame.srcdoc = html;
    frame.onload = () => {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="bg-[#2d2d2d] rounded-2xl border border-[#3a3a3a] w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3a3a3a]">
          <h2 className="text-white font-bold text-lg">
            Etiketten drucken ({marken.length} Stück)
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {status === "generating" && (
            <div className="text-center py-12 text-gray-400">
              <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Etiketten werden generiert...
            </div>
          )}
          {status === "ready" && (
            <div className="flex flex-wrap gap-3 justify-center">
              {canvases.map((c) => (
                <div key={c.nummer} className="border border-[#3a3a3a] rounded-lg overflow-hidden bg-white"
                  style={{ width: 250, height: 150 }}>
                  <img src={c.dataUrl} alt={c.nummer} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#3a3a3a] flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1e1e1e] text-gray-300 hover:bg-[#3a3a3a] transition-colors text-sm">
            Abbrechen
          </button>
          <button onClick={handlePrint} disabled={status !== "ready"}
            className="px-5 py-2 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm transition-colors">
            🖨️ Alle drucken
          </button>
        </div>
      </div>

      <iframe ref={printFrameRef} style={{ display: "none" }} title="print" />
    </div>
  );
}