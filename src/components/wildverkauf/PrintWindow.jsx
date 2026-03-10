import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import RechnungPrint from "./RechnungPrint";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

export default function PrintWindow({ printData, tenantSettings, onClose }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const win = window.open("", "_blank", "width=900,height=1200");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Dokument</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: white; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; }
        @media print {
          body { margin: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          a[href]:after { content: none !important; }
        }
      </style>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@3/src/css/preflight.css">
    </head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      <div className="print:hidden flex gap-2 p-4 bg-gray-100 border-b border-gray-300">
        <Button onClick={handlePrint} className="bg-[#22c55e] text-black hover:bg-[#16a34a] gap-2">
          <Printer className="w-4 h-4" /> Drucken
        </Button>
        <Button variant="outline" onClick={onClose} className="border-gray-300 text-gray-800 gap-2">
          <X className="w-4 h-4" /> Schließen
        </Button>
      </div>
      <div ref={printRef}>
        <RechnungPrint
          verkauf={printData.verkauf}
          kunde={printData.kunde}
          tenantSettings={tenantSettings}
          mode={printData.mode}
        />
      </div>
    </div>
  );
}