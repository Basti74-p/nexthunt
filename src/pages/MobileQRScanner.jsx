import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { X, QrCode, Tag, Warehouse, Plus, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

const SCANNER_ID = "qr-reader";

export default function MobileQRScanner() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState(null); // { type: 'wildmarke'|'einrichtung'|'not_found', data, code }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    startScanner();
    return () => stopScanner();
  }, []);

  const startScanner = async () => {
    setScanning(true);
    setResult(null);
    setError(null);
    try {
      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {}
      );
    } catch (e) {
      setError("Kamera konnte nicht gestartet werden. Bitte Kamera-Zugriff erlauben.");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
  };

  const onScanSuccess = async (code) => {
    await stopScanner();
    setScanning(false);
    setLoading(true);

    try {
      if (!tenant?.id) { setLoading(false); return; }

      // Search Wildmarken first
      const wildmarken = await base44.entities.Wildmarke.filter({ tenant_id: tenant.id, code });
      if (wildmarken.length > 0) {
        setResult({ type: "wildmarke", data: wildmarken[0], code });
        setLoading(false);
        return;
      }

      // Search Jagdeinrichtungen by name match
      const einrichtungen = await base44.entities.Jagdeinrichtung.filter({ tenant_id: tenant.id });
      const match = einrichtungen.find(e =>
        e.name?.toLowerCase() === code.toLowerCase() ||
        e.id === code
      );
      if (match) {
        setResult({ type: "einrichtung", data: match, code });
        setLoading(false);
        return;
      }

      // Nothing found
      setResult({ type: "not_found", code });
    } catch (e) {
      setError("Fehler bei der Suche: " + e.message);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    startScanner();
  };

  const handleOpenWildmarke = () => {
    navigate(createPageUrl("MobileStrecke"));
  };

  const handleOpenEinrichtung = () => {
    navigate(`/MobileEinrichtungsDetail?id=${result.data.id}`);
  };

  const handleNewWildmarke = () => {
    navigate(createPageUrl("MobileStrecke") + "?new_wildmarke=1&code=" + encodeURIComponent(result.code));
  };

  const handleNewEinrichtung = () => {
    navigate(createPageUrl("MobileEinrichtungen") + "?new=1&name=" + encodeURIComponent(result.code));
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-[#22c55e]" />
          <span className="text-white font-semibold text-lg">QR-Scanner</span>
        </div>
        <button
          onClick={() => { stopScanner(); navigate(-1); }}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Camera viewport */}
      <div className="flex-1 relative flex items-center justify-center">
        <div id={SCANNER_ID} className="w-full h-full" />

        {/* Scan frame overlay */}
        {scanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#22c55e] rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#22c55e] rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#22c55e] rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#22c55e] rounded-br-lg" />
              {/* Scan line */}
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-[#22c55e]/60 animate-pulse" />
            </div>
            <div className="absolute bottom-32 text-white/70 text-sm text-center px-8">
              QR-Code im Rahmen platzieren
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm">Suche läuft...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-white text-sm">{error}</p>
            <Button onClick={handleReset} className="mt-2">
              <RotateCcw className="w-4 h-4 mr-2" /> Nochmal versuchen
            </Button>
          </div>
        )}
      </div>

      {/* Result sheet */}
      {result && !loading && (
        <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] rounded-t-3xl px-5 pt-5 pb-10 shadow-2xl z-20">
          <div className="w-10 h-1 bg-[#444] rounded-full mx-auto mb-5" />

          {result.type === "wildmarke" && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#22c55e]/15 flex items-center justify-center">
                  <Tag className="w-6 h-6 text-[#22c55e]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Wildmarke gefunden</p>
                  <p className="text-white font-bold text-lg">{result.data.code}</p>
                  <p className="text-xs text-gray-400">Status: {result.data.status}</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-[#22c55e] ml-auto" />
              </div>
              <Button className="w-full" onClick={handleOpenWildmarke}>
                Zur Strecke & Wildmarken
              </Button>
            </>
          )}

          {result.type === "einrichtung" && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center">
                  <Warehouse className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Einrichtung gefunden</p>
                  <p className="text-white font-bold text-lg">{result.data.name}</p>
                  <p className="text-xs text-gray-400">Typ: {result.data.type}</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-[#22c55e] ml-auto" />
              </div>
              <Button className="w-full" onClick={handleOpenEinrichtung}>
                Einrichtung öffnen
              </Button>
            </>
          )}

          {result.type === "not_found" && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/15 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Nichts gefunden für</p>
                  <p className="text-white font-bold text-base break-all">{result.code}</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">Was möchtest du anlegen?</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  onClick={handleNewWildmarke}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#242424] border border-[#333] active:scale-95 transition-all"
                >
                  <Tag className="w-6 h-6 text-[#22c55e]" />
                  <span className="text-xs font-semibold text-gray-300">Neue Wildmarke</span>
                </button>
                <button
                  onClick={handleNewEinrichtung}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#242424] border border-[#333] active:scale-95 transition-all"
                >
                  <Warehouse className="w-6 h-6 text-blue-400" />
                  <span className="text-xs font-semibold text-gray-300">Neue Einrichtung</span>
                </button>
              </div>
              <Button variant="outline" className="w-full" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" /> Erneut scannen
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}