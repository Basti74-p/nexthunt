import React from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ListTodo, Check } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";

export default function Aufgaben() {
  const { tenant } = useAuth();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", description: "", due_date: "", priority: "medium" });
  const queryClient = useQueryClient();

  const { data: aufgaben = [] } = useQuery({
    queryKey: ["aufgaben-page", tenant?.id],
    queryFn: () => base44.entities.Aufgabe.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Aufgabe.create({ ...data, tenant_id: tenant.id, status: "offen" }),
    onMutate: (data) => {
      queryClient.setQueryData(["aufgaben-page", tenant?.id], old => [
        ...(old || []),
        { ...data, id: "temp-" + Date.now(), tenant_id: tenant.id, status: "offen" }
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aufgaben-page"] });
      setDialogOpen(false);
      setForm({ title: "", description: "", due_date: "", priority: "medium" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Aufgabe.update(id, { status: status === "erledigt" ? "offen" : "erledigt" }),
    onMutate: ({ id, status }) => {
      queryClient.setQueryData(["aufgaben-page", tenant?.id], old => (old || []).map(a =>
        a.id === id ? { ...a, status: status === "erledigt" ? "offen" : "erledigt" } : a
      ));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["aufgaben-page"] }),
  });

  const open = aufgaben.filter(a => a.status !== "erledigt");
  const done = aufgaben.filter(a => a.status === "erledigt");

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Aufgaben"
        subtitle={`${open.length} offen`}
        actions={
          <Button onClick={() => setDialogOpen(true)} className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Neue Aufgabe
          </Button>
        }
      />

      {aufgaben.length === 0 ? (
        <EmptyState icon={ListTodo} title="Keine Aufgaben" description="Erstellen Sie die erste Aufgabe für Ihr Team." action={
          <Button onClick={() => setDialogOpen(true)} className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl gap-2"><Plus className="w-4 h-4" /> Aufgabe erstellen</Button>
        } />
      ) : (
        <div className="space-y-4">
          {open.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Offen ({open.length})</p>
              {open.map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <button onClick={() => toggleMutation.mutate({ id: a.id, status: a.status })}
                    className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-[#0F2F23] transition-colors shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{a.title}</p>
                    {a.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{a.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.priority === "high" ? "suspended" : a.priority === "low" ? "planned" : "assigned"} />
                    {a.due_date && <span className="text-xs text-gray-400">{a.due_date}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {done.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Erledigt ({done.length})</p>
              {done.map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 opacity-50">
                  <button onClick={() => toggleMutation.mutate({ id: a.id, status: a.status })}
                    className="w-6 h-6 rounded-full bg-[#0F2F23] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </button>
                  <p className="font-medium text-gray-500 line-through">{a.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neue Aufgabe</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Titel *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Beschreibung</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fällig am</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              <div>
                <Label>Priorität</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || createMutation.isPending} className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] rounded-xl">
              {createMutation.isPending ? "Speichern..." : "Erstellen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}