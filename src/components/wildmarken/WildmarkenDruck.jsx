import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const LOGO_URL =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c370741b119950032ab62/7a1f75278_NextHunt_logo_transparent.png";

// 300 DPI: 1mm = 11.811px → wir nutzen 12px/mm für saubere Zahlen
const DPI = 12; // px per mm

// Etikett 50×30mm
const W = 50 * DPI; // 600px
const H = 30 * DPI; // 360px

function px(mm) { return mm * DPI; }

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function generateLabel(nummer, logo) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Weißer Hintergrund
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // ── QR-Code Seite: 0–28.5mm ──────────────────────────────
  // QR-Code: 26mm × 26mm, zentriert vertikal, 1mm Abstand links
  const qrMM = 26;
  const qrS = px(qrMM);
  const qrX = px(1);
  const qrY = (H - qrS) / 2;

  // QR intern 4× übersamplen für maximale Schärfe, dann runterskalieren
  const qrOver = 4;
  const qrTmp = document.createElement("canvas");
  await QRCode.toCanvas(qrTmp, `https://nexthunt-portal.de/wm/${nummer}`, {
    errorCorrectionLevel: "H",
    width: qrS * qrOver,
    margin: 0,
    color: { dark: "#000000", light: "#ffffff" },
  });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrTmp, qrX, qrY, qrS, qrS);
  ctx.imageSmoothingEnabled = true;

  // Logo-Overlay (5mm × 5mm) zentriert im QR
  const olS = px(5);
  const olPad = px(0.5);
  const olX = qrX + (qrS - olS) / 2;
  const olY = qrY + (qrS - olS) / 2;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(olX - olPad, olY - olPad, olS + olPad * 2, olS + olPad * 2, px(0.6));
  ctx.fill();
  ctx.drawImage(logo, olX, olY, olS, olS);

  // ── Falzlinien: bei 28.5mm und 30.5mm ────────────────────
  ctx.save();
  ctx.strokeStyle = "#bbbbbb";
  ctx.lineWidth = px(0.2);
  ctx.setLineDash([px(1.2), px(0.8)]);
  [28.5, 30.5].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(px(x), px(0.5));
    ctx.lineTo(px(x), H - px(0.5));
    ctx.stroke();
  });
  ctx.restore();

  // ── Info-Seite: 30.5–50mm (19.5mm breit) ─────────────────
  const infoLeft = px(30.5);
  const infoW = px(19.5);
  const cx = infoLeft + infoW / 2; // horizontale Mitte der Info-Seite

  // Logo: 12mm breit, 2mm vom oberen Rand
  const logoW = px(12);
  const logoH = logoW * (logo.naturalHeight / logo.naturalWidth);
  ctx.drawImage(logo, cx - logoW / 2, px(2), logoW, logoH);

  // Nummer: bold, 5mm Schrift
  ctx.font = `bold ${px(5)}px Arial Black, Arial, sans-serif`;
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const numY = px(2) + logoH + px(1.5);
  ctx.fillText(nummer, cx, numY);

  // URL: 2mm Schrift, grau
  ctx.font = `${px(2)}px Arial, sans-serif`;
  ctx.fillStyle = "#999999";
  ctx.fillText("nexthunt-portal.de", cx, numY + px(5) + px(1));

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
        const c = await generateLabel(m.nummer, logo);
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
  .label { width: 50mm; height: 30mm; page-break-after: always; display: block; }
  .label:last-child { page-break-after: avoid; }
  img { width: 50mm; height: 30mm; display: block; }
</style>
</head>
<body>
${canvases.map((c) => `<div class="label"><img src="${c.dataUrl}" /></div>`).join("")}
</body>
</html>`;
    frame.srcdoc = html;
    frame.onload = () => { frame.contentWindow.focus(); frame.contentWindow.print(); };
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
            <div className="flex flex-wrap gap-4 justify-center">
              {canvases.map((c) => (
                <div key={c.nummer}
                  className="border border-[#3a3a3a] rounded overflow-hidden bg-white"
                  style={{ width: 300, height: 180 }}>
                  <img src={c.dataUrl} alt={c.nummer} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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