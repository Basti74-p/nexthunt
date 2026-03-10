import React, { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, X } from "lucide-react";

export default function EtikettEditor({ settings, onChange }) {
  const set = (key, value) => onChange({ ...settings, [key]: value });

  return (
    <div className="space-y-5 text-sm text-gray-800">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 text-base">Betrieb / Revier</h3>
        <div className="space-y-2">
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
            <Label className="text-xs text-gray-600 mb-1 block">Logo-URL (optional)</Label>
            <Input
              value={settings.logoUrl}
              onChange={e => set("logoUrl", e.target.value)}
              placeholder="https://..."
              className="border-gray-300 text-gray-900 bg-white"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3 text-base">Freitext-Felder</h3>
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Empfänger</Label>
            <Input
              value={settings.empfaenger}
              onChange={e => set("empfaenger", e.target.value)}
              placeholder="z.B. Max Mustermann"
              className="border-gray-300 text-gray-900 bg-white"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Eigene Notiz</Label>
            <Input
              value={settings.eigeneNotiz}
              onChange={e => set("eigeneNotiz", e.target.value)}
              placeholder="z.B. Für Eigenverbrauch"
              className="border-gray-300 text-gray-900 bg-white"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3 text-base">Layout & Felder</h3>
        <div className="space-y-2">
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
              <Switch
                checked={settings[key]}
                onCheckedChange={v => set(key, v)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}