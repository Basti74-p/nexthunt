import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Building, MapPin, AlertTriangle, Filter, Trash2, MoveRight, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/hooks/useAuth";
import EinrichtungDialog from "@/components/jagdeinrichtungen/EinrichtungDialog";
import EinrichtungDetail from "@/components/jagdeinrichtungen/EinrichtungDetail";

const TYPE_LABEL = {
  hochsitz: "Hochsitz", leiter: "Leiter", erdsitz: "Erdsitz", drueckjagdbock: "Drückjagdbock",
  ansitzdrueckjagdleiter: "Ansitzdrückjagdleiter", kirrung: "Kirrung", salzlecke: "Salzlecke",
  suhle: "Suhle", wildacker: "Wildacker", fuetterung: "Fütterung", fanganlage: "Fanganlage",
};

const CONDITION_COLOR = {
  gut: "bg-green-900 text-green-300 border-green-800",
  maessig: "bg-yellow-900 text-yellow-300 border-yellow-800",
  schlecht: "bg-red-900 text-red-300 border-red-800",
  neu: "bg-blue-900 text-blue-300 border-blue-800",
};
const CONDITION_LABEL = { gut: "Gut", maessig: "Mäßig", schlecht: "Schlecht", neu: "Neu" };

const TYPE_ICON_COLOR = {
  hochsitz: "bg-green-900/30 text-green-400",
  leiter: "bg-green-900/30 text-green-400",
  erdsitz: "bg-emerald-900/30 text-emerald-400",
  drueckjagdbock: "bg-teal-900/30 text-teal-400",
  ansitzdrueckjagdleiter: "bg-teal-900/30 text-teal-400",
  kirrung: "bg-amber-900/30 text-amber-400",
  salzlecke: "bg-amber-900/30 text-amber-400",
  suhle: "bg-blue-900/30 text-blue-400",
  wildacker: "bg-lime-900/30 text-lime-400",
  fuetterung: "bg-orange-900/30 text-orange-400",
  fanganlage: "bg-red-900/30 text-red-400",
};

export default function Jagdeinrichtungen() {
  const { tenant, user, tenantMember } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCondition, setFilterCondition] = useState("all");
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState({ open: false, einrichtung: null });
  const [moveDialog, setMoveDialog] = useState({ open: false, einrichtung: null });
  const [moveRevierTarget, setMoveRevierTarget] = useState("");

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: einrichtungen = [], isLoading } = useQuery({
    queryKey: ["einrichtungen", tenant?.id, tenantMember?.id],
    queryFn: async () => {
      const allEinrichtungen = await base44.entities.Jagdeinrichtung.filter({ tenant_id: tenant?.id });
      // If user has allowed_reviere restrictions, filter by those
      if (tenantMember?.allowed_reviere?.length > 0) {
        return allEinrichtungen.filter(e => tenantMember.allowed_reviere.includes(e.revier_id));
      }
      return allEinrichtungen;
    },
    enabled: !!tenant?.id,
  });

  const deleteEinrichtung = useMutation({
    mutationFn: (id) => base44.entities.Jagdeinrichtung.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["einrichtungen", tenant?.id]);
      setSelected(null);
    },
  });

  const moveEinrichtung = useMutation({
    mutationFn: ({ id, revier_id }) => base44.entities.Jagdeinrichtung.update(id, { revier_id }),
    onSuccess: () => {
      queryClient.invalidateQueries(["einrichtungen", tenant?.id]);
      setMoveDialog({ open: false, einrichtung: null });
      setMoveRevierTarget("");
      setSelected(null);
    },
  });

  const filtered = einrichtungen.filter((e) => {
    const matchSearch = !search || e.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || e.type === filterType;
    const matchCond = filterCondition === "all" || e.condition === filterCondition;
    return matchSearch && matchType && matchCond;
  });

  const revierName = (id) => reviere.find((r) => r.id === id)?.name || "–";

  const stats = {
    gesamt: einrichtungen.length,
    schlecht: einrichtungen.filter((e) => e.condition === "schlecht").length,
    maessig: einrichtungen.filter((e) => e.condition === "maessig").length,
  };

  if (!tenant) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center text-gray-400">
        <Building className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Bitte wählen Sie einen Tenant aus.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Jagdeinrichtungen</h1>
          <p className="text-sm text-gray-400 mt-0.5">Hochsitze, Kanzeln, Kirrungen und mehr</p>
        </div>
        <Button onClick={() => setDialog({ open: true, einrichtung: null })} className="bg-[#22c55e] text-black hover:bg-[#16a34a]">
          <Plus className="w-4 h-4 mr-2" /> Neue Einrichtung
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-100">{stats.gesamt}</p>
          <p className="text-xs text-gray-400 mt-0.5">Einrichtungen gesamt</p>
        </div>
        <div className="bg-[#1e1e1e] border border-yellow-900/40 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{stats.maessig}</p>
          <p className="text-xs text-gray-400 mt-0.5">Zustand mäßig</p>
        </div>
        <div className="bg-[#1e1e1e] border border-red-900/40 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{stats.schlecht}</p>
          <p className="text-xs text-gray-400 mt-0.5">Zustand schlecht</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* List */}
        <div className="flex-1 min-w-0">
          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-[#1e1e1e] border-[#3a3a3a] text-gray-100"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-36 bg-[#1e1e1e] border-[#3a3a3a] text-gray-300 text-xs">
                <SelectValue placeholder="Typ" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                <SelectItem value="all">Alle Typen</SelectItem>
                {Object.entries(TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCondition} onValueChange={setFilterCondition}>
              <SelectTrigger className="w-32 bg-[#1e1e1e] border-[#3a3a3a] text-gray-300 text-xs">
                <SelectValue placeholder="Zustand" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                <SelectItem value="all">Alle Zustände</SelectItem>
                <SelectItem value="gut">Gut</SelectItem>
                <SelectItem value="maessig">Mäßig</SelectItem>
                <SelectItem value="schlecht">Schlecht</SelectItem>
                <SelectItem value="neu">Neu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Laden...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Building className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">Keine Einrichtungen gefunden</p>
              <p className="text-xs text-gray-500 mt-1">Legen Sie die erste Jagdeinrichtung an</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((e) => (
                <div
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className={`bg-[#1e1e1e] border rounded-xl p-4 cursor-pointer transition-all hover:border-[#22c55e]/40 group ${
                    selected?.id === e.id ? "border-[#22c55e]/60 bg-[#1a2e1a]" : "border-[#2d2d2d]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${TYPE_ICON_COLOR[e.type] || "bg-gray-800 text-gray-400"}`}>
                      <Building className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-100 truncate">{e.name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${CONDITION_COLOR[e.condition]}`}>
                          {CONDITION_LABEL[e.condition] || e.condition}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        <span>{TYPE_LABEL[e.type] || e.type}</span>
                        <span>·</span>
                        <span>{revierName(e.revier_id)}</span>
                        {e.latitude && e.longitude && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {Number(e.latitude).toFixed(3)}, {Number(e.longitude).toFixed(3)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(ev) => { ev.stopPropagation(); setDialog({ open: true, einrichtung: e }); }}
                        className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400"
                        title="Bearbeiten"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); setMoveRevierTarget(e.revier_id); setMoveDialog({ open: true, einrichtung: e }); }}
                        className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400"
                        title="In anderes Revier verschieben"
                      >
                        <MoveRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); if (window.confirm(`"${e.name}" wirklich löschen?`)) deleteEinrichtung.mutate(e.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                        title="Löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-96 shrink-0 bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-5 h-fit sticky top-0">
            <EinrichtungDetail
              einrichtung={selected}
              tenantId={tenant?.id}
              onBack={() => setSelected(null)}
              onEdit={() => setDialog({ open: true, einrichtung: selected })}
              onDelete={() => setSelected(null)}
            />
          </div>
        )}
      </div>

      {/* Move Dialog */}
      <Dialog open={moveDialog.open} onOpenChange={(o) => !o && setMoveDialog({ open: false, einrichtung: null })}>
        <DialogContent className="bg-[#2d2d2d] border-[#3a3a3a]">
          <DialogHeader>
            <DialogTitle>Einrichtung verschieben</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-400">„{moveDialog.einrichtung?.name}" in ein anderes Revier verschieben</p>
          <div className="mt-2">
            <Label className="text-xs mb-1 block">Ziel-Revier</Label>
            <Select value={moveRevierTarget} onValueChange={setMoveRevierTarget}>
              <SelectTrigger className="bg-[#1e1e1e] border-[#3a3a3a]">
                <SelectValue placeholder="Revier wählen" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                {reviere.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setMoveDialog({ open: false, einrichtung: null })} className="flex-1">Abbrechen</Button>
            <Button
              onClick={() => moveEinrichtung.mutate({ id: moveDialog.einrichtung.id, revier_id: moveRevierTarget })}
              disabled={!moveRevierTarget || moveRevierTarget === moveDialog.einrichtung?.revier_id || moveEinrichtung.isPending}
              className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-black"
            >
              Verschieben
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog */}
      <EinrichtungDialog
        isOpen={dialog.open}
        onClose={() => setDialog({ open: false, einrichtung: null })}
        einrichtung={dialog.einrichtung}
        revierId={dialog.einrichtung?.revier_id || reviere[0]?.id}
        tenantId={tenant?.id}
      />
    </div>
  );
}