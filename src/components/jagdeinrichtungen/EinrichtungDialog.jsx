import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const TYPE_OPTIONS = [
  { value: "hochsitz", label: "Hochsitz" },
  { value: "leiter", label: "Leiter" },
  { value: "erdsitz", label: "Erdsitz" },
  { value: "drueckjagdbock", label: "Drückjagdbock" },
  { value: "ansitzdrueckjagdleiter", label: "Ansitzdrückjagdleiter" },
  { value: "kirrung", label: "Kirrung" },
  { value: "salzlecke", label: "Salzlecke" },
  { value: "suhle", label: "Suhle" },
  { value: "wildacker", label: "Wildacker" },
  { value: "fuetterung", label: "Fütterung" },
  { value: "fanganlage", label: "Fanganlage" },
];

const CONDITION_OPTIONS = [
  { value: "gut", label: "Gut" },
  { value: "maessig", label: "Mäßig" },
  { value: "schlecht", label: "Schlecht" },
  { value: "neu", label: "Neu" },
];

export default function EinrichtungDialog({ isOpen, onClose, einrichtung, revierId, tenantId }) {
  const queryClient = useQueryClient();
  const isEdit = !!einrichtung;
  const [formData, setFormData] = useState({
    name: "", type: "", condition: "gut", notes: "", latitude: "", longitude: "",
  });

  useEffect(() => {
    if (einrichtung) {
      setFormData({
        name: einrichtung.name || "",
        type: einrichtung.type || "",
        condition: einrichtung.condition || "gut",
        notes: einrichtung.notes || "",
        latitude: einrichtung.latitude || "",
        longitude: einrichtung.longitude || "",
      });
    } else {
      setFormData({ name: "", type: "", condition: "gut", notes: "", latitude: "", longitude: "" });
    }
  }, [einrichtung, isOpen]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? base44.entities.Jagdeinrichtung.update(einrichtung.id, data)
        : base44.entities.Jagdeinrichtung.create({ ...data, tenant_id: tenantId, revier_id: revierId }),
    onSuccess: () => {
      queryClient.invalidateQueries(["einrichtungen"]);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.type) { alert("Name und Typ erforderlich"); return; }
    mutation.mutate({
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#2d2d2d] border-[#3a3a3a]">
        <DialogHeader>
          <DialogTitle className="text-gray-100">{isEdit ? "Einrichtung bearbeiten" : "Neue Einrichtung"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
          <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"><SelectValue placeholder="Typ auswählen" /></SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
              {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
              {CONDITION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" step="0.0001" placeholder="Breitengrad" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 text-xs" />
            <Input type="number" step="0.0001" placeholder="Längengrad" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 text-xs" />
          </div>
          <Textarea placeholder="Notizen" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 text-xs resize-none h-16" />
          <div className="flex gap-2">
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