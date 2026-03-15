import React, { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const SPECIES_LABELS = {
  rotwild: "Rotwild", schwarzwild: "Schwarzwild", rehwild: "Rehwild",
  damwild: "Damwild", sikawild: "Sikawild", wolf: "Wolf",
};
const GENDER_LABELS = { maennlich: "Männlich", weiblich: "Weiblich", unbekannt: "Unbekannt" };

const EMPTY = {
  species: "", gender: "unbekannt", age_class: "", revier_id: "",
  eingang_datum: new Date().toISOString().split("T")[0],
  eingang_zeit: new Date().toTimeString().slice(0, 5),
  gewicht_aufgebrochen: "", kuehltemperatur: "", notes: "",
  aufbruch_ok: false, decke_ab: false, strecke_id: "", wildmark_id: "",
};

export default function WildkammerEingangDialog({ open, onClose, onSave, reviere, strecken = [], wildmarken = [] }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => { if (open) setForm(EMPTY); }, [open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Pre-fill from linked strecke
  const handleStreckeLink = (id) => {
    const s = strecken.find(x => x.id === id);
    if (s) {
      setForm(f => ({
        ...f, strecke_id: id,
        species: s.species || f.species,
        gender: s.gender || f.gender,
        age_class: s.age_class || f.age_class,
        revier_id: s.revier_id || f.revier_id,
        gewicht_aufgebrochen: s.weight_kg || f.gewicht_aufgebrochen,
      }));
    } else {
      set("strecke_id", id);
    }
  };

  const canSave = form.species && form.revier_id && form.eingang_datum;

  return (
    <Drawer open={open} onOpenChange={v => !v && onClose()}>
      <DrawerContent className="bg-[#2d2d2d] border-t border-[#3a3a3a] max-h-[92dvh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-gray-100 text-base">Wildkammer – Eingang erfassen</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 space-y-4 pb-2">

          {/* Link to Strecke */}
          {strecken.length > 0 && (
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Aus Strecke verknüpfen (optional)</Label>
              <Select value={form.strecke_id} onValueChange={handleStreckeLink}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                  <SelectValue placeholder="Strecke wählen…" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  <SelectItem value={null}>— Kein Bezug —</SelectItem>
                  {strecken.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.date} · {SPECIES_LABELS[s.species] || s.species} {s.age_class ? `· ${s.age_class}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Wildart *</Label>
              <Select value={form.species} onValueChange={v => set("species", v)}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                  <SelectValue placeholder="Wildart" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  {Object.entries(SPECIES_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Revier *</Label>
              <Select value={form.revier_id} onValueChange={v => set("revier_id", v)}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                  <SelectValue placeholder="Revier" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  {reviere.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Geschlecht</Label>
              <Select value={form.gender} onValueChange={v => set("gender", v)}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  {Object.entries(GENDER_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Wildmarke</Label>
              <Input 
                value={form.wildmark_id} 
                onChange={e => set("wildmark_id", e.target.value)}
                placeholder="Code scannen oder eingeben" 
                className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" 
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Altersklasse</Label>
              <Input value={form.age_class} onChange={e => set("age_class", e.target.value)}
                placeholder="z.B. Bock Kl. II" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Eingangsdatum *</Label>
              <Input type="date" value={form.eingang_datum} onChange={e => set("eingang_datum", e.target.value)}
                className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Eingangszeit</Label>
              <Input type="time" value={form.eingang_zeit} onChange={e => set("eingang_zeit", e.target.value)}
                className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Gewicht aufgebrochen (kg)</Label>
              <Input type="number" step="0.1" value={form.gewicht_aufgebrochen} onChange={e => set("gewicht_aufgebrochen", e.target.value)}
                placeholder="z.B. 18.5" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Kühltemperatur (°C)</Label>
              <Input type="number" step="0.5" value={form.kuehltemperatur} onChange={e => set("kuehltemperatur", e.target.value)}
                placeholder="z.B. 4" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.aufbruch_ok} onChange={e => set("aufbruch_ok", e.target.checked)}
                className="w-4 h-4 rounded accent-[#22c55e]" />
              <span className="text-sm text-gray-300">Aufbruch i.O.</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.decke_ab} onChange={e => set("decke_ab", e.target.checked)}
                className="w-4 h-4 rounded accent-[#22c55e]" />
              <span className="text-sm text-gray-300">Decke ab</span>
            </label>
          </div>

          <div>
            <Label className="text-gray-300 text-xs mb-1 block">Notizen</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Besonderheiten, Schussbild, Befund…" rows={2}
              className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 resize-none" />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1 border-[#3a3a3a]">Abbrechen</Button>
            <Button onClick={() => onSave(form)} disabled={!canSave}
              className="flex-1 bg-[#22c55e] text-black hover:bg-[#16a34a]">Eingang buchen</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}