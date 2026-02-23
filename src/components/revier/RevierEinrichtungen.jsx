import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Building } from "lucide-react";
import { useAuth } from "@/components/hooks/useAuth";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";

const TYPES = [
  { value: "hochsitz", label: "Hochsitz" },
  { value: "leiter", label: "Leiter" },
  { value: "erdsitz", label: "Erdsitz" },
  { value: "kirrung", label: "Kirrung" },
  { value: "salzlecke", label: "Salzlecke" },
  { value: "suhle", label: "Suhle" },
];

const CONDITIONS = [
  { value: "gut", label: "Gut" },
  { value: "maessig", label: "Mäßig" },
  { value: "schlecht", label: "Schlecht" },
  { value: "neu", label: "Neu" },
];

export default function RevierEinrichtungen({ revier }) {
  const { tenant } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "hochsitz", condition: "gut", notes: "", latitude: "", longitude: "" });
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["einrichtungen", revier.id],
    queryFn: () => base44.entities.Jagdeinrichtung.filter({ revier_id: revier.id }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Jagdeinrichtung.create({ ...data, revier_id: revier.id, tenant_id: tenant.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["einrichtungen"] });
      setDialogOpen(false);
      setForm({ name: "", type: "hochsitz", condition: "gut", notes: "", latitude: "", longitude: "" });
    },
  });

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Building}
        title="Keine Jagdeinrichtungen"
        description="Fügen Sie Hochsitze, Kanzeln, Kirrungen und andere Einrichtungen hinzu."
        action={<Button onClick={() => setDialogOpen(true)} className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl gap-2"><Plus className="w-4 h-4" /> Einrichtung anlegen</Button>}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setDialogOpen(true)} className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Neue Einrichtung
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-4 h-4 text-[#0F2F23]" />
              <h3 className="font-medium text-gray-900">{item.name}</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="capitalize">{item.type}</span>
              <span>•</span>
              <StatusBadge status={item.condition === "gut" ? "active" : item.condition === "schlecht" ? "suspended" : "planned"} />
            </div>
            {item.notes && <p className="text-xs text-gray-500 mt-2">{item.notes}</p>}
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neue Jagdeinrichtung</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Typ</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Zustand</Label>
                <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Notizen</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || createMutation.isPending} className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] rounded-xl">
              {createMutation.isPending ? "Speichern..." : "Anlegen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}