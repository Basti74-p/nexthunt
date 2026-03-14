import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const SPECIES = [
  { value: "rehwild", label: "Rehwild" },
  { value: "rotwild", label: "Rotwild" },
  { value: "schwarzwild", label: "Schwarzwild" },
  { value: "damwild", label: "Damwild" },
  { value: "sikawild", label: "Sikawild" },
  { value: "wolf", label: "Wolf" },
];

export default function SichtungForm({ isOpen, onClose, revierId, tenantId, lat, lng }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    species: "rehwild",
    quantity: 1,
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.WildManagement.create({
      tenant_id: tenantId,
      revier_id: revierId,
      type: "observation",
      species: form.species,
      quantity: form.quantity,
      date: form.date,
      notes: form.notes,
      latitude: lat,
      longitude: lng,
    });
    queryClient.invalidateQueries(["wildmanagement-map"]);
    queryClient.invalidateQueries(["sightings-mobile"]);
    setSaving(false);
    setForm({ species: "rehwild", quantity: 1, date: new Date().toISOString().split("T")[0], notes: "" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e1e] border-[#3a3a3a]">
        <DialogHeader>
          <DialogTitle className="text-gray-100">Sichtung erfassen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Wildart</Label>
            <Select value={form.species} onValueChange={v => setForm({ ...form, species: v })}>
              <SelectTrigger className="bg-[#2a2a2a] border-[#3a3a3a] text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPECIES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Anzahl</Label>
              <Input
                type="number"
                min="1"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                className="bg-[#2a2a2a] border-[#3a3a3a] text-gray-100"
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Datum</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="bg-[#2a2a2a] border-[#3a3a3a] text-gray-100"
              />
            </div>
          </div>
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Notiz (optional)</Label>
            <Input
              placeholder="z.B. 3 Stück am Waldrand..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="bg-[#2a2a2a] border-[#3a3a3a] text-gray-100"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold rounded-xl"
          >
            {saving ? "Speichern..." : "Sichtung speichern"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}