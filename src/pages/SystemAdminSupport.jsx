import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import AccessDenied from "@/components/ui/AccessDenied";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LifeBuoy, Search, MessageSquare, Clock, CheckCircle2, AlertCircle, Send } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "offen", label: "Offen", color: "bg-red-500/20 text-red-300" },
  { value: "in_bearbeitung", label: "In Bearbeitung", color: "bg-amber-500/20 text-amber-300" },
  { value: "wartet_auf_kunde", label: "Wartet auf Kunde", color: "bg-blue-500/20 text-blue-300" },
  { value: "geloest", label: "Gelöst", color: "bg-emerald-500/20 text-emerald-300" },
  { value: "geschlossen", label: "Geschlossen", color: "bg-slate-600 text-slate-400" },
];

const PRIORITY_COLORS = {
  low: "text-slate-400",
  medium: "text-amber-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

function StatusBadge({ status }) {
  const opt = STATUS_OPTIONS.find(o => o.value === status);
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${opt?.color || "bg-slate-700 text-slate-400"}`}>{opt?.label || status}</span>;
}

export default function SystemAdminSupport() {
  const { isPlatformAdmin, user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comment, setComment] = useState("");
  const qc = useQueryClient();

  const { data: tickets = [] } = useQuery({
    queryKey: ["sa-tickets"],
    queryFn: () => base44.entities.SupportTicket.list("-created_date", 200),
    enabled: isPlatformAdmin,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["sa-tenants"],
    queryFn: () => base44.entities.Tenant.list(),
    enabled: isPlatformAdmin,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupportTicket.update(id, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["sa-tickets"] });
      setSelectedTicket(updated);
    },
  });

  if (!isPlatformAdmin) return <AccessDenied />;

  const tenantMap = Object.fromEntries(tenants.map(t => [t.id, t.name]));

  const filtered = tickets.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.created_by_name?.toLowerCase().includes(search.toLowerCase()) ||
      tenantMap[t.tenant_id]?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (ticketId, newStatus) => {
    const ticket = tickets.find(t => t.id === ticketId);
    updateMutation.mutate({ id: ticketId, data: { ...ticket, status: newStatus } });
  };

  const handleAddComment = () => {
    if (!comment.trim() || !selectedTicket) return;
    const newComment = {
      author: user.full_name,
      author_email: user.email,
      text: comment.trim(),
      created_at: new Date().toISOString(),
      is_admin: true,
    };
    const updatedComments = [...(selectedTicket.comments || []), newComment];
    updateMutation.mutate({ id: selectedTicket.id, data: { comments: updatedComments } });
    setComment("");
  };

  const openCounts = tickets.filter(t => t.status === "offen").length;

  return (
    <AdminLayout currentPage="SystemAdminSupport">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Support-Tickets</h1>
            <p className="text-slate-400 text-sm mt-1">
              {tickets.length} Tickets gesamt · <span className="text-red-400">{openCounts} offen</span>
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Tickets suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 bg-slate-800 border-slate-700 text-white rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">Alle Status</SelectItem>
              {STATUS_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-white">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ticket list */}
        <div className="space-y-2">
          {filtered.map(t => (
            <div
              key={t.id}
              onClick={() => setSelectedTicket(t)}
              className="bg-slate-800 rounded-2xl border border-slate-700 p-4 hover:border-emerald-500/40 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <LifeBuoy className={`w-4 h-4 mt-0.5 shrink-0 ${PRIORITY_COLORS[t.priority]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white text-sm">{t.title}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {tenantMap[t.tenant_id] || t.tenant_id} · {t.created_by_name || t.created_by_email}
                    {t.comments?.length > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1"><MessageSquare className="w-3 h-3" />{t.comments.length}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-500">Keine Tickets gefunden.</div>
          )}
        </div>
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(o) => !o && setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white text-lg">{selectedTicket.title}</DialogTitle>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <StatusBadge status={selectedTicket.status} />
                  <span className={`text-xs font-medium capitalize ${PRIORITY_COLORS[selectedTicket.priority]}`}>
                    {selectedTicket.priority}
                  </span>
                  <span className="text-xs text-slate-500">
                    {tenantMap[selectedTicket.tenant_id] || selectedTicket.tenant_id}
                  </span>
                </div>
              </DialogHeader>
              <div className="space-y-5 mt-2">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <p className="text-sm text-slate-300 leading-relaxed">{selectedTicket.description}</p>
                  <p className="text-xs text-slate-500 mt-3">Von: {selectedTicket.created_by_name} ({selectedTicket.created_by_email})</p>
                </div>

                {/* Status change */}
                <div>
                  <Label className="text-slate-400 text-xs mb-2 block">Status ändern</Label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => handleStatusChange(selectedTicket.id, o.value)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-all ${
                          selectedTicket.status === o.value
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                            : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <Label className="text-slate-400 text-xs mb-2 block">Kommentare ({selectedTicket.comments?.length || 0})</Label>
                  <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
                    {(selectedTicket.comments || []).map((c, i) => (
                      <div key={i} className={`rounded-xl p-3 text-sm ${c.is_admin ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-slate-800 border border-slate-700"}`}>
                        <div className="flex justify-between mb-1">
                          <span className={`text-xs font-semibold ${c.is_admin ? "text-emerald-400" : "text-slate-300"}`}>
                            {c.author} {c.is_admin && "· Admin"}
                          </span>
                          <span className="text-[10px] text-slate-500">{new Date(c.created_at).toLocaleString("de-DE")}</span>
                        </div>
                        <p className="text-slate-300">{c.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Antwort schreiben..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl resize-none"
                      rows={2}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!comment.trim() || updateMutation.isPending}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}