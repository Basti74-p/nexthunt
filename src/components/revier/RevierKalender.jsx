import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Calendar } from "lucide-react";
import { useAuth } from "@/components/hooks/useAuth";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";

export default function RevierKalender({ revier }) {
  const { tenant } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", type: "termin", date: "", time: "", description: "" });
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ["kalender", revier.id],
    queryFn: () => base44.entities.JagdKalender.filter({ revier_id: revier.id }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.JagdKalender.create({ ...data, revier_id: revier.id, tenant_id: tenant.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kalender"] });
      setDialogOpen(false);
      setForm({ title: "", type: "termin", date: "", time: "", description: "" });
    },
  });

  const sorted = [...events].sort((a, b) => (a.date > b.date ? 1 : -1));

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setDialogOpen(true)} className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Neuer Termin
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={Calendar} title="Kein Termin vorhanden" description="Erstellen Sie Termine, Revierarbeiten und Jagdtage." />
      ) : (
        <div className="space-y-2">
          {sorted.map(e => (
            <div key={e.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className="text-center min-w-[52px]">
                <p className="text-xs text-gray-500">{e.date?.split("-")[1]}/{e.date?.split("-")[2]}</p>
                <p className="text-lg font-bold text-gray-900">{e.date?.split("-")[2]}</p>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{e.title}</h3>
                <p className="text-xs text-gray-500">{e.time || "Ganztags"} • {e.type === "termin" ? "Termin" : e.type === "revierarbeit" ? "Revierarbeit" : "Jagd"}</p>
              </div>
              <StatusBadge status={e.status} />
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neuer Termin</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Titel *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Typ</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="termin">Termin</SelectItem>
                    <SelectItem value="revierarbeit">Revierarbeit</SelectItem>
                    <SelectItem value="jagd">Jagd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Datum *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Uhrzeit</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
            </div>
            <div><Label>Beschreibung</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.date || createMutation.isPending} className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] rounded-xl">
              {createMutation.isPending ? "Speichern..." : "Erstellen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}