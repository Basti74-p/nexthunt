import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function EtikettEditor({ settings, onChange }) {
  const set = (key, value) => onChange({ ...settings, [key]: value });

  return (
    <div className="space-y-3 text-sm text-gray-800">
      <p className="text-xs text-gray-500">Angaben nur für diesen Druckvorgang</p>
      <div>
        <Label className="text-xs text-gray-600 mb-1 block">Empfänger</Label>
        <Input
          value={settings.empfaenger || ""}
          onChange={e => set("empfaenger", e.target.value)}
          placeholder="z.B. Max Mustermann"
          className="border-gray-300 text-gray-900 bg-white"
        />
      </div>
      <div>
        <Label className="text-xs text-gray-600 mb-1 block">Notiz</Label>
        <Input
          value={settings.eigeneNotiz || ""}
          onChange={e => set("eigeneNotiz", e.target.value)}
          placeholder="z.B. Für Eigenverbrauch"
          className="border-gray-300 text-gray-900 bg-white"
        />
      </div>
    </div>
  );
}