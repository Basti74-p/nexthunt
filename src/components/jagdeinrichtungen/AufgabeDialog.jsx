import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/hooks/useAuth";
import MobileSelect from "@/components/ui/MobileSelect";

export default function AufgabeDialog({ isOpen, onClose, aufgabe, einrichtung, tenantId }) {
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  const isEdit = !!aufgabe;

  const { data: members = [] } = useQuery({
    queryKey: ["members", tenant?.id],
    queryFn: () => base44.entities.TenantMember.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id && isOpen,
  });

  const { data: schaeden = [] } = useQuery({
    queryKey: ["schadensprotokolle", einrichtung?.id],
    queryFn: () => base44.entities.Schadensprotokoll.filter({ einrichtung_id: einrichtung?.id }),
    enabled: !!einrichtung?.id && isOpen,
  });

  const [formData, setFormData] = useState({
    title: "", description: "", due_date: "", priority: "medium",
    status: "offen", assigned_to: "", assigned_to_name: "",
    einrichtung_id: "", einrichtung_name: "", schadensprotokolle_ids: [],
  });

  useEffect(() => {
    if (aufgabe) {
      setFormData({
        title: aufgabe.title || "",
        description: aufgabe.description || "",
        due_date: aufgabe.due_date || "",
        priority: aufgabe.priority || "medium",
        status: aufgabe.status || "offen",
        assigned_to: aufgabe.assigned_to || "",
        assigned_to_name: aufgabe.assigned_to_name || "",
        einrichtung_id: aufgabe.einrichtung_id || "",
        einrichtung_name: aufgabe.einrichtung_name || "",
        schadensprotokolle_ids: aufgabe.schadensprotokolle_ids || [],
      });
    } else {
      setFormData({
        title: "", description: "", due_date: "", priority: "medium", status: "offen",
        assigned_to: "", assigned_to_name: "",
        einrichtung_id: einrichtung?.id || "",
        einrichtung_name: einrichtung?.name || "",
        schadensprotokolle_ids: [],
      });
    }
  }, [aufgabe, einrichtung, isOpen]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? base44.entities.Aufgabe.update(aufgabe.id, data)
        : base44.entities.Aufgabe.create({
            ...data,
            tenant_id: tenantId,
            revier_id: einrichtung?.revier_id || "",
          }),
    onSuccess: () => {
      queryClient.invalidateQueries(["aufgaben_einrichtung", einrichtung?.id]);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) { alert("Titel erforderlich"); return; }
    mutation.mutate(formData);
  };

  const handleMemberSelect = (memberId) => {
    if (memberId === "__none__") {
      setFormData((p) => ({ ...p, assigned_to: "", assigned_to_name: "" }));
      return;
    }
    const member = members.find((m) => m.id === memberId);
    if (member) {
      setFormData((p) => ({
        ...p,
        assigned_to: member.user_email || member.id,
        assigned_to_name: `${member.first_name} ${member.last_name}`,
      }));
    }
  };

  const set = (k, v) => setFormData((p) => ({ ...p, [k]: v }));

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="bg-[#2d2d2d] border-t border-[#3a3a3a] max-h-[92dvh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-gray-100 text-base">{isEdit ? "Aufgabe bearbeiten" : "Neue Aufgabe"}</DrawerTitle>
          {einrichtung && <p className="text-xs text-gray-400 mt-0.5">{einrichtung.name}</p>}
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="overflow-y-auto px-4 space-y-3 pb-2">
          <Input placeholder="Titel" value={formData.title} onChange={(e) => set("title", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
          <Textarea placeholder="Beschreibung" value={formData.description} onChange={(e) => set("description", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 text-xs resize-none h-16" />
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Fälligkeitsdatum</label>
              <Input type="date" value={formData.due_date} onChange={(e) => set("due_date", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 w-full" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Priorität</label>
              <MobileSelect
                value={formData.priority}
                onValueChange={(v) => set("priority", v)}
                label="Priorität"
                items={[{ value: "low", label: "Niedrig" }, { value: "medium", label: "Mittel" }, { value: "high", label: "Hoch" }]}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Zuweisen an</label>
            <MobileSelect
              value={formData.assigned_to || "__none__"}
              onValueChange={handleMemberSelect}
              label="Zuweisen an"
              placeholder="Person auswählen"
              items={[{ value: "__none__", label: "Nicht zugewiesen" }, ...members.map((m) => ({ value: m.id, label: `${m.first_name} ${m.last_name}` }))]}
            />
          </div>
          {isEdit && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Status</label>
              <MobileSelect
                value={formData.status}
                onValueChange={(v) => set("status", v)}
                label="Status"
                items={[{ value: "offen", label: "Offen" }, { value: "in_bearbeitung", label: "In Bearbeitung" }, { value: "erledigt", label: "Erledigt" }]}
              />
            </div>
          )}
          {schaeden.length > 0 && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Protokolle anhängen (optional)</label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {schaeden.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-[#1a1a1a]">
                    <input
                      type="checkbox"
                      checked={(formData.schadensprotokolle_ids || []).includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          set("schadensprotokolle_ids", [...(formData.schadensprotokolle_ids || []), s.id]);
                        } else {
                          set("schadensprotokolle_ids", (formData.schadensprotokolle_ids || []).filter(id => id !== s.id));
                        }
                      }}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="text-xs text-gray-300 flex-1">{s.titel}</span>
                    <span className="text-[10px] text-gray-500">{s.datum}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 border-[#3a3a3a]">Abbrechen</Button>
            <Button type="submit" disabled={mutation.isPending} className="flex-1 bg-[#22c55e] text-black hover:bg-[#16a34a]">
              {mutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}