import React, { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, X, Save } from "lucide-react";

export default function RechnungSettings({ settings, onChange, onSave, saving }) {
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
    <div className="space-y-5 text-sm text-gray-800">

      {/* Betrieb */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Absender / Betrieb</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Betriebsname</Label>
            <Input value={settings.betriebsname || ""} onChange={e => set("betriebsname", e.target.value)}
              placeholder="z.B. Jagdrevier Mustermann" className="border-gray-300 text-gray-900 bg-white" />
          </div>
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Adresse</Label>
            <Textarea value={settings.adresse || ""} onChange={e => set("adresse", e.target.value)}
              placeholder={"Musterstraße 1\n12345 Musterort"} rows={2}
              className="border-gray-300 text-gray-900 bg-white resize-none" />
          </div>
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Telefon / E-Mail (optional)</Label>
            <Input value={settings.rechnung_kontakt || ""} onChange={e => set("rechnung_kontakt", e.target.value)}
              placeholder="Tel: 0123 456789 · info@jagd.de" className="border-gray-300 text-gray-900 bg-white" />
          </div>
        </div>
      </div>

      {/* Logo */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Logo</h3>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        {settings.logoUrl ? (
          <div className="flex items-center gap-3">
            <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain border border-gray-300 rounded p-1 bg-white" />
            <button onClick={() => set("logoUrl", "")} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs">
              <X className="w-4 h-4" /> Entfernen
            </button>
          </div>
        ) : (
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 py-3 border border-dashed border-gray-400 rounded text-gray-600 hover:border-gray-600 text-xs w-full justify-center">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Wird hochgeladen..." : "Logo hochladen"}
          </button>
        )}
      </div>

      {/* Schrift */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Schrift & Layout</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Schriftgröße</Label>
            <Select value={settings.rechnung_schriftgroesse || "normal"} onValueChange={v => set("rechnung_schriftgroesse", v)}>
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
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Primärfarbe (Akzent)</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={settings.rechnung_farbe || "#1a1a1a"}
                onChange={e => set("rechnung_farbe", e.target.value)}
                className="h-9 w-16 rounded border border-gray-300 cursor-pointer p-0.5 bg-white" />
              <span className="text-xs text-gray-500">{settings.rechnung_farbe || "#1a1a1a"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Steuer & Bank */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Steuer & Bankdaten</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Steuernummer / USt-IdNr.</Label>
            <Input value={settings.rechnung_steuernummer || ""} onChange={e => set("rechnung_steuernummer", e.target.value)}
              placeholder="DE123456789" className="border-gray-300 text-gray-900 bg-white" />
          </div>
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Bankverbindung</Label>
            <Textarea value={settings.rechnung_bankverbindung || ""} onChange={e => set("rechnung_bankverbindung", e.target.value)}
              placeholder={"IBAN: DE00 0000 0000 0000 0000 00\nBIC: XXXXXXXX\nBank: Musterbank"} rows={3}
              className="border-gray-300 text-gray-900 bg-white resize-none" />
          </div>
        </div>
      </div>

      {/* Fußzeile */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Fußzeile</h3>
        <Textarea value={settings.rechnung_fusszeile || ""} onChange={e => set("rechnung_fusszeile", e.target.value)}
          placeholder="z.B. Zahlbar innerhalb von 14 Tagen ohne Abzug." rows={2}
          className="border-gray-300 text-gray-900 bg-white resize-none" />
      </div>

      <Button onClick={onSave} disabled={saving} className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Speichern
      </Button>
    </div>
  );
}