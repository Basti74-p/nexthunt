import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c370741b119950032ab62/7a1f75278_NextHunt_logo_transparent.png";

// px per mm at 96dpi screen (for canvas rendering)
const PX_PER_MM = 96 / 25.4;

function mmToPx(mm) {
  return mm * PX_PER_MM;
}

async function generateLabelCanvas(nummer) {
  // Etikett: 50x30mm
  const W = Math.round(mmToPx(50));
  const H = Math.round(mmToPx(30));

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Weißer Hintergrund
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // --- Bereich 1: Leerraum (9.5mm) ---
  // leer

  // --- Bereich 2: QR-Seite (x=9.5mm, w=19mm) ---
  const qrX = mmToPx(9.5);
  const qrAreaW = mmToPx(19);
  const qrSize = mmToPx(17);
  const qrOffsetX = qrX + (qrAreaW - qrSize) / 2;
  const qrOffsetY = (H - qrSize) / 2;

  // QR-Code generieren
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, `https://nexthunt-portal.de/wm/${nummer}`, {
    errorCorrectionLevel: "H",
    width: Math.round(qrSize),
    margin: 0,
    color: { dark: "#000000", light: "#ffffff" },
  });
  ctx.drawImage(qrCanvas, qrOffsetX, qrOffsetY, qrSize, qrSize);

  // Logo-Overlay im QR-Code (5x5mm, zentriert, weißer Hintergrund)
  const logoOverlaySize = mmToPx(5);
  const logoPadding = mmToPx(0.3);
  const logoRadius = mmToPx(0.5);
  const logoX = qrOffsetX + (qrSize - logoOverlaySize) / 2;
  const logoY = qrOffsetY + (qrSize - logoOverlaySize) / 2;

  // Weißes Hintergrundrechteck mit Radius
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(
    logoX - logoPadding,
    logoY - logoPadding,
    logoOverlaySize + logoPadding * 2,
    logoOverlaySize + logoPadding * 2,
    logoRadius
  );
  ctx.fill();
  ctx.restore();

  // Logo laden und zeichnen
  await new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, logoX, logoY, logoOverlaySize, logoOverlaySize);
      resolve();
    };
    img.onerror = resolve;
    img.src = LOGO_URL;
  });

  // --- Bereich 3: Falzlinie (x=28.5mm, w=2mm) ---
  const foldX = mmToPx(28.5);
  const foldW = mmToPx(2);
  ctx.save();
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 0.5;
  ctx.setLineDash([mmToPx(1), mmToPx(0.8)]);
  // Linke gestrichelte Linie
  ctx.beginPath();
  ctx.moveTo(foldX, 0);
  ctx.lineTo(foldX, H);
  ctx.stroke();
  // Rechte gestrichelte Linie
  ctx.beginPath();
  ctx.moveTo(foldX + foldW, 0);
  ctx.lineTo(foldX + foldW, H);
  ctx.stroke();
  ctx.restore();

  // --- Bereich 4: Info-Seite (x=30.5mm, w=19mm) ---
  const infoX = mmToPx(30.5);
  const infoW = mmToPx(19);
  const padding = mmToPx(1);

  // Logo (10mm breit, automatische Höhe)
  const logoW = mmToPx(10);
  await new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ratio = img.naturalHeight / img.naturalWidth;
      const logoH = logoW * ratio;
      const logoDrawX = infoX + (infoW - logoW) / 2;
      const logoDrawY = padding;
      ctx.drawImage(img, logoDrawX, logoDrawY, logoW, logoH);

      // Nummer (8pt, fett)
      const numY = logoDrawY + logoH + mmToPx(1);
      ctx.font = `bold ${8 * (96 / 72)}px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.fillText(nummer, infoX + infoW / 2, numY + 8 * (96 / 72) * 0.75);

      // URL (4pt, grau)
      const urlY = numY + 8 * (96 / 72) + mmToPx(1);
      ctx.font = `${4 * (96 / 72)}px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = "#888888";
      ctx.fillText("nexthunt-portal.de", infoX + infoW / 2, urlY + 4 * (96 / 72) * 0.75);

      resolve();
    };
    img.onerror = resolve;
    img.src = LOGO_URL;
  });

  return canvas;
}

export default function WildmarkenDruck({ marken, onClose }) {
  const [status, setStatus] = useState("idle"); // idle | generating | ready
  const [canvases, setCanvases] = useState([]);
  const printFrameRef = useRef(null);

  const generate = async () => {
    setStatus("generating");
    const results = [];
    for (const m of marken) {
      const c = await generateLabelCanvas(m.nummer);
      results.push({ nummer: m.nummer, dataUrl: c.toDataURL("image/png") });
    }
    setCanvases(results);
    setStatus("ready");
  };

  useEffect(() => {
    generate();
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
  body { width: 50mm; }
  .label { width: 50mm; height: 30mm; page-break-after: always; overflow: hidden; }
  .label:last-child { page-break-after: avoid; }
  img { width: 50mm; height: 30mm; display: block; }
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3a3a3a]">
          <h2 className="text-white font-bold text-lg">
            Etiketten drucken ({marken.length} Stück)
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Content */}
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
                <div key={c.nummer} className="border border-[#3a3a3a] rounded-lg overflow-hidden" style={{ width: 200, height: 120 }}>
                  <img src={c.dataUrl} alt={c.nummer} className="w-full h-full object-contain bg-white" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#3a3a3a] flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1e1e1e] text-gray-300 hover:bg-[#3a3a3a] transition-colors text-sm"
          >
            Abbrechen
          </button>
          <button
            onClick={handlePrint}
            disabled={status !== "ready"}
            className="px-5 py-2 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm transition-colors"
          >
            🖨️ Alle drucken
          </button>
        </div>
      </div>

      {/* Hidden iframe for printing */}
      <iframe ref={printFrameRef} style={{ display: "none" }} title="print" />
    </div>
  );
}