import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function MeldepflichtModal({ hunt, contacts = [], onClose, onCreateSample }) {
  const [step, setStep] = useState(1);
  const authority = contacts.find(c => ["Untere Jagdbehörde", "Obere Jagdbehörde", "Wolfsbeauftragter"].includes(c.org_type));

  if (!hunt) return null;

  const steps = [
    {
      icon: "📞", title: "1. Behörde sofort anrufen",
      content: authority ? (
        <div className="p-3 rounded-lg mt-2" style={{ background: "#1a1a2e", border: "1px solid #3b4a8b" }}>
          <div className="font-bold text-blue-300">{authority.org_name}</div>
          {authority.contact_person && <div className="text-sm text-gray-300">{authority.contact_person}</div>}
          {authority.phone && (
            <a href={`tel:${authority.phone}`} className="flex items-center gap-2 mt-2 text-blue-400 font-bold text-lg">
              📞 {authority.phone}
            </a>
          )}
          {authority.email && <div className="text-xs text-gray-400 mt-1">{authority.email}</div>}
        </div>
      ) : (
        <div className="p-3 rounded mt-2 text-sm text-yellow-300" style={{ background: "#2a2a1a" }}>
          ⚠️ Kein Behördenkontakt hinterlegt. Bitte unter WolfTrack → Kontakte ergänzen.
        </div>
      )
    },
    {
      icon: "🧪", title: "2. Genetikprobe entnehmen",
      content: (
        <div className="space-y-2 mt-2">
          <p className="text-sm text-gray-300">Sofort nach dem Erlegen Gewebeprobe und Blutprobe entnehmen.</p>
          <ul className="text-xs text-gray-400 space-y-1 list-disc ml-4">
            <li>Muskelgewebe (erbsgroß) aus Innenschenkel</li>
            <li>Blut aus Herzkammer oder Hauptschlagader</li>
            <li>Einweghandschuhe tragen</li>
            <li>In Ethanol 96% oder sofort einfrieren</li>
          </ul>
          <Button onClick={() => { onCreateSample?.(); onClose(); }} className="w-full mt-2">
            🧪 Probe jetzt erfassen
          </Button>
        </div>
      )
    },
    {
      icon: "🚫", title: "3. Wolf NICHT bewegen",
      content: (
        <div className="p-3 rounded mt-2 text-sm text-red-300" style={{ background: "#2a1a1a", border: "1px solid #8B0000" }}>
          <strong>WICHTIG:</strong> Den erlegten Wolf nicht von der Stelle bewegen bis die Behörde eintrifft. Den Fundort sichern.
        </div>
      )
    },
    {
      icon: "📸", title: "4. Fotos von allen Seiten",
      content: (
        <div className="mt-2 text-sm text-gray-300 space-y-1">
          <p>Fotos machen von:</p>
          <ul className="list-disc ml-4 text-xs text-gray-400 space-y-0.5">
            <li>Gesamtansicht von oben</li>
            <li>Kopf (beide Seiten)</li>
            <li>Pfoten mit Krallen</li>
            <li>Körpermaße (mit Maßband)</li>
            <li>Fundort mit GPS-Markierung</li>
          </ul>
        </div>
      )
    },
    {
      icon: "📝", title: "5. Schriftliche Meldung (24h)",
      content: (
        <div className="mt-2 text-sm space-y-2">
          <p className="text-gray-300">Innerhalb von <strong className="text-yellow-400">24 Stunden</strong> schriftlich melden an:</p>
          <div className="text-xs text-gray-400 space-y-0.5">
            <div>• Untere Jagdbehörde</div>
            <div>• Landesbehörde für Naturschutz</div>
            <div>• DBBW (dbbw@bfn.de)</div>
          </div>
          {authority?.email && (
            <a href={`mailto:${authority.email}?subject=Wolfserleger%20Meldung&body=Datum%3A%20${hunt.hunt_date}%0AOrt%3A%20${hunt.location_name || ""}`}
              className="block w-full text-center py-2 rounded font-medium text-sm"
              style={{ background: "#1a1a2e", border: "1px solid #3b4a8b", color: "#60a5fa" }}>
              📧 E-Mail an {authority.org_name}
            </a>
          )}
        </div>
      )
    }
  ];

  return (
    <Dialog open={!!hunt} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: "#1a0a0a", border: "2px solid #ef4444" }}>
        <DialogHeader>
          <DialogTitle className="text-red-400 text-lg">⚠️ MELDEPFLICHT – Wolf erlegt</DialogTitle>
        </DialogHeader>
        <div className="p-3 rounded mb-3" style={{ background: "#2a1a1a", border: "1px solid #8B0000" }}>
          <div className="text-sm text-red-300 font-bold">Das Erlegen eines Wolfes ist meldepflichtig!</div>
          <div className="text-xs text-gray-400 mt-0.5">Bitte folgende Schritte in dieser Reihenfolge ausführen:</div>
        </div>

        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ background: "#2a2a2a", border: `1px solid ${step === i + 1 ? "#ef4444" : "#3a3a3a"}` }}>
              <button className="flex items-center gap-2 w-full text-left" onClick={() => setStep(step === i + 1 ? 0 : i + 1)}>
                <span className="text-xl">{s.icon}</span>
                <span className="font-bold text-white text-sm">{s.title}</span>
                <span className="ml-auto text-gray-400">{step === i + 1 ? "▲" : "▼"}</span>
              </button>
              {step === i + 1 && s.content}
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={onClose} className="w-full mt-2">Schließen</Button>
      </DialogContent>
    </Dialog>
  );
}