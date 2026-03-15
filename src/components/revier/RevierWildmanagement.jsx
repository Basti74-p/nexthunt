import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Eye } from "lucide-react";
import { useAuth } from "@/components/hooks/useAuth";
import EmptyState from "@/components/ui/EmptyState";

const SPECIES = [
  { value: "rotwild", label: "Rotwild" },
  { value: "schwarzwild", label: "Schwarzwild" },
  { value: "rehwild", label: "Rehwild" },
  { value: "damwild", label: "Damwild" },
  { value: "sikawild", label: "Sikawild" },
  { value: "wolf", label: "Wolf" },
];

const ENTRY_TYPES = [
  { value: "observation", label: "Sichtung" },
  { value: "population", label: "Bestand" },
  { value: "harvest", label: "Ernte" },
];

export default function RevierWildmanagement({ revier }) {
  const { tenant } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ species: "rehwild", type: "observation", quantity: 1, date: new Date().toISOString().split("T")[0], notes: "" });
  const queryClient = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ["wildmanagement", revier.id],
    queryFn: () => base44.entities.WildManagement.filter({ revier_id: revier.id }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WildManagement.create({ ...data, revier_id: revier.id, tenant_id: tenant.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wildmanagement"] });
      setDialogOpen(false);
    },
  });

  const grouped = SPECIES.map(s => ({
    ...s,
    count: entries.filter(e => e.species === s.value).length,
    observations: entries.filter(e => e.species === s.value && e.type === "observation").length,
  }));

  return (
    <div>
      <div className="flex justify-end mb-4">
         <Button onClick={() => setDialogOpen(true)} className="bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-xl gap-2">
           <Plus className="w-4 h-4" /> Neuer Eintrag
         </Button>
       </div>

      {entries.length === 0 ? (
        <EmptyState icon={Eye} title="Keine Einträge" description="Erfassen Sie Sichtungen, Bestandsdaten und mehr." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
           {grouped.filter(g => g.count > 0).map(g => (
             <div key={g.value} className="bg-[#3a3a3a] rounded-2xl border border-[#4a4a4a] shadow-sm p-5">
               <h3 className="font-medium text-gray-100 capitalize">{g.label}</h3>
               <p className="text-2xl font-bold text-gray-100 mt-1">{g.count}</p>
               <p className="text-xs text-gray-400">Einträge • {g.observations} Sichtungen</p>
             </div>
           ))}
         </div>
      )}

      {/* Recent entries */}
      {entries.length > 0 && (
        <div className="bg-[#3a3a3a] rounded-2xl border border-[#4a4a4a] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#4a4a4a]">
            <h3 className="font-semibold text-gray-100">Letzte Einträge</h3>
          </div>
          <div className="divide-y divide-[#4a4a4a]">
            {entries.slice(0, 20).map(e => (
              <div key={e.id} className="px-5 py-3 flex items-center gap-4 text-sm">
                <span className="capitalize font-medium text-gray-100 w-28">{SPECIES.find(s => s.value === e.species)?.label}</span>
                <span className="text-gray-400 w-20">{ENTRY_TYPES.find(t => t.value === e.type)?.label}</span>
                <span className="text-gray-300">{e.quantity}×</span>
                <span className="text-gray-500 ml-auto">{e.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neuer Eintrag</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Wildart</Label>
                <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SPECIES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Typ</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ENTRY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Anzahl</Label><Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
              <div><Label>Datum</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            </div>
            <div><Label>Notizen</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-xl">
              {createMutation.isPending ? "Speichern..." : "Speichern"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}