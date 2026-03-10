import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const SCHADENSART_OPTIONS = [
  { value: "vandalismus", label: "Vandalismus" },
  { value: "sturm", label: "Sturm" },
  { value: "schnee", label: "Schnee" },
  { value: "alterung", label: "Alterung" },
  { value: "wildschaden", label: "Wildschaden" },
  { value: "sonstiges", label: "Sonstiges" },
];

const SCHWERE_OPTIONS = [
  { value: "gering", label: "Gering" },
  { value: "mittel", label: "Mittel" },
  { value: "schwer", label: "Schwer" },
  { value: "total", label: "Totalschaden" },
];

const STATUS_OPTIONS = [
  { value: "erfasst", label: "Erfasst" },
  { value: "in_reparatur", label: "In Reparatur" },
  { value: "behoben", label: "Behoben" },
];

export default function SchadensprotokollDialog({ isOpen, onClose, schaden, einrichtung, tenantId }) {
  const queryClient = useQueryClient();
  const isEdit = !!schaden;
  const [formData, setFormData] = useState({
    titel: "", datum: new Date().toISOString().split("T")[0],
    schadensart: "sonstiges", schwere: "gering", status: "erfasst",
    beschreibung: "", kosten_geschaetzt: "", behoben_am: "", behoben_durch: "",
  });

  useEffect(() => {
    if (schaden) {
      setFormData({
        titel: schaden.titel || "",
        datum: schaden.datum || new Date().toISOString().split("T")[0],
        schadensart: schaden.schadensart || "sonstiges",
        schwere: schaden.schwere || "gering",
        status: schaden.status || "erfasst",
        beschreibung: schaden.beschreibung || "",
        kosten_geschaetzt: schaden.kosten_geschaetzt || "",
        behoben_am: schaden.behoben_am || "",
        behoben_durch: schaden.behoben_durch || "",
      });
    } else {
      setFormData({
        titel: "", datum: new Date().toISOString().split("T")[0],
        schadensart: "sonstiges", schwere: "gering", status: "erfasst",
        beschreibung: "", kosten_geschaetzt: "", behoben_am: "", behoben_durch: "",
      });
    }
  }, [schaden, isOpen]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? base44.entities.Schadensprotokoll.update(schaden.id, data)
        : base44.entities.Schadensprotokoll.create({
            ...data,
            tenant_id: tenantId,
            revier_id: einrichtung.revier_id,
            einrichtung_id: einrichtung.id,
            einrichtung_name: einrichtung.name,
          }),
    onSuccess: () => {
      queryClient.invalidateQueries(["schadensprotokoll", einrichtung?.id]);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.titel || !formData.datum) { alert("Titel und Datum erforderlich"); return; }
    mutation.mutate({
      ...formData,
      kosten_geschaetzt: formData.kosten_geschaetzt ? parseFloat(formData.kosten_geschaetzt) : undefined,
    });
  };

  const set = (k, v) => setFormData((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#2d2d2d] border-[#3a3a3a]">
        <DialogHeader>
          <DialogTitle className="text-gray-100">{isEdit ? "Schaden bearbeiten" : "Schaden erfassen"}</DialogTitle>
          {einrichtung && <p className="text-xs text-gray-400 mt-0.5">{einrichtung.name}</p>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input placeholder="Titel" value={formData.titel} onChange={(e) => set("titel", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Datum</label>
              <Input type="date" value={formData.datum} onChange={(e) => set("datum", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Geschätzte Kosten (€)</label>
              <Input type="number" step="0.01" placeholder="0.00" value={formData.kosten_geschaetzt} onChange={(e) => set("kosten_geschaetzt", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Art</label>
              <Select value={formData.schadensart} onValueChange={(v) => set("schadensart", v)}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  {SCHADENSART_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Schwere</label>
              <Select value={formData.schwere} onValueChange={(v) => set("schwere", v)}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  {SCHWERE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Status</label>
              <Select value={formData.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea placeholder="Beschreibung" value={formData.beschreibung} onChange={(e) => set("beschreibung", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 text-xs resize-none h-20" />
          {formData.status === "behoben" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Behoben am</label>
                <Input type="date" value={formData.behoben_am} onChange={(e) => set("behoben_am", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Behoben durch</label>
                <Input placeholder="Name" value={formData.behoben_durch} onChange={(e) => set("behoben_durch", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
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