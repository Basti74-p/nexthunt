import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const LOGO_URL =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c370741b119950032ab62/7a1f75278_NextHunt_logo_transparent.png";

// 20px/mm → 50×30mm = 1000×600px
const DPI = 20;
const W = 50 * DPI; // 1000px
const H = 30 * DPI; // 600px

function px(mm) { return Math.round(mm * DPI); }

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function generateLabel(nummer) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Weißer Hintergrund
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // ── Bemaßung ─────────────────────────────────────────────
  // 0–10mm:      frei
  // 10–11.3mm:   Falzlinie #1 (Mitte bei 10.65mm)
  // 11.3–31mm:   QR-Code (19.7mm breit)
  // 31–32.3mm:   Falzlinie #2 (Mitte bei 31.65mm)
  // 32.3–50mm:   Text-Bereich (17.7mm breit)

  const fold1Center = px(10.65);
  const fold2Center = px(31.65);
  const qrLeft = px(13);
  const qrSize = px(15);
  const textLeft = px(32.3);
  const textWidth = px(14);

  // ── Falzlinien ────────────────────────────────────────────
  const drawFold = (xCenter) => {
    ctx.save();
    ctx.strokeStyle = "#bbbbbb";
    ctx.lineWidth = px(0.15);
    ctx.setLineDash([px(1.2), px(0.8)]);
    ctx.beginPath();
    ctx.moveTo(xCenter, 0);
    ctx.lineTo(xCenter, H);
    ctx.stroke();
    ctx.restore();
  };
  drawFold(fold1Center);
  drawFold(fold2Center);

  // ── QR-Code: 19.7×19.7mm, vertikal zentriert ─────────────
  const qrY = (H - qrSize) / 2;
  const qrTmp = document.createElement("canvas");
  await QRCode.toCanvas(qrTmp, `https://nexthunt-portal.de/wm/${nummer}`, {
    errorCorrectionLevel: "H",
    width: qrSize * 3,
    margin: 0,
    color: { dark: "#000000", light: "#ffffff" },
  });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrTmp, qrLeft, qrY, qrSize, qrSize);
  ctx.imageSmoothingEnabled = true;

  // ── Text-Bereich: 90° gedreht (von unten nach oben) ──
  const textCX = textLeft + textWidth / 2;
  const textCY = H / 2;

  // WM-Nummer: NH-XXXXX → WM-XXXXX
  const wmNummer = nummer.replace("NH-", "WM-");

  ctx.save();
  ctx.translate(textCX, textCY);
  ctx.rotate(-Math.PI / 2);

  const brandSize = px(3.5);
  const urlSize = px(2);
  const numSize = px(5);
  const gap1 = px(1);
  const gap2 = px(1);
  const totalH = brandSize + gap1 + urlSize + gap2 + numSize;
  const startY = -totalH / 2;

  // "NextHunt" groß
  ctx.font = `bold ${brandSize}px Arial, sans-serif`;
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("NextHunt", 0, startY);

  // Website klein
  ctx.font = `${urlSize}px Arial, sans-serif`;
  ctx.fillStyle = "#888888";
  ctx.fillText("nexthunt-portal.de", 0, startY + brandSize + gap1);

  // WM-Nummer groß
  ctx.font = `bold ${numSize}px "Arial Black", Arial, sans-serif`;
  ctx.fillStyle = "#111111";
  ctx.fillText(wmNummer, 0, startY + brandSize + gap1 + urlSize + gap2);

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
        const c = await generateLabel(m.nummer);
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
  img { width: 50mm; height: 30mm; display: block; image-rendering: pixelated; }
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
      <div className="bg-[#2d2d2d] rounded-2xl border border-[#3a3a3a] w-full max-w-4xl flex flex-col max-h-[90vh]">
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
                <div key={c.nummer}
                  className="border border-[#444] rounded overflow-hidden bg-white"
                  style={{ width: 250, height: 150 }}>
                  <img src={c.dataUrl} alt={c.nummer}
                    style={{ width: "100%", height: "100%", objectFit: "fill" }} />
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