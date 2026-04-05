import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tag, Plus, QrCode, CheckCircle2, Circle, Wifi } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/ui/EmptyState";

function StatusChip({ status }) {
  if (status === "vergeben") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
        <CheckCircle2 className="w-3 h-3" /> Vergeben
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-600/40 text-slate-300 font-semibold">
      <Circle className="w-3 h-3" /> Frei
    </span>
  );
}

export default function Wildmarken() {
  const { tenant } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [count, setCount] = useState("10");

  const { data: marken = [], isLoading } = useQuery({
    queryKey: ["wildmarken", tenant?.id],
    queryFn: () => base44.entities.Wildmarke.filter({ tenant_id: tenant.id }, "nummer", 500),
    enabled: !!tenant?.id,
  });

  const createBatch = useMutation({
    mutationFn: async () => {
      let maxNum = 0;
      for (const m of marken) {
        const parsed = parseInt((m.nummer || "").replace("NH-", ""), 10);
        if (!isNaN(parsed) && parsed > maxNum) maxNum = parsed;
      }
      for (let i = 1; i <= parseInt(count); i++) {
        const num = maxNum + i;
        await base44.entities.Wildmarke.create({
          tenant_id: tenant.id,
          nummer: "NH-" + String(num).padStart(5, "0"),
          status: "frei",
          nfc_written: false,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wildmarken"] });
      setDialogOpen(false);
    },
  });

  const frei = marken.filter(m => m.status === "frei").length;
  const vergeben = marken.filter(m => m.status === "vergeben").length;

  const nextNum = marken.reduce((max, m) => {
    const n = parseInt((m.nummer || "").replace("NH-", ""), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-[#22c55e]" /> Wildmarken
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {marken.length} gesamt · {frei} frei · {vergeben} vergeben
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-xl gap-2 font-semibold"
        >
          <Plus className="w-4 h-4" /> Paket erstellen
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-500">Laden...</div>
      ) : marken.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Keine Wildmarken"
          description="Erstellen Sie Ihr erstes Wildmarken-Paket (10 oder 20 Stück)."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {marken.map((m) => (
            <div
              key={m.id}
              className="bg-[#2d2d2d] rounded-2xl border border-[#3a3a3a] p-4 flex flex-col items-center gap-2 hover:border-[#444] transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                m.status === "vergeben" ? "bg-emerald-500/15" : "bg-[#1e1e1e]"
              }`}>
                {m.nfc_written
                  ? <Wifi className={`w-5 h-5 ${m.status === "vergeben" ? "text-emerald-400" : "text-[#22c55e]"}`} />
                  : <QrCode className={`w-5 h-5 ${m.status === "vergeben" ? "text-emerald-400" : "text-gray-400"}`} />
                }
              </div>
              <p className="font-mono text-xs font-bold text-white">{m.nummer}</p>
              <StatusChip status={m.status} />
              {m.abschuss_info && (
                <p className="text-[10px] text-gray-500 text-center truncate w-full">{m.abschuss_info}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm bg-[#2d2d2d] border-[#3a3a3a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Wildmarken-Paket erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Anzahl</label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger className="bg-[#1e1e1e] border-[#444] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#444]">
                  <SelectItem value="10" className="text-white">10 Wildmarken</SelectItem>
                  <SelectItem value="20" className="text-white">20 Wildmarken</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500">
              Nächste Nummer: <span className="text-gray-300 font-mono">NH-{String(nextNum).padStart(5, "0")}</span>
            </p>
            <Button
              onClick={() => createBatch.mutate()}
              disabled={createBatch.isPending}
              className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold rounded-xl"
            >
              {createBatch.isPending ? "Wird erstellt..." : `${count} Wildmarken erstellen`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}