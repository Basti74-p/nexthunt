import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Tag, QrCode } from "lucide-react";
import { useAuth } from "@/components/hooks/useAuth";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";

export default function RevierWildmarken({ revier }) {
  const { tenant } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [code, setCode] = useState("");
  const queryClient = useQueryClient();

  const { data: marken = [] } = useQuery({
    queryKey: ["wildmarken", revier.id],
    queryFn: () => base44.entities.Wildmarke.filter({ revier_id: revier.id }),
  });

  const createMutation = useMutation({
    mutationFn: () => base44.entities.Wildmarke.create({
      revier_id: revier.id, tenant_id: tenant.id,
      code: code || `WM-${Date.now().toString(36).toUpperCase()}`,
      status: "available",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wildmarken"] });
      setDialogOpen(false);
      setCode("");
    },
  });

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setDialogOpen(true)} className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Wildmarke erstellen
        </Button>
      </div>

      {marken.length === 0 ? (
        <EmptyState icon={Tag} title="Keine Wildmarken" description="Erstellen Sie QR-codierte Wildmarken für die Streckenverwaltung." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {marken.map(m => (
            <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-6 h-6 text-gray-400" />
              </div>
              <p className="font-mono text-sm font-bold text-gray-900">{m.code}</p>
              <div className="mt-2"><StatusBadge status={m.status} /></div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Wildmarke erstellen</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Code (optional, wird automatisch generiert)</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="z.B. WM-001" /></div>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] rounded-xl">
              {createMutation.isPending ? "Erstellen..." : "Erstellen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}