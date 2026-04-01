import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const BUNDESLAENDER = ["Baden-Württemberg","Bayern","Berlin","Brandenburg","Bremen","Hamburg","Hessen","Mecklenburg-Vorpommern","Niedersachsen","Nordrhein-Westfalen","Rheinland-Pfalz","Saarland","Sachsen","Sachsen-Anhalt","Schleswig-Holstein","Thüringen"];
const STATUSES = ["Aktives Rudel", "Paar", "Einzeltier", "Inaktiv"];

const EMPTY = {
  territory_name: "",
  federal_state: "",
  wolf_count_estimated: "",
  last_confirmed: "",
  territory_status: "Aktives Rudel",
  notes: "",
  source: "DBBW – www.dbb-wolf.de",
};

export default function WolfTerritoryForm({ onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.territory_name || !form.federal_state) {
      toast.error("Bitte Name und Bundesland angeben");
      return;
    }
    setSaving(true);
    await base44.entities.WolfTerritory.create({
      ...form,
      wolf_count_estimated: form.wolf_count_estimated ? parseInt(form.wolf_count_estimated) : null,
    });
    toast.success("Territorium gespeichert");
    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-gray-300 text-xs mb-1 block">Name des Rudels / Territoriums *</Label>
          <Input value={form.territory_name} onChange={e => set("territory_name", e.target.value)}
            placeholder="z.B. Rudel Lausitz Süd" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Bundesland *</Label>
          <Select value={form.federal_state} onValueChange={v => set("federal_state", v)}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
              <SelectValue placeholder="Bundesland" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
              {BUNDESLAENDER.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Status</Label>
          <Select value={form.territory_status} onValueChange={v => set("territory_status", v)}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Geschätzte Wolfszahl</Label>
          <Input type="number" min="1" value={form.wolf_count_estimated} onChange={e => set("wolf_count_estimated", e.target.value)}
            placeholder="z.B. 6" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Zuletzt bestätigt</Label>
          <Input type="date" value={form.last_confirmed} onChange={e => set("last_confirmed", e.target.value)}
            className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
      </div>

      <div>
        <Label className="text-gray-300 text-xs mb-1 block">Quelle</Label>
        <Input value={form.source} onChange={e => set("source", e.target.value)}
          className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
      </div>

      <div>
        <Label className="text-gray-300 text-xs mb-1 block">Notizen</Label>
        <Textarea value={form.notes} onChange={e => set("notes", e.target.value)}
          rows={3} placeholder="Weitere Informationen zum Territorium…"
          className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 resize-none" />
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1 border-[#3a3a3a]">Abbrechen</Button>
        <Button onClick={handleSave} disabled={saving}
          className="flex-1 bg-[#2d5a27] hover:bg-[#1e3d1b] text-white">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Speichern
        </Button>
      </div>
    </div>
  );
}