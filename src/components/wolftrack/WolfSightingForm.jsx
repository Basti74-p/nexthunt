import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { MapPin, Loader2, Upload } from "lucide-react";

const SIGHTING_TYPES = ["Lebendsichtung", "Totfund", "Spur", "Riss", "Kot", "Kamerafalle", "Sonstiges"];
const SCALP_CATS = ["C1 Eindeutiger Nachweis", "C2 Bestätigter Hinweis", "C3a Wahrscheinlich", "C3c Unwahrscheinlich"];
const STATUSES = ["Neu", "In Bearbeitung", "Bestätigt", "Abgeschlossen"];

const EMPTY = {
  sighting_date: new Date().toISOString().slice(0, 16),
  sighting_type: "",
  scalp_category: "",
  wolf_count: 1,
  location_name: "",
  location_lat: "",
  location_lng: "",
  description: "",
  status: "Neu",
};

export default function WolfSightingForm({ tenantId, revierOptions, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [photos, setPhotos] = useState([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    setPhotos(prev => [...prev, ...urls]);
    setUploading(false);
    toast.success(`${files.length} Foto(s) hochgeladen`);
  };

  const handleSave = async () => {
    if (!form.sighting_type || !form.sighting_date) {
      toast.error("Bitte Typ und Datum angeben");
      return;
    }
    setSaving(true);
    await base44.entities.WolfSighting.create({
      ...form,
      tenant_id: tenantId,
      location_lat: form.location_lat ? parseFloat(form.location_lat) : null,
      location_lng: form.location_lng ? parseFloat(form.location_lng) : null,
      wolf_count: parseInt(form.wolf_count) || 1,
      photos,
    });
    toast.success("Sichtung gespeichert");
    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Datum & Uhrzeit *</Label>
          <Input type="datetime-local" value={form.sighting_date} onChange={e => set("sighting_date", e.target.value)}
            className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Sichtungstyp *</Label>
          <Select value={form.sighting_type} onValueChange={v => set("sighting_type", v)}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
              <SelectValue placeholder="Typ wählen" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
              {SIGHTING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">SCALP-Kategorie</Label>
          <Select value={form.scalp_category} onValueChange={v => set("scalp_category", v)}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
              {SCALP_CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Anzahl Wölfe</Label>
          <Input type="number" min="1" value={form.wolf_count} onChange={e => set("wolf_count", e.target.value)}
            className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
      </div>

      <div>
        <Label className="text-gray-300 text-xs mb-1 block">Ortsbezeichnung</Label>
        <Input value={form.location_name} onChange={e => set("location_name", e.target.value)}
          placeholder="z.B. Waldgebiet Hintertann, Abt. 12"
          className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Breitengrad</Label>
          <Input value={form.location_lat} onChange={e => set("location_lat", e.target.value)}
            placeholder="52.1234" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Längengrad</Label>
          <Input value={form.location_lng} onChange={e => set("location_lng", e.target.value)}
            placeholder="13.5678" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
      </div>

      <Button onClick={getGPS} disabled={gpsLoading} variant="outline"
        className="w-full border-[#2d5a27] text-green-400 hover:bg-[#1a2e1a]">
        {gpsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
        Aktuelle Position verwenden
      </Button>

      <div>
        <Label className="text-gray-300 text-xs mb-1 block">Beschreibung</Label>
        <Textarea value={form.description} onChange={e => set("description", e.target.value)}
          rows={3} placeholder="Beschreibung der Sichtung…"
          className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 resize-none" />
      </div>

      <div>
        <Label className="text-gray-300 text-xs mb-1 block">Status</Label>
        <Select value={form.status} onValueChange={v => set("status", v)}>
          <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-gray-300 text-xs mb-2 block">Fotos</Label>
        <label className="flex items-center gap-2 cursor-pointer w-full border border-dashed border-[#3a3a3a] rounded-xl p-3 hover:border-[#2d5a27] transition-colors">
          <Upload className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">{uploading ? "Wird hochgeladen…" : "Fotos auswählen"}</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} disabled={uploading} />
        </label>
        {photos.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {photos.map((url, i) => (
              <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-[#3a3a3a]" />
            ))}
          </div>
        )}
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