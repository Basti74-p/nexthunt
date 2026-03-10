import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Camera, X, Upload } from "lucide-react";

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
  { value: "erfasst", label: "Erfasst" },
  { value: "in_reparatur", label: "In Reparatur" },
  { value: "behoben", label: "Behoben" },
];

const SCHWERE_COLOR = {
  gering: "border-yellow-600 bg-yellow-900/20 text-yellow-300",
  mittel: "border-orange-600 bg-orange-900/20 text-orange-300",
  schwer: "border-red-600 bg-red-900/20 text-red-300",
  total: "border-red-800 bg-red-950/30 text-red-200",
};

export default function SchadensprotokollDialog({ isOpen, onClose, schaden, einrichtung, tenantId }) {
  const queryClient = useQueryClient();
  const isEdit = !!schaden;
  const fileInputRef = useRef();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const empty = {
    titel: "",
    datum: new Date().toISOString().split("T")[0],
    schadensart: "sonstiges",
    schwere: "gering",
    status: "erfasst",
    beschreibung: "",
    kosten_geschaetzt: "",
    kosten_tatsaechlich: "",
    behoben_am: "",
    behoben_durch: "",
    notes: "",
    fotos: [],
  };

  const [formData, setFormData] = useState(empty);

  useEffect(() => {
    if (schaden) {
      setFormData({
        titel: schaden.titel || "",
        datum: schaden.datum || new Date().toISOString().split("T")[0],
        schadensart: schaden.schadensart || "sonstiges",
        schwere: schaden.schwere || "gering",
        status: schaden.status || "erfasst",
        beschreibung: schaden.beschreibung || "",
        kosten_geschaetzt: schaden.kosten_geschaetzt ?? "",
        kosten_tatsaechlich: schaden.kosten_tatsaechlich ?? "",
        behoben_am: schaden.behoben_am || "",
        behoben_durch: schaden.behoben_durch || "",
        notes: schaden.notes || "",
        fotos: schaden.fotos || [],
      });
    } else {
      setFormData(empty);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#2d2d2d] border-[#3a3a3a] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-100 text-base">
            {isEdit ? "Schadensprotokoll bearbeiten" : "Schadensprotokoll erfassen"}
          </DialogTitle>
          {einrichtung && (
            <p className="text-xs text-gray-400 mt-0.5">
              {einrichtung.name} · {einrichtung.type}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Grunddaten */}
          <section>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Grunddaten</p>
            <div className="space-y-2">
              <Input
                placeholder="Titel des Schadens *"
                value={formData.titel}
                onChange={(e) => set("titel", e.target.value)}
                className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Schadensdatum *</label>
                  <Input type="date" value={formData.datum} onChange={(e) => set("datum", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Status</label>
                  <Select value={formData.status} onValueChange={(v) => set("status", v)}>
                    <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                      {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          {/* Schadensklassifikation */}
          <section>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Klassifikation</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Schadensart</label>
                <Select value={formData.schadensart} onValueChange={(v) => set("schadensart", v)}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    {SCHADENSART_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Schwere</label>
                <Select value={formData.schwere} onValueChange={(v) => set("schwere", v)}>
                  <SelectTrigger className={`border text-sm font-medium ${SCHWERE_COLOR[formData.schwere]}`}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    {SCHWERE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Beschreibung */}
          <section>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Beschreibung</p>
            <Textarea
              placeholder="Detaillierte Beschreibung des Schadens..."
              value={formData.beschreibung}
              onChange={(e) => set("beschreibung", e.target.value)}
              className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 resize-none h-24"
            />
          </section>

          {/* Kosten */}
          <section>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Kosten</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Geschätzte Kosten (€)</label>
                <Input
                  type="number" step="0.01" placeholder="0,00"
                  value={formData.kosten_geschaetzt}
                  onChange={(e) => set("kosten_geschaetzt", e.target.value)}
                  className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Tatsächliche Kosten (€)</label>
                <Input
                  type="number" step="0.01" placeholder="0,00"
                  value={formData.kosten_tatsaechlich}
                  onChange={(e) => set("kosten_tatsaechlich", e.target.value)}
                  className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"
                />
              </div>
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

          {/* Behebung */}
          {formData.status === "behoben" && (
            <section>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Behebung</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Behoben am</label>
                  <Input type="date" value={formData.behoben_am} onChange={(e) => set("behoben_am", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Behoben durch</label>
                  <Input placeholder="Name / Firma" value={formData.behoben_durch} onChange={(e) => set("behoben_durch", e.target.value)} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
                </div>
              </div>
            </section>
          )}

          {/* Interne Notizen */}
          <section>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Interne Notizen</p>
            <Textarea
              placeholder="Weitere Anmerkungen..."
              value={formData.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 resize-none h-16"
            />
          </section>

          {/* Buttons */}
          <div className="flex gap-2 pt-1 border-t border-[#3a3a3a]">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 border-[#3a3a3a]">Abbrechen</Button>
            <Button type="submit" disabled={mutation.isPending} className="flex-1 bg-[#22c55e] text-black hover:bg-[#16a34a]">
              {mutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {isEdit ? "Aktualisieren" : "Protokoll speichern"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}