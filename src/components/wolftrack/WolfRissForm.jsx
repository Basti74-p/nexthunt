import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Upload, Loader2, MapPin } from "lucide-react";

const SPECIES = ["Schaf", "Ziege", "Rind", "Pferd", "Wildschwein", "Reh", "Hirsch", "Sonstiges"];
const STATUSES = ["Neu", "Gutachter angefordert", "Bestätigt", "Entschädigung beantragt", "Abgeschlossen"];

const EMPTY = {
  incident_date: new Date().toISOString().split("T")[0],
  animal_species: "",
  animal_count_dead: 1,
  animal_count_injured: 0,
  location_name: "",
  location_lat: "",
  location_lng: "",
  owner_name: "",
  owner_contact: "",
  wolf_confirmed: false,
  gutachter_notified: false,
  gutachter_name: "",
  compensation_applied: false,
  compensation_amount: "",
  notes: "",
  status: "Neu",
};

export default function WolfRissForm({ tenantId, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    if (!form.animal_species || !form.incident_date) {
      toast.error("Bitte Tierart und Datum angeben");
      return;
    }
    setSaving(true);
    await base44.entities.WolfRiss.create({
      ...form,
      tenant_id: tenantId,
      location_lat: form.location_lat ? parseFloat(form.location_lat) : null,
      location_lng: form.location_lng ? parseFloat(form.location_lng) : null,
      animal_count_dead: parseInt(form.animal_count_dead) || 0,
      animal_count_injured: parseInt(form.animal_count_injured) || 0,
      compensation_amount: form.compensation_amount ? parseFloat(form.compensation_amount) : null,
      photos,
    });
    toast.success("Rissprotokoll gespeichert");
    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#2a1010] border border-red-800/50 rounded-xl p-3 text-sm text-red-300">
        <p className="font-semibold mb-1">🚨 Nach einem Riss:</p>
        <ol className="list-decimal pl-4 space-y-0.5 text-xs">
          <li>Tatort sichern – keine Spuren verwischen</li>
          <li>Rissgutachter sofort anrufen</li>
          <li>Fotos machen (Kadaver, Spuren, Zaun)</li>
          <li>Hier dokumentieren</li>
        </ol>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Datum *</Label>
          <Input type="date" value={form.incident_date} onChange={e => set("incident_date", e.target.value)}
            className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Tierart *</Label>
          <Select value={form.animal_species} onValueChange={v => set("animal_species", v)}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
              <SelectValue placeholder="Tierart" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
              {SPECIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Anzahl getötet</Label>
          <Input type="number" min="0" value={form.animal_count_dead} onChange={e => set("animal_count_dead", e.target.value)}
            className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Anzahl verletzt</Label>
          <Input type="number" min="0" value={form.animal_count_injured} onChange={e => set("animal_count_injured", e.target.value)}
            className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
      </div>

      <div>
        <Label className="text-gray-300 text-xs mb-1 block">Ort</Label>
        <Input value={form.location_name} onChange={e => set("location_name", e.target.value)}
          placeholder="Ort des Risses" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
      </div>

      <Button onClick={getGPS} disabled={gpsLoading} variant="outline"
        className="w-full border-[#2d5a27] text-green-400 hover:bg-[#1a2e1a]">
        {gpsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
        GPS-Position verwenden
      </Button>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Tierhalter Name</Label>
          <Input value={form.owner_name} onChange={e => set("owner_name", e.target.value)}
            placeholder="Max Mustermann" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Kontakt Tierhalter</Label>
          <Input value={form.owner_contact} onChange={e => set("owner_contact", e.target.value)}
            placeholder="Tel. / E-Mail" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Gutachter</Label>
          <Input value={form.gutachter_name} onChange={e => set("gutachter_name", e.target.value)}
            placeholder="Name des Gutachters" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
        <div>
          <Label className="text-gray-300 text-xs mb-1 block">Entschädigung (€)</Label>
          <Input type="number" value={form.compensation_amount} onChange={e => set("compensation_amount", e.target.value)}
            placeholder="0,00" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {[["wolf_confirmed", "Wolf bestätigt"], ["gutachter_notified", "Gutachter informiert"], ["compensation_applied", "Entschädigung beantragt"]].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)}
              className="w-4 h-4 rounded accent-green-500" />
            <span className="text-sm text-gray-300">{label}</span>
          </label>
        ))}
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
        <Label className="text-gray-300 text-xs mb-1 block">Notizen</Label>
        <Textarea value={form.notes} onChange={e => set("notes", e.target.value)}
          rows={3} placeholder="Weitere Angaben zum Riss…"
          className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 resize-none" />
      </div>

      <div>
        <Label className="text-gray-300 text-xs mb-2 block">Fotos</Label>
        <label className="flex items-center gap-2 cursor-pointer w-full border border-dashed border-[#3a3a3a] rounded-xl p-3 hover:border-red-700 transition-colors">
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
          className="flex-1 bg-red-800 hover:bg-red-900 text-white">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Rissprotokoll speichern
        </Button>
      </div>
    </div>
  );
}