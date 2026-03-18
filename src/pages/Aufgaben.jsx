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
import AufgabeDetailView from "@/components/aufgaben/AufgabeDetailView";
import { useI18n } from "@/lib/i18n";

export default function Aufgaben() {
  const { tenant } = useAuth();
  const { t } = useI18n();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState(null);
  const [detailView, setDetailView] = React.useState(null);
  const [form, setForm] = React.useState({ 
    title: "", 
    description: "", 
    due_date: "", 
    priority: "medium",
    assigned_to: "",
    assigned_to_name: "",
    einrichtung_id: "",
    einrichtung_name: "",
    schadensprotokolle_ids: []
  });
  const queryClient = useQueryClient();

  const { data: aufgaben = [] } = useQuery({
    queryKey: ["aufgaben-page", tenant?.id],
    queryFn: () => base44.entities.Aufgabe.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: tenantMembers = [] } = useQuery({
    queryKey: ["tenant-members", tenant?.id],
    queryFn: async () => {
      const result = await base44.entities.TenantMember.filter({ tenant_id: tenant?.id });
      console.log("TenantMembers loaded:", result);
      return result;
    },
    enabled: !!tenant?.id,
  });

  const { data: personen = [] } = useQuery({
    queryKey: ["personen", tenant?.id],
    queryFn: async () => {
      const result = await base44.entities.Person.filter({ tenant_id: tenant?.id });
      console.log("Personen loaded:", result);
      return result;
    },
    enabled: !!tenant?.id,
  });

  const { data: schadensprotokoll = [] } = useQuery({
    queryKey: ["schadensprotokoll", tenant?.id],
    queryFn: () => base44.entities.Schadensprotokoll.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: einrichtungen = [] } = useQuery({
    queryKey: ["einrichtungen", tenant?.id],
    queryFn: () => base44.entities.Jagdeinrichtung.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      if (editingTask) {
        return base44.entities.Aufgabe.update(editingTask.id, data);
      }
      return base44.entities.Aufgabe.create({ 
        ...data, 
        tenant_id: tenant.id, 
        status: "offen",
        revier_id: ""
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aufgaben-page"] });
      setDialogOpen(false);
      setEditingTask(null);
      setForm({ 
        title: "", 
        description: "", 
        due_date: "", 
        priority: "medium",
        assigned_to: "",
        assigned_to_name: "",
        einrichtung_id: "",
        einrichtung_name: "",
        schadensprotokolle_ids: []
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Aufgabe.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["aufgaben-page"] }),
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

  if (detailView) {
    return <AufgabeDetailView aufgabe={detailView} onBack={() => setDetailView(null)} tenantId={tenant?.id} />;
  }

  return (
    <div className="max-w-4xl mx-auto">
    <PageHeader
      title="Aufgaben"
      subtitle={`${open.length} offen`}
      actions={
        <Button onClick={() => setDialogOpen(true)} className="bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Neue Aufgabe
        </Button>
      }
    />

      {aufgaben.length === 0 ? (
        <EmptyState icon={ListTodo} title="Keine Aufgaben" description="Erstellen Sie die erste Aufgabe für Ihr Team." action={
          <Button onClick={() => setDialogOpen(true)} className="bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-xl gap-2"><Plus className="w-4 h-4" /> Aufgabe erstellen</Button>
        } />
      ) : (
        <div className="space-y-4">
          {open.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Offen ({open.length})</p>
              {open.map(a => (
                <div key={a.id} className="bg-[#3a3a3a] rounded-2xl border border-[#4a4a4a] shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetailView(a)}>
                  <div className="flex items-center gap-3">
                    <button onClick={(e) => {
                      e.stopPropagation();
                      toggleMutation.mutate({ id: a.id, status: a.status });
                    }}
                      className="w-6 h-6 rounded-full border-2 border-gray-600 hover:border-[#22c55e] transition-colors shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-100">{a.title}</p>
                      {a.description && <p className="text-xs text-gray-400 mt-0.5">{a.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={a.priority === "high" ? "suspended" : a.priority === "low" ? "planned" : "assigned"} />
                      {a.due_date && <span className="text-xs text-gray-400">{a.due_date}</span>}
                    </div>
                  </div>
                  {(a.assigned_to_name || a.einrichtung_name || a.schadensprotokolle_ids?.length > 0) && (
                  <div className="mt-2 pt-2 border-t border-[#4a4a4a] flex flex-wrap gap-2">
                    {a.einrichtung_name && <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded">Stand: {a.einrichtung_name}</span>}
                    {a.assigned_to_name && <span className="text-xs bg-green-900/30 text-green-300 px-2 py-1 rounded">{a.assigned_to_name}</span>}
                    {a.schadensprotokolle_ids?.length > 0 && <span className="text-xs bg-orange-900/30 text-orange-300 px-2 py-1 rounded">{a.schadensprotokolle_ids.length} Schaden</span>}
                  </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {done.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Erledigt ({done.length})</p>
              {done.map(a => (
                <div key={a.id} className="bg-[#3a3a3a] rounded-2xl border border-[#4a4a4a] shadow-sm p-4 flex items-center gap-3 opacity-50">
                  <button onClick={() => toggleMutation.mutate({ id: a.id, status: a.status })}
                    className="w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-black" />
                  </button>
                  <p className="font-medium text-gray-400 line-through">{a.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) setEditingTask(null);
      }}>
        <DialogContent className="bg-[#2d2d2d] border-[#3a3a3a]">
          <DialogHeader><DialogTitle>{editingTask ? "Aufgabe bearbeiten" : "Neue Aufgabe"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label className="text-gray-100">Titel *</Label><Input className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <Label className="text-gray-100">Einrichtung (optional)</Label>
                  <Select value={form.einrichtung_id} onValueChange={(v) => {
                    const e = einrichtungen?.find(ei => ei.id === v);
                    setForm({ 
                      ...form, 
                      einrichtung_id: v,
                      einrichtung_name: e?.name || ""
                    });
                  }}>
                    <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"><SelectValue placeholder="Keine Einrichtung" /></SelectTrigger>
                    <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                      {einrichtungen?.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              <div>
                <Label className="text-gray-100">Zuweisen an (optional)</Label>
                <Select value={form.assigned_to} onValueChange={(v) => {
                  const member = tenantMembers?.find(m => m.id === v);
                  const person = personen?.find(p => p.id === v);
                  setForm({ 
                    ...form, 
                    assigned_to: v,
                    assigned_to_name: member ? (member.first_name + " " + member.last_name) : (person?.name || "")
                  });
                }}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"><SelectValue placeholder="Keine Zuweisung" /></SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    {tenantMembers?.map(m => <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>)}
                    {personen?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-gray-100">Beschreibung</Label><Textarea className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex gap-4">
              <div className="flex-1"><Label className="text-gray-100">Fällig am</Label><Input type="date" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              <div className="flex-1">
                <Label className="text-gray-100">Priorität</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || createMutation.isPending} className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-xl">
                {createMutation.isPending ? "Speichern..." : editingTask ? "Aktualisieren" : "Erstellen"}
              </Button>
              {editingTask && (
                <Button onClick={() => {
                  deleteMutation.mutate(editingTask.id);
                  setDialogOpen(false);
                }} variant="outline" className="px-4">Löschen</Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}