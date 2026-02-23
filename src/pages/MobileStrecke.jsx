import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Crosshair } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";

const SPECIES = [
  { value: "rotwild", label: "Rotwild" },
  { value: "schwarzwild", label: "Schwarzwild" },
  { value: "rehwild", label: "Rehwild" },
  { value: "damwild", label: "Damwild" },
];

export default function MobileStrecke() {
  const { tenant } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ species: "rehwild", gender: "maennlich", date: new Date().toISOString().split("T")[0] });
  const queryClient = useQueryClient();

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere-mob-s", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: strecken = [] } = useQuery({
    queryKey: ["strecke-mobile", tenant?.id],
    queryFn: () => base44.entities.Strecke.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Strecke.create({
      ...data, tenant_id: tenant.id, revier_id: reviere[0]?.id, status: "erfasst",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strecke-mobile"] });
      setDialogOpen(false);
    },
  });

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Strecke</h2>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl gap-1">
          <Plus className="w-4 h-4" /> Erfassen
        </Button>
      </div>

      <div className="space-y-2">
        {strecken.map(s => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <Crosshair className="w-5 h-5 text-[#0F2F23]" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 capitalize">{SPECIES.find(sp => sp.value === s.species)?.label || s.species}</p>
              <p className="text-xs text-gray-500">{s.gender === "maennlich" ? "♂" : "♀"} • {s.date}</p>
            </div>
            <StatusBadge status={s.status} />
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Strecke erfassen</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Wildart</Label>
              <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SPECIES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Geschlecht</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maennlich">Männlich</SelectItem>
                    <SelectItem value="weiblich">Weiblich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Datum</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            </div>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] rounded-xl">
              {createMutation.isPending ? "Speichern..." : "Erfassen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}