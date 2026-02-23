import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Users, UserPlus } from "lucide-react";
import { useAuth } from "@/components/hooks/useAuth";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";

const ROLES = [
  { value: "schuetze", label: "Schütze" },
  { value: "ansteller", label: "Ansteller" },
  { value: "bergetrupp", label: "Bergetrupp" },
  { value: "nachsuchetrupp", label: "Nachsuchetrupp" },
];

export default function RevierGesellschaftsjagd({ revier }) {
  const { tenant, isTenantOwner, isPlatformAdmin } = useAuth();
  const [eventDialog, setEventDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventForm, setEventForm] = useState({ title: "", date: "", description: "" });
  const [assignForm, setAssignForm] = useState({ user_email: "", user_name: "", role: "schuetze", stand_label: "" });
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ["jagdevents", revier.id],
    queryFn: () => base44.entities.JagdEvent.filter({ revier_id: revier.id }),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", selectedEvent?.id],
    queryFn: () => base44.entities.JagdEventAssignment.filter({ jagd_event_id: selectedEvent.id }),
    enabled: !!selectedEvent?.id,
  });

  const createEventMutation = useMutation({
    mutationFn: (data) => base44.entities.JagdEvent.create({ ...data, revier_id: revier.id, tenant_id: tenant.id, status: "planned" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jagdevents"] });
      setEventDialog(false);
      setEventForm({ title: "", date: "", description: "" });
    },
  });

  const createAssignMutation = useMutation({
    mutationFn: (data) => base44.entities.JagdEventAssignment.create({
      ...data, jagd_event_id: selectedEvent.id, tenant_id: tenant.id, status: "zugewiesen",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setAssignDialog(false);
      setAssignForm({ user_email: "", user_name: "", role: "schuetze", stand_label: "" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.JagdEvent.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jagdevents"] }),
  });

  const canManage = isTenantOwner || isPlatformAdmin;

  return (
    <div>
      <div className="flex justify-end mb-4 gap-2">
        {canManage && (
          <Button onClick={() => setEventDialog(true)} className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Neue Gesellschaftsjagd
          </Button>
        )}
      </div>

      {events.length === 0 ? (
        <EmptyState icon={Users} title="Keine Gesellschaftsjagden" description="Planen Sie eine Gesellschaftsjagd mit Teilnehmern und Standvergabe." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Events list */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 px-1">Jagden</h3>
            {events.map(e => (
              <button
                key={e.id}
                onClick={() => setSelectedEvent(e)}
                className={`w-full text-left bg-white rounded-2xl border shadow-sm p-4 transition-all ${selectedEvent?.id === e.id ? "border-[#0F2F23] ring-1 ring-[#0F2F23]/20" : "border-gray-100 hover:border-gray-200"}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{e.title}</h3>
                  <StatusBadge status={e.status} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{e.date}</p>
                {canManage && e.status !== "finished" && (
                  <div className="flex gap-2 mt-3">
                    {e.status === "planned" && (
                      <Button size="sm" variant="outline" onClick={(ev) => { ev.stopPropagation(); updateStatusMutation.mutate({ id: e.id, status: "active" }); }} className="text-xs rounded-lg">
                        Aktivieren
                      </Button>
                    )}
                    {e.status === "active" && (
                      <Button size="sm" variant="outline" onClick={(ev) => { ev.stopPropagation(); updateStatusMutation.mutate({ id: e.id, status: "finished" }); }} className="text-xs rounded-lg">
                        Beenden
                      </Button>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Assignments */}
          {selectedEvent && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-500">Teilnehmer – {selectedEvent.title}</h3>
                {canManage && (
                  <Button size="sm" onClick={() => setAssignDialog(true)} className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-lg gap-1 text-xs">
                    <UserPlus className="w-3.5 h-3.5" /> Zuweisen
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {assignments.map(a => (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0F2F23] flex items-center justify-center text-white text-xs font-bold">
                      {a.user_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{a.user_name || a.user_email}</p>
                      <p className="text-xs text-gray-500">{ROLES.find(r => r.value === a.role)?.label} {a.stand_label ? `• Stand ${a.stand_label}` : ""}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
                {assignments.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Noch keine Teilnehmer zugewiesen.</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Event Dialog */}
      <Dialog open={eventDialog} onOpenChange={setEventDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neue Gesellschaftsjagd</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Titel *</Label><Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} /></div>
            <div><Label>Datum *</Label><Input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} /></div>
            <div><Label>Beschreibung</Label><Textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} /></div>
            <Button onClick={() => createEventMutation.mutate(eventForm)} disabled={!eventForm.title || !eventForm.date || createEventMutation.isPending} className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] rounded-xl">
              {createEventMutation.isPending ? "Erstellen..." : "Erstellen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Teilnehmer zuweisen</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Name</Label><Input value={assignForm.user_name} onChange={(e) => setAssignForm({ ...assignForm, user_name: e.target.value })} /></div>
            <div><Label>E-Mail *</Label><Input value={assignForm.user_email} onChange={(e) => setAssignForm({ ...assignForm, user_email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rolle</Label>
                <Select value={assignForm.role} onValueChange={(v) => setAssignForm({ ...assignForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Stand</Label><Input value={assignForm.stand_label} onChange={(e) => setAssignForm({ ...assignForm, stand_label: e.target.value })} placeholder="z.B. Stand 4" /></div>
            </div>
            <Button onClick={() => createAssignMutation.mutate(assignForm)} disabled={!assignForm.user_email || createAssignMutation.isPending} className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] rounded-xl">
              {createAssignMutation.isPending ? "Zuweisen..." : "Zuweisen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}