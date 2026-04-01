import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";

const HUNT_TYPES = ["Reguläre Jagd 1.Juli-31.Oktober", "Entnahme nach Nutztierriss", "Entnahme auffälliger Wolf"];
const RESULTS = ["Kein Kontakt", "Gesichtet", "Erlegt", "Angeschossen"];
const SEXES = ["Männlich", "Weiblich", "Unbekannt"];

const EMPTY = {
  hunt_date: new Date().toISOString().split("T")[0],
  hunt_type: "",
  result: "Kein Kontakt",
  location_name: "",
  location_lat: "",
  location_lng: "",
  wolf_sex: "Unbekannt",
  wolf_age: "",
  weapon_used: "",
  distance_meters: "",
  authority_notified: false,
  notification_date: "",
  sample_taken: false,
  notes: "",
};

export default function WolfHuntForm({ tenantId, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const getGPS = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        set("location_lat", pos.coords.latitude);
        set("location_lng", pos.coords.longitude);
        setGpsLoading(false);
        toast.success("GPS-Position übernommen");
      },
      () => { setGpsLoading(false); toast.error("GPS nicht verfügbar"); }
    );
  };

  const handleSave = async () => {
    if (!form.hunt_type || !form.hunt_date) {
      toast.error("Bitte Jagdart und Datum angeben");
      return;
    }
    setSaving(true);
    await base44.entities.WolfHunt.create({
      ...form,
      tenant_id: tenantId,
      location_lat: form.location_lat ? parseFloat(form.location_lat) : null,
      location_lng: form.location_lng ? parseFloat(form.location_lng) : null,
      distance_meters: form.distance_meters ? parseFloat(form.distance_meters) : null,
    });
    toast.success("Jagddokumentation gespeichert");
    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#2a1800] border border-orange-800/50 rounded-xl p-3 text-sm text-orange-300">
        <p className="font-bold text-red-400 mb-1">⚠️ Meldepflicht beachten!</p>
        <p className="text-xs">Nach jedem Abschuss besteht <strong>sofortige Meldepflicht</strong> bei der Jagdbehörde! Genetikprobe entnehmen und einfrieren!</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Datum *</Label>
          <Input type="date" value={form.hunt_date} onChange={e => set("hunt_date", e.target.value)}
            className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Ergebnis</Label>
          <Select value={form.result} onValueChange={v => set("result", v)}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
              {RESULTS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-gray-300 text-xs mb-1 block">Jagdart *</Label>
        <Select value={form.hunt_type} onValueChange={v => set("hunt_type", v)}>
          <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
            <SelectValue placeholder="Jagdart wählen" />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
            {HUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-gray-300 text-xs mb-1 block">Ort</Label>
        <Input value={form.location_name} onChange={e => set("location_name", e.target.value)}
          placeholder="Ort der Maßnahme" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
      </div>

      <Button onClick={getGPS} disabled={gpsLoading} variant="outline"
        className="w-full border-[#2d5a27] text-green-400 hover:bg-[#1a2e1a]">
        {gpsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
        GPS-Position verwenden
      </Button>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Geschlecht</Label>
          <Select value={form.wolf_sex} onValueChange={v => set("wolf_sex", v)}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
              {SEXES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Alter (geschätzt)</Label>
          <Input value={form.wolf_age} onChange={e => set("wolf_age", e.target.value)}
            placeholder="z.B. adult, juvenil" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Waffe / Kaliber</Label>
          <Input value={form.weapon_used} onChange={e => set("weapon_used", e.target.value)}
            placeholder=".308 Win" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Schussdistanz (m)</Label>
          <Input type="number" value={form.distance_meters} onChange={e => set("distance_meters", e.target.value)}
            placeholder="50" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
      </div>

      <div>
        <Label className="text-gray-300 text-xs mb-1 block">Meldedatum Behörde</Label>
        <Input type="date" value={form.notification_date} onChange={e => set("notification_date", e.target.value)}
          className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
      </div>

      <div className="flex gap-4 flex-wrap">
        {[["authority_notified", "Behörde benachrichtigt"], ["sample_taken", "Genetikprobe entnommen"]].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)}
              className="w-4 h-4 rounded accent-green-500" />
            <span className="text-sm text-gray-300">{label}</span>
          </label>
        ))}
      </div>

      <div>
        <Label className="text-gray-300 text-xs mb-1 block">Notizen</Label>
        <Textarea value={form.notes} onChange={e => set("notes", e.target.value)}
          rows={3} placeholder="Weitere Angaben…"
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