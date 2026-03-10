import React, { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, X, Save } from "lucide-react";

export default function EtikettSettings({ settings, onChange, onSave, saving }) {
  const set = (key, value) => onChange({ ...settings, [key]: value });
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("logoUrl", file_url);
    setUploading(false);
  };

  return (
    <div className="space-y-6 text-sm text-gray-800">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Betrieb / Revier</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Betriebsname / Revier</Label>
            <Input
              value={settings.betriebsname}
              onChange={e => set("betriebsname", e.target.value)}
              placeholder="z.B. Jagdrevier Mustermann"
              className="border-gray-300 text-gray-900 bg-white"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Adresse (optional)</Label>
            <Input
              value={settings.adresse}
              onChange={e => set("adresse", e.target.value)}
              placeholder="z.B. Musterstraße 1, 12345 Musterort"
              className="border-gray-300 text-gray-900 bg-white"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Logo</Label>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            {settings.logoUrl ? (
              <div className="flex items-center gap-2">
                <img src={settings.logoUrl} alt="Logo" className="h-14 w-14 object-contain border border-gray-300 rounded p-1 bg-white" />
                <button onClick={() => set("logoUrl", "")} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-400 rounded text-gray-600 hover:border-gray-600 text-xs w-full justify-center"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Wird hochgeladen..." : "Logo hochladen"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Layout & Felder</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Schriftgröße</Label>
            <Select value={settings.schriftgroesse} onValueChange={v => set("schriftgroesse", v)}>
              <SelectTrigger className="border-gray-300 text-gray-900 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="klein">Klein</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="gross">Groß</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {[
            { key: "zeigeLagerlocation", label: "Lagerlocation anzeigen" },
            { key: "zeigeTemperatur", label: "Temperatur anzeigen" },
            { key: "zeigeBeschreibung", label: "Beschreibung anzeigen" },
            { key: "zeigeEinfrierungsDatum", label: "Einfrierungsdatum anzeigen" },
            { key: "zeigeDruckdatum", label: "Druckdatum anzeigen" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-gray-700">{label}</span>
              <Switch checked={settings[key]} onCheckedChange={v => set(key, v)} />
            </div>
          ))}
        </div>
      </div>

      <Button onClick={onSave} disabled={saving} className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Einstellungen speichern
      </Button>
    </div>
  );
}