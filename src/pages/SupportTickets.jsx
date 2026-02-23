import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/ui/PageHeader";
import { LifeBuoy, Plus, MessageSquare, Send } from "lucide-react";

const STATUS_LABELS = {
  offen: { label: "Offen", color: "bg-red-50 text-red-700 border-red-200" },
  in_bearbeitung: { label: "In Bearbeitung", color: "bg-amber-50 text-amber-700 border-amber-200" },
  wartet_auf_kunde: { label: "Wartet auf Antwort", color: "bg-blue-50 text-blue-700 border-blue-200" },
  geloest: { label: "Gelöst", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  geschlossen: { label: "Geschlossen", color: "bg-gray-100 text-gray-600 border-gray-200" },
};

export default function SupportTickets() {
  const { user, tenant } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comment, setComment] = useState("");
  const [form, setForm] = useState({ title: "", description: "", category: "general", priority: "medium" });
  const qc = useQueryClient();

  const { data: tickets = [] } = useQuery({
    queryKey: ["my-tickets", tenant?.id],
    queryFn: () => base44.entities.SupportTicket.filter({ tenant_id: tenant.id }, "-created_date", 100),
    enabled: !!tenant?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SupportTicket.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
      setDialogOpen(false);
      setForm({ title: "", description: "", category: "general", priority: "medium" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupportTicket.update(id, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
      setSelectedTicket(updated);
      setComment("");
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      ...form,
      tenant_id: tenant.id,
      created_by_email: user.email,
      created_by_name: user.full_name,
    });
  };

  const handleAddComment = () => {
    if (!comment.trim() || !selectedTicket) return;
    const newComment = {
      author: user.full_name,
      author_email: user.email,
      text: comment.trim(),
      created_at: new Date().toISOString(),
      is_admin: false,
    };
    commentMutation.mutate({
      id: selectedTicket.id,
      data: { comments: [...(selectedTicket.comments || []), newComment] },
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Support"
        subtitle="Tickets und Anfragen"
        actions={
          <Button onClick={() => setDialogOpen(true)} className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Neues Ticket
          </Button>
        }
      />

      <div className="space-y-3">
        {tickets.map(t => {
          const s = STATUS_LABELS[t.status] || STATUS_LABELS.offen;
          return (
            <div
              key={t.id}
              onClick={() => setSelectedTicket(t)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <LifeBuoy className="w-4 h-4 text-[#0F2F23] mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{t.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{t.description}</p>
                  {t.comments?.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <MessageSquare className="w-3 h-3" />{t.comments.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {tickets.length === 0 && (
          <div className="text-center py-16 text-gray-500 text-sm">Noch keine Support-Tickets vorhanden.</div>
        )}
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Neues Support-Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Betreff *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Beschreibung *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kategorie</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Allgemein</SelectItem>
                    <SelectItem value="billing">Abrechnung</SelectItem>
                    <SelectItem value="technical">Technisch</SelectItem>
                    <SelectItem value="feature">Feature-Wunsch</SelectItem>
                    <SelectItem value="bug">Fehler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priorität</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                    <SelectItem value="critical">Kritisch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreate} disabled={!form.title || !form.description || createMutation.isPending} className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl">
              {createMutation.isPending ? "Wird gesendet..." : "Ticket erstellen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(o) => !o && setSelectedTicket(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTicket.title}</DialogTitle>
                <div className="flex items-center gap-2 pt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_LABELS[selectedTicket.status]?.color}`}>
                    {STATUS_LABELS[selectedTicket.status]?.label}
                  </span>
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedTicket.description}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-3">Kommentare ({selectedTicket.comments?.length || 0})</p>
                  <div className="space-y-3 max-h-52 overflow-y-auto mb-3">
                    {(selectedTicket.comments || []).map((c, i) => (
                      <div key={i} className={`rounded-xl p-3 text-sm ${c.is_admin ? "bg-[#0F2F23]/5 border border-[#0F2F23]/10" : "bg-gray-50 border border-gray-100"}`}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">{c.author} {c.is_admin && "· Support"}</span>
                          <span className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleString("de-DE")}</span>
                        </div>
                        <p className="text-gray-700">{c.text}</p>
                      </div>
                    ))}
                  </div>
                  {!["geloest", "geschlossen"].includes(selectedTicket.status) && (
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Antwort schreiben..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="resize-none"
                        rows={2}
                      />
                      <Button
                        onClick={handleAddComment}
                        disabled={!comment.trim() || commentMutation.isPending}
                        className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl px-4 shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}