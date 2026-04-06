import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Loader2, CheckCircle2 } from "lucide-react";

export default function RevierExportButton({ revier }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setDone(false);
    try {
      const res = await base44.functions.invoke("exportRevierData", { revier_id: revier.id });
      const exportData = res.data.data;

      // JSON-Datei direkt im Browser herunterladen
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = revier.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      a.href = url;
      a.download = `nexthunt_revier_${safeName}_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      alert("Fehler beim Export: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      title="Revierdaten als JSON exportieren (für Replit/Migration)"
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border
        ${done
          ? "bg-[#22c55e]/20 border-[#22c55e]/40 text-[#22c55e]"
          : "bg-[#1e1e1e] border-[#2a2a2a] text-gray-400 hover:border-[#22c55e]/40 hover:text-[#22c55e]"
        } disabled:opacity-50`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : done ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {loading ? "Exportiere..." : done ? "Exportiert!" : "JSON Export"}
    </button>
  );
}