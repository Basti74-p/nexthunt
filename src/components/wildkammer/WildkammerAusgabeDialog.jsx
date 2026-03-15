import React, { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const AUSGABE_TYPEN = {
  verkauf: "Verkauf", eigenverbrauch: "Eigenverbrauch", spende: "Spende", entsorgung: "Entsorgung",
};

export default function WildkammerAusgabeDialog({ open, onClose, onSave, item, kunden = [] }) {
  const [form, setForm] = useState({ ausgabe_datum: "", ausgabe_an: "", kunde_id: "", ausgabe_typ: "verkauf", verkaufspreis: "", notes: "" });

  useEffect(() => {
    if (open) setForm({ ausgabe_datum: new Date().toISOString().split("T")[0], ausgabe_an: "", kunde_id: "", ausgabe_typ: "verkauf", verkaufspreis: "", notes: item?.notes || "" });
  }, [open, item]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[#2d2d2d] border-[#3a3a3a] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-100">Ausgabe / Verkauf buchen</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Ausgabedatum *</Label>
              <Input type="date" value={form.ausgabe_datum} onChange={e => set("ausgabe_datum", e.target.value)}
                className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Ausgabeart *</Label>
              <Select value={form.ausgabe_typ} onValueChange={v => set("ausgabe_typ", v)}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  {Object.entries(AUSGABE_TYPEN).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-gray-300 text-xs mb-1 block">Empfänger / Käufer</Label>
            {kunden.length > 0 ? (
              <Select value={form.kunde_id} onValueChange={v => {
                const k = kunden.find(x => x.id === v);
                set("kunde_id", v);
                set("ausgabe_an", k?.name || "");
              }}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                  <SelectValue placeholder="Kunde wählen…" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  {kunden.map(k => <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={form.ausgabe_an} onChange={e => set("ausgabe_an", e.target.value)}
                placeholder="Name, Firma…" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            )}
          </div>
          {form.ausgabe_typ === "verkauf" && (
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Verkaufspreis (€)</Label>
              <Input type="number" step="0.01" value={form.verkaufspreis} onChange={e => set("verkaufspreis", e.target.value)}
                placeholder="z.B. 45.00" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>
          )}
          <div>
            <Label className="text-gray-300 text-xs mb-1 block">Notizen</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 resize-none" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1 border-[#3a3a3a]">Abbrechen</Button>
            <Button onClick={() => onSave(form)} disabled={!form.ausgabe_datum}
              className="flex-1 bg-[#22c55e] text-black hover:bg-[#16a34a]">Ausgabe buchen</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}