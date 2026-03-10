import React, { useState, useRef } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Eye, RefreshCw } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";

const SPECIES = [
  { value: "rotwild", label: "Rotwild" },
  { value: "schwarzwild", label: "Schwarzwild" },
  { value: "rehwild", label: "Rehwild" },
  { value: "damwild", label: "Damwild" },
  { value: "sikawild", label: "Sikawild" },
  { value: "wolf", label: "Wolf" },
];

export default function MobileSightings() {
  const { tenant } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ species: "rehwild", quantity: 1, date: new Date().toISOString().split("T")[0], notes: "" });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere-mobile", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: sightings = [] } = useQuery({
    queryKey: ["sightings-mobile", tenant?.id],
    queryFn: () => base44.entities.WildManagement.filter({ tenant_id: tenant?.id, type: "observation" }),
    enabled: !!tenant?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WildManagement.create({
      ...data, tenant_id: tenant.id, type: "observation",
      revier_id: reviere[0]?.id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sightings-mobile"] });
      setDialogOpen(false);
    },
  });

  const handlePullToRefresh = async (e) => {
    if (e.type === "touchstart") pullStartRef.current = e.touches[0].clientY;
    if (e.type === "touchmove" && pullStartRef.current !== null && window.scrollY === 0) {
      const diff = e.touches[0].clientY - pullStartRef.current;
      if (diff > 80 && !isRefreshing) {
        setIsRefreshing(true);
        pullStartRef.current = null;
        await queryClient.invalidateQueries({ queryKey: ["sightings-mobile"] });
        setTimeout(() => setIsRefreshing(false), 1000);
      }
    }
  };

  return (
    <PageTransition>
      <div className="pt-4" onTouchStart={handlePullToRefresh} onTouchMove={handlePullToRefresh}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Sichtungen</h2>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl gap-1">
          <Plus className="w-4 h-4" /> Neu
        </Button>
      </div>

      <div className="space-y-2">
        {sightings.map(s => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <Eye className="w-5 h-5 text-[#0F2F23]" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 capitalize">{SPECIES.find(sp => sp.value === s.species)?.label}</p>
              <p className="text-xs text-gray-500">{s.quantity}× • {s.date}</p>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sichtung melden</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Wildart</Label>
              <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SPECIES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Anzahl</Label><Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
              <div><Label>Datum</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            </div>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] rounded-xl">
              {createMutation.isPending ? "Melden..." : "Sichtung melden"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}