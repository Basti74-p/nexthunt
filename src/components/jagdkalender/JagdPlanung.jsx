import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, UserPlus, Trash2, MapPin, Users } from "lucide-react";

const ROLLEN = [
  { value: "jagdleiter", label: "Jagdleiter", color: "bg-yellow-900 text-yellow-200" },
  { value: "schuetze", label: "Schütze", color: "bg-green-900 text-green-200" },
  { value: "ansteller", label: "Ansteller", color: "bg-blue-900 text-blue-200" },
  { value: "treiber", label: "Treiber", color: "bg-orange-900 text-orange-200" },
  { value: "hundefuehrer", label: "Hundeführer", color: "bg-amber-900 text-amber-200" },
  { value: "nachsuchetrupp", label: "Nachsuchetrupp", color: "bg-red-900 text-red-200" },
  { value: "bergetrupp", label: "Bergetrupp", color: "bg-purple-900 text-purple-200" },
  { value: "wildkammer", label: "Wildkammer", color: "bg-teal-900 text-teal-200" },
  { value: "strassensicherung", label: "Straßensicherung", color: "bg-pink-900 text-pink-200" },
  { value: "sicherheit", label: "Sicherheit", color: "bg-rose-900 text-rose-200" },
  { value: "gast", label: "Jagdgast", color: "bg-gray-700 text-gray-300" },
];

const TEAM_GROUPS = [
  { id: "schuetze", label: "Schützen & Stände" },
  { id: "ansteller", label: "Ansteller" },
  { id: "treiber", label: "Treiber" },
  { id: "hundefuehrer", label: "Hundeführer" },
  { id: "nachsuchetrupp", label: "Nachsuchetrupp" },
  { id: "bergetrupp", label: "Bergetrupp" },
  { id: "wildkammer", label: "Wildkammer" },
  { id: "strassensicherung", label: "Straßensicherung" },
  { id: "sicherheit", label: "Sicherheit" },
];

function RollenBadge({ rolle }) {
  const r = ROLLEN.find(x => x.value === rolle);
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r?.color || "bg-gray-700 text-gray-300"}`}>
      {r?.label || rolle}
    </span>
  );
}

export default function JagdPlanung({ jagd, canManage }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", user_email: "", telefon: "", rolle: "schuetze", stand_nummer: "", stand_name: "", notizen: "" });
  const [activeGroup, setActiveGroup] = useState("schuetze");

  const { data: teilnehmer = [] } = useQuery({
    queryKey: ["jagd-teilnehmer", jagd.id],
    queryFn: () => base44.entities.JagdTeilnehmer.filter({ jagd_id: jagd.id }),
    enabled: !!jagd.id,
  });

  const { data: einrichtungen = [] } = useQuery({
    queryKey: ["einrichtungen-planung", jagd.revier_id],
    queryFn: () => base44.entities.Jagdeinrichtung.filter({ revier_id: jagd.revier_id }),
    enabled: !!jagd.revier_id,
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.JagdTeilnehmer.create({ ...data, jagd_id: jagd.id, tenant_id: jagd.tenant_id, status: "zugewiesen" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["jagd-teilnehmer", jagd.id] }); setShowAdd(false); setForm({ name: "", user_email: "", telefon: "", rolle: "schuetze", stand_nummer: "", stand_name: "", notizen: "" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.JagdTeilnehmer.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jagd-teilnehmer", jagd.id] }),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const grouped = (rolle) => teilnehmer.filter(t => t.rolle === rolle);
  const schuetzen = teilnehmer.filter(t => t.rolle === "schuetze" || t.rolle === "gast" || t.rolle === "jagdleiter");

  // All Hochsitze/Stände from Einrichtungen
  const staende = einrichtungen.filter(e => ["hochsitz", "leiter", "erdsitz", "drueckjagdbock", "ansitzdrueckjagdleiter"].includes(e.type));

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#1e1e1e] rounded-xl border border-[#2d2d2d] p-3 text-center">
          <p className="text-xl font-bold text-gray-100">{teilnehmer.length}</p>
          <p className="text-xs text-gray-500">Teilnehmer</p>
        </div>
        <div className="bg-[#1e1e1e] rounded-xl border border-[#2d2d2d] p-3 text-center">
          <p className="text-xl font-bold text-green-400">{schuetzen.length}</p>
          <p className="text-xs text-gray-500">Schützen</p>
        </div>
        <div className="bg-[#1e1e1e] rounded-xl border border-[#2d2d2d] p-3 text-center">
          <p className="text-xl font-bold text-blue-400">{grouped("ansteller").length}</p>
          <p className="text-xs text-gray-500">Ansteller</p>
        </div>
        <div className="bg-[#1e1e1e] rounded-xl border border-[#2d2d2d] p-3 text-center">
          <p className="text-xl font-bold text-orange-400">{grouped("treiber").length}</p>
          <p className="text-xs text-gray-500">Treiber</p>
        </div>
      </div>

      {/* Actions */}
      {canManage && (
        <Button onClick={() => setShowAdd(true)} className="gap-2 w-full sm:w-auto">
          <UserPlus className="w-4 h-4" /> Teilnehmer hinzufügen
        </Button>
      )}

      {/* Group Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TEAM_GROUPS.map(g => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g.id)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeGroup === g.id ? "bg-[#22c55e] text-black" : "bg-[#2d2d2d] text-gray-400 hover:text-gray-200"
            }`}
          >
            {g.label} ({grouped(g.id).length})
          </button>
        ))}
      </div>

      {/* Team List */}
      <div className="space-y-2">
        {grouped(activeGroup).length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Noch keine {TEAM_GROUPS.find(g => g.id === activeGroup)?.label} zugewiesen</p>
        ) : (
          grouped(activeGroup).map(t => (
            <div key={t.id} className="bg-[#1e1e1e] rounded-xl border border-[#2d2d2d] p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#2d2d2d] flex items-center justify-center text-sm font-bold text-[#22c55e] shrink-0">
                {t.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-100 text-sm">{t.name}</p>
                  <RollenBadge rolle={t.rolle} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {t.stand_nummer && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />Stand {t.stand_nummer}{t.stand_name ? ` – ${t.stand_name}` : ""}</span>}
                  {t.telefon && <span>{t.telefon}</span>}
                  {t.user_email && <span>{t.user_email}</span>}
                </div>
              </div>
              {canManage && (
                <button onClick={() => deleteMutation.mutate(t.id)} className="p-1.5 rounded-lg hover:bg-red-900/40 text-gray-500 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Stände aus Revier */}
      {staende.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" />Stände im Revier ({staende.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {staende.map(s => {
              const besetzt = teilnehmer.find(t => t.stand_id === s.id);
              return (
                <div key={s.id} className={`rounded-xl border p-3 text-xs ${besetzt ? "bg-green-900/20 border-green-800" : "bg-[#1e1e1e] border-[#2d2d2d]"}`}>
                  <p className="font-medium text-gray-200 truncate">{s.name}</p>
                  <p className="text-gray-500 mt-0.5">{besetzt ? `👤 ${besetzt.name}` : "Nicht besetzt"}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#1e1e1e] border-[#2d2d2d] text-gray-100 max-w-sm">
          <DialogHeader><DialogTitle>Teilnehmer hinzufügen</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-gray-300 text-sm">Name *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1" />
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Rolle *</Label>
              <Select value={form.rolle} onValueChange={v => set("rolle", v)}>
                <SelectTrigger className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1e1e] border-[#2d2d2d]">
                  {ROLLEN.map(r => <SelectItem key={r.value} value={r.value} className="text-gray-100">{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {(form.rolle === "schuetze" || form.rolle === "gast") && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-gray-300 text-sm">Stand-Nr.</Label>
                  <Input value={form.stand_nummer} onChange={e => set("stand_nummer", e.target.value)} placeholder="z.B. 4" className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1" />
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">Stand-Name</Label>
                  <Select value={form.stand_id || ""} onValueChange={v => { const s = staende.find(x => x.id === v); set("stand_id", v); set("stand_name", s?.name || ""); }}>
                    <SelectTrigger className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1">
                      <SelectValue placeholder="Aus Karte" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1e1e] border-[#2d2d2d]">
                      {staende.map(s => <SelectItem key={s.id} value={s.id} className="text-gray-100">{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div>
              <Label className="text-gray-300 text-sm">E-Mail / App-User</Label>
              <Input value={form.user_email} onChange={e => set("user_email", e.target.value)} placeholder="optional" className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1" />
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Telefon</Label>
              <Input value={form.telefon} onChange={e => set("telefon", e.target.value)} className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1" />
            </div>
            <Button onClick={() => addMutation.mutate(form)} disabled={!form.name || addMutation.isPending} className="w-full">
              {addMutation.isPending ? "Hinzufügen..." : "Hinzufügen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}