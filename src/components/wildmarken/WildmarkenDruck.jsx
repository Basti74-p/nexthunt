import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const LOGO_URL =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c370741b119950032ab62/7a1f75278_NextHunt_logo_transparent.png";

// 50x30mm @ 10px/mm = 500x300px
const PX_PER_MM = 10;
const W_MM = 50;
const H_MM = 30;
const W = W_MM * PX_PER_MM; // 500px
const H = H_MM * PX_PER_MM; // 300px

function mm(v) {
  return v * PX_PER_MM;
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function generateLabelCanvas(nummer, logo) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Weißer Hintergrund
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // ─── LINKE HÄLFTE: QR-Code (0–25mm) ───
  const leftW = mm(25);
  const qrSize = mm(22);
  const qrX = (leftW - qrSize) / 2;
  const qrY = (H - qrSize) / 2;

  // QR-Code scharf rendern
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, `https://nexthunt-portal.de/wm/${nummer}`, {
    errorCorrectionLevel: "H",
    width: qrSize,
    margin: 0,
    color: { dark: "#000000", light: "#ffffff" },
  });
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  // Logo-Overlay im QR-Code (5x5mm, zentriert)
  const overlaySize = mm(5);
  const overlayPad = mm(0.4);
  const overlayX = qrX + (qrSize - overlaySize) / 2;
  const overlayY = qrY + (qrSize - overlaySize) / 2;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(
    overlayX - overlayPad,
    overlayY - overlayPad,
    overlaySize + overlayPad * 2,
    overlaySize + overlayPad * 2,
    mm(0.5)
  );
  ctx.fill();
  ctx.drawImage(logo, overlayX, overlayY, overlaySize, overlaySize);

  // ─── TRENNLINIE (25mm) ───
  ctx.save();
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1;
  ctx.setLineDash([mm(1), mm(0.8)]);
  ctx.beginPath();
  ctx.moveTo(mm(25), mm(1));
  ctx.lineTo(mm(25), H - mm(1));
  ctx.stroke();
  ctx.restore();

  // ─── RECHTE HÄLFTE: Info (25–50mm) ─── horizontal, kein Drehen
  const rightX = mm(25);
  const rightW = mm(25);
  const pad = mm(2);
  const centerX = rightX + rightW / 2;

  // Logo (oben, 14mm breit)
  const logoW = mm(14);
  const logoH = logoW * (logo.naturalHeight / logo.naturalWidth);
  ctx.drawImage(logo, centerX - logoW / 2, mm(3), logoW, logoH);

  // Nummer (fett, 5mm Schriftgröße)
  const numFontSize = mm(5);
  ctx.font = `bold ${numFontSize}px Arial, sans-serif`;
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(nummer, centerX, mm(3) + logoH + mm(2));

  // URL (klein)
  const urlFontSize = mm(2);
  ctx.font = `${urlFontSize}px Arial, sans-serif`;
  ctx.fillStyle = "#888888";
  ctx.fillText(
    "nexthunt-portal.de",
    centerX,
    mm(3) + logoH + mm(2) + numFontSize + mm(1)
  );

  return canvas;
}

export default function WildmarkenDruck({ marken, onClose }) {
  const [status, setStatus] = useState("idle");
  const [canvases, setCanvases] = useState([]);
  const printFrameRef = useRef(null);

  useEffect(() => {
    (async () => {
      setStatus("generating");
      const logo = await loadImage(LOGO_URL);
      const results = [];
      for (const m of marken) {
        const c = await generateLabelCanvas(m.nummer, logo);
        results.push({ nummer: m.nummer, dataUrl: c.toDataURL("image/png") });
      }
      setCanvases(results);
      setStatus("ready");
    })();
  }, []);

  const handlePrint = () => {
    const frame = printFrameRef.current;
    if (!frame) return;

    // Jedes Bild ist 500x300px = 50x30mm @ 96dpi-äquivalent
    // @page size muss 50x30mm sein (Querformat)
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
  img { width: 50mm; height: 30mm; display: block; }
</style>
</head>
<body>
${canvases.map((c) => `<div class="label"><img src="${c.dataUrl}" /></div>`).join("")}
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
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {status === "generating" && (
            <div className="text-center py-12 text-gray-400">
              <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Etiketten werden generiert...
            </div>
          )}
          {status === "ready" && (
            <div className="flex flex-wrap gap-4 justify-center">
              {canvases.map((c) => (
                <div
                  key={c.nummer}
                  className="border border-[#3a3a3a] rounded-lg overflow-hidden bg-white"
                  style={{ width: 250, height: 150 }}
                >
                  <img
                    src={c.dataUrl}
                    alt={c.nummer}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

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

      <iframe ref={printFrameRef} style={{ display: "none" }} title="print" />
    </div>
  );
}