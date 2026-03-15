import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Camera, X, CheckCircle, AlertTriangle } from "lucide-react";
import MobileSelect from "@/components/ui/MobileSelect";

const PROTOKOLL_TYP = [
  { value: "kontrolle", label: "Routinekontrolle" },
  { value: "jahresinspektion", label: "Jahresinspektion" },
  { value: "schadensmeldung", label: "Schadensmeldung" },
  { value: "reparatur", label: "Reparaturbericht" },
];

const ZUSTAND_OPTIONS = [
  { value: "gut", label: "Gut – keine Mängel", color: "border-green-600 bg-green-900/20 text-green-300" },
  { value: "maessig", label: "Mäßig – leichte Mängel", color: "border-yellow-600 bg-yellow-900/20 text-yellow-300" },
  { value: "schlecht", label: "Schlecht – Reparatur nötig", color: "border-red-600 bg-red-900/20 text-red-300" },
  { value: "total", label: "Totalschaden", color: "border-red-800 bg-red-950/30 text-red-200" },
];

const SCHADENSART_OPTIONS = [
  { value: "vandalismus", label: "Vandalismus" },
  { value: "sturm", label: "Sturm" },
  { value: "schnee", label: "Schnee" },
  { value: "alterung", label: "Alterung" },
  { value: "wildschaden", label: "Wildschaden" },
  { value: "sonstiges", label: "Sonstiges" },
];

const SCHWERE_OPTIONS = [
  { value: "gering", label: "Gering" },
  { value: "mittel", label: "Mittel" },
  { value: "schwer", label: "Schwer" },
  { value: "total", label: "Totalschaden" },
];

const STATUS_OPTIONS = [
  { value: "offen", label: "Offen" },
  { value: "in_bearbeitung", label: "In Bearbeitung" },
  { value: "abgeschlossen", label: "Abgeschlossen" },
];

const SCHWERE_COLOR = {
  gering: "border-yellow-600 bg-yellow-900/20 text-yellow-300",
  mittel: "border-orange-600 bg-orange-900/20 text-orange-300",
  schwer: "border-red-600 bg-red-900/20 text-red-300",
  total: "border-red-800 bg-red-950/30 text-red-200",
};

const empty = () => ({
  titel: "",
  datum: new Date().toISOString().split("T")[0],
  protokoll_typ: "kontrolle",
  zustand_gesamt: "gut",
  kontrolleur: "",
  beschreibung: "",
  hat_schaden: false,
  schadensart: "sonstiges",
  schwere: "gering",
  massnahmen: "",
  status: "offen",
  kosten_geschaetzt: "",
  kosten_tatsaechlich: "",
  erledigt_am: "",
  erledigt_durch: "",
  notes: "",
  fotos: [],
});

export default function SchadensprotokollDialog({ isOpen, onClose, schaden, einrichtung, tenantId }) {
  const queryClient = useQueryClient();
  const isEdit = !!schaden;
  const fileInputRef = useRef();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState(empty());

  useEffect(() => {
    if (schaden) {
      setFormData({
        titel: schaden.titel || "",
        datum: schaden.datum || new Date().toISOString().split("T")[0],
        protokoll_typ: schaden.protokoll_typ || "kontrolle",
        zustand_gesamt: schaden.zustand_gesamt || "gut",
        kontrolleur: schaden.kontrolleur || "",
        beschreibung: schaden.beschreibung || "",
        hat_schaden: schaden.hat_schaden || false,
        schadensart: schaden.schadensart || "sonstiges",
        schwere: schaden.schwere || "gering",
        massnahmen: schaden.massnahmen || "",
        status: schaden.status || "offen",
        kosten_geschaetzt: schaden.kosten_geschaetzt ?? "",
        kosten_tatsaechlich: schaden.kosten_tatsaechlich ?? "",
        erledigt_am: schaden.erledigt_am || "",
        erledigt_durch: schaden.erledigt_durch || "",
        notes: schaden.notes || "",
        fotos: schaden.fotos || [],
      });
    } else {
      setFormData(empty());
    }
  }, [schaden, isOpen]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? base44.entities.Schadensprotokoll.update(schaden.id, data)
        : base44.entities.Schadensprotokoll.create({
            ...data,
            tenant_id: tenantId,
            revier_id: einrichtung.revier_id,
            einrichtung_id: einrichtung.id,
            einrichtung_name: einrichtung.name,
          }),
    onMutate: (data) => {
      if (isEdit) {
        queryClient.setQueryData(["schadensprotokoll", einrichtung?.id], old => (old || []).map(s =>
          s.id === schaden.id ? { ...s, ...data } : s
        ));
      } else {
        queryClient.setQueryData(["schadensprotokoll", einrichtung?.id], old => [
          ...(old || []),
          {
            ...data,
            id: "temp-" + Date.now(),
            tenant_id: tenantId,
            revier_id: einrichtung.revier_id,
            einrichtung_id: einrichtung.id,
            einrichtung_name: einrichtung.name,
          }
        ]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["schadensprotokoll", einrichtung?.id]);
      onClose();
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData((p) => ({ ...p, fotos: [...(p.fotos || []), file_url] }));
    setUploadingPhoto(false);
  };

  const removePhoto = (idx) => {
    setFormData((p) => ({ ...p, fotos: p.fotos.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.titel || !formData.datum) { alert("Titel und Datum erforderlich"); return; }
    mutation.mutate({
      ...formData,
      kosten_geschaetzt: formData.kosten_geschaetzt !== "" ? parseFloat(formData.kosten_geschaetzt) : undefined,
      kosten_tatsaechlich: formData.kosten_tatsaechlich !== "" ? parseFloat(formData.kosten_tatsaechlich) : undefined,
    });
  };

  const set = (k, v) => setFormData((p) => ({ ...p, [k]: v }));
  const zustandInfo = ZUSTAND_OPTIONS.find((z) => z.value === formData.zustand_gesamt);

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="bg-[#2d2d2d] border-t border-[#3a3a3a] max-h-[92dvh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-gray-100 text-base">
            {isEdit ? "Protokoll bearbeiten" : "Neues Protokoll"}
          </DrawerTitle>
          {einrichtung && (
            <p className="text-xs text-gray-400 mt-0.5">{einrichtung.name}</p>
          )}
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="overflow-y-auto px-4 space-y-5 pb-2">

          {/* Protokolltyp Auswahl */}
          <div className="grid grid-cols-2 gap-2">
            {PROTOKOLL_TYP.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => set("protokoll_typ", t.value)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all text-left ${
                  formData.protokoll_typ === t.value
                    ? "border-[#22c55e] bg-green-900/20 text-green-300"
                    : "border-[#3a3a3a] text-gray-400 hover:border-gray-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Grunddaten */}
          <section>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Grunddaten</p>
            <div className="space-y-2">
              <Input
                placeholder="Titel / Betreff *"
                value={formData.titel}
                onChange={(e) => set("titel", e.target.value)}
                className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Datum *</label>
                  <Input type="date" value={formData.datum} onChange={(e) => set("datum", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Kontrolleur / Ersteller</label>
                  <Input placeholder="Name" value={formData.kontrolleur} onChange={(e) => set("kontrolleur", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
                </div>
              </div>
            </div>
          </section>

          {/* Gesamtzustand */}
          <section>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Gesamtzustand der Einrichtung</p>
            <div className="grid grid-cols-2 gap-2">
              {ZUSTAND_OPTIONS.map((z) => (
                <button
                  key={z.value}
                  type="button"
                  onClick={() => set("zustand_gesamt", z.value)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 ${
                    formData.zustand_gesamt === z.value ? z.color : "border-[#3a3a3a] text-gray-500 hover:border-gray-500"
                  }`}
                >
                  {formData.zustand_gesamt === z.value
                    ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    : <div className="w-3.5 h-3.5 rounded-full border border-current shrink-0" />
                  }
                  {z.label}
                </button>
              ))}
            </div>
          </section>

          {/* Feststellungen / Beschreibung */}
          <section>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Feststellungen</p>
            <Textarea
              placeholder="Was wurde festgestellt? Zustand, Auffälligkeiten, durchgeführte Arbeiten..."
              value={formData.beschreibung}
              onChange={(e) => set("beschreibung", e.target.value)}
              className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 resize-none h-24"
            />
          </section>

          {/* Schaden ja/nein Toggle */}
          <section>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set("hat_schaden", !formData.hat_schaden)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  formData.hat_schaden
                    ? "border-red-600 bg-red-900/20 text-red-300"
                    : "border-[#3a3a3a] text-gray-400 hover:border-gray-500"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                Schaden vorhanden
              </button>
              {!formData.hat_schaden && (
                <span className="text-xs text-gray-500">Kein Schaden festgestellt</span>
              )}
            </div>

            {formData.hat_schaden && (
              <div className="mt-3 space-y-2 p-3 bg-red-950/10 border border-red-900/30 rounded-xl">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Schadensart</label>
                    <MobileSelect value={formData.schadensart} onValueChange={(v) => set("schadensart", v)} label="Schadensart" items={SCHADENSART_OPTIONS} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Schwere</label>
                    <MobileSelect value={formData.schwere} onValueChange={(v) => set("schwere", v)} label="Schwere" items={SCHWERE_OPTIONS} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Geschätzte Kosten (€)</label>
                    <Input type="number" step="0.01" placeholder="0,00" value={formData.kosten_geschaetzt} onChange={(e) => set("kosten_geschaetzt", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Tatsächliche Kosten (€)</label>
                    <Input type="number" step="0.01" placeholder="0,00" value={formData.kosten_tatsaechlich} onChange={(e) => set("kosten_tatsaechlich", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Maßnahmen */}
          <section>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Maßnahmen</p>
            <Textarea
              placeholder="Eingeleitete oder geplante Maßnahmen..."
              value={formData.massnahmen}
              onChange={(e) => set("massnahmen", e.target.value)}
              className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 resize-none h-16"
            />
          </section>

          {/* Status & Erledigung */}
          <section>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Bearbeitungsstatus</p>
            <div className="space-y-2">
              <MobileSelect value={formData.status} onValueChange={(v) => set("status", v)} label="Bearbeitungsstatus" items={STATUS_OPTIONS} />
              {formData.status === "abgeschlossen" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Erledigt am</label>
                    <Input type="date" value={formData.erledigt_am} onChange={(e) => set("erledigt_am", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Erledigt durch</label>
                    <Input placeholder="Name / Firma" value={formData.erledigt_durch} onChange={(e) => set("erledigt_durch", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Fotos */}
          <section>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Fotos</p>
            <div className="flex flex-wrap gap-2">
              {(formData.fotos || []).map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#3a3a3a]">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-0.5 right-0.5 bg-black/70 rounded-full p-0.5 text-white hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-[#3a3a3a] flex flex-col items-center justify-center text-gray-500 hover:border-[#22c55e] hover:text-[#22c55e] transition-colors"
              >
                {uploadingPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                <span className="text-[10px] mt-1">{uploadingPhoto ? "Upload..." : "Foto"}</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
          </section>

          {/* Interne Notizen */}
          <section>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Interne Notizen</p>
            <Textarea
              placeholder="Weitere Anmerkungen..."
              value={formData.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 resize-none h-14"
            />
          </section>

          </div>
          <div className="px-4 pt-2 border-t border-[#3a3a3a] flex gap-2" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 border-[#3a3a3a]">Abbrechen</Button>
            <Button type="submit" disabled={mutation.isPending} className="flex-1 bg-[#22c55e] text-black hover:bg-[#16a34a]">
              {mutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {isEdit ? "Aktualisieren" : "Protokoll speichern"}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}