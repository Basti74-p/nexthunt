import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AuthorityModal({ sighting, revierName, onClose, onMarked }) {
  const [authorityName, setAuthorityName] = useState(sighting?.authority_name || "");
  const [saving, setSaving] = useState(false);

  if (!sighting) return null;

  const date = sighting.sighting_date
    ? new Date(sighting.sighting_date).toLocaleString("de-DE")
    : "–";

  const emailBody = encodeURIComponent(
    `Sehr geehrte Damen und Herren,\n\nmit diesem Schreiben melde ich eine Wolfssichtung:\n\n` +
    `Datum/Uhrzeit: ${date}\n` +
    `Ort: ${sighting.location_name || "–"}\n` +
    `GPS: ${sighting.location_lat ?? "–"} / ${sighting.location_lng ?? "–"}\n` +
    `SCALP-Kategorie: ${sighting.scalp_category || "–"}\n` +
    `Sichtungstyp: ${sighting.sighting_type || "–"}\n` +
    `Anzahl Wölfe: ${sighting.wolf_count ?? "–"}\n` +
    `Revier: ${revierName || "–"}\n\n` +
    `Beschreibung:\n${sighting.description || "–"}\n\n` +
    `Mit freundlichen Grüßen`
  );

  const mailtoLink = `mailto:?subject=${encodeURIComponent("Wolfssichtungsmeldung – " + date)}&body=${emailBody}`;

  const handleMarkReported = async () => {
    setSaving(true);
    await base44.entities.WolfSighting.update(sighting.id, {
      reported_to_authority: true,
      authority_name: authorityName,
      report_date: new Date().toISOString().split("T")[0],
    });
    toast.success("Als gemeldet markiert");
    setSaving(false);
    onMarked();
    onClose();
  };

  return (
    <Dialog open={!!sighting} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[#2d2d2d] border-[#3a3a3a] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-gray-100">📋 Behördenmeldung vorbereiten</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-[#1a2e1a] border border-[#2d5a27] rounded-xl p-4 text-sm text-gray-300 space-y-1">
            <div><span className="text-gray-500">Datum:</span> {date}</div>
            <div><span className="text-gray-500">Ort:</span> {sighting.location_name || "–"}</div>
            <div><span className="text-gray-500">GPS:</span> {sighting.location_lat ?? "–"} / {sighting.location_lng ?? "–"}</div>
            <div><span className="text-gray-500">SCALP:</span> {sighting.scalp_category || "–"}</div>
            <div><span className="text-gray-500">Typ:</span> {sighting.sighting_type || "–"}</div>
          </div>
          <div>
            <Label className="text-gray-300 text-xs mb-1 block">Behörde / Ansprechpartner</Label>
            <Input
              value={authorityName}
              onChange={e => setAuthorityName(e.target.value)}
              placeholder="z.B. Untere Jagdbehörde Landkreis XY"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 border-[#3a3a3a]">
              Abbrechen
            </Button>
            <a href={mailtoLink} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full bg-[#2d5a27] hover:bg-[#1e3d1b] text-white">
                📧 E-Mail öffnen
              </Button>
            </a>
            <Button
              onClick={handleMarkReported}
              disabled={saving}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white"
            >
              ✓ Als gemeldet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}