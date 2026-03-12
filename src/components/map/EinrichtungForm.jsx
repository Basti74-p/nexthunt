import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X } from "lucide-react";

const TYPE_OPTIONS = [
  { value: "hochsitz", label: "Hochsitz" },
  { value: "leiter", label: "Leiter" },
  { value: "erdsitz", label: "Erdsitz" },
  { value: "drueckjagdbock", label: "Drückjagdbock" },
  { value: "ansitzdrueckjagdleiter", label: "Ansitzdrückjagdleiter" },
  { value: "kirrung", label: "Kirrung" },
  { value: "salzlecke", label: "Salzlecke" },
  { value: "suhle", label: "Suhle" },
  { value: "wildacker", label: "Wildacker" },
  { value: "fuetterung", label: "Fütterung" },
  { value: "fanganlage", label: "Fanganlage" },
];

const CONDITION_OPTIONS = [
  { value: "gut", label: "Gut" },
  { value: "maessig", label: "Mäßig" },
  { value: "schlecht", label: "Schlecht" },
  { value: "neu", label: "Neu" },
];

const ORIENTATION_OPTIONS = [
  { value: "n", label: "Nord (↑)" },
  { value: "ne", label: "Nordost (↗)" },
  { value: "e", label: "Ost (→)" },
  { value: "se", label: "Südost (↘)" },
  { value: "s", label: "Süd (↓)" },
  { value: "sw", label: "Südwest (↙)" },
  { value: "w", label: "West (←)" },
  { value: "nw", label: "Nordwest (↖)" },
];

export default function EinrichtungForm({ isOpen, onClose, revierId, tenantId, lat, lng }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    condition: "gut",
    orientation: "",
    notes: "",
    latitude: lat || "",
    longitude: lng || "",
    photos: [],
  });
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Sync coordinates when dialog opens with new click position
  React.useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        latitude: lat || "",
        longitude: lng || "",
      }));
    }
  }, [isOpen, lat, lng]);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingPhotos(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const res = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(res.file_url);
      }
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...uploadedUrls]
      }));
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const mutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Jagdeinrichtung.create({
        ...data,
        tenant_id: tenantId,
        revier_id: revierId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["einrichtungen", revierId]);
      setFormData({ name: "", type: "", condition: "gut", orientation: "", notes: "", latitude: lat || "", longitude: lng || "", photos: [] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.latitude || !formData.longitude) {
      alert("Name, Typ und Koordinaten erforderlich");
      return;
    }
    mutation.mutate({
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      photos: formData.photos.length > 0 ? formData.photos : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#2d2d2d] border-[#3a3a3a]" style={{ zIndex: 10000 }}>
        <DialogHeader>
          <DialogTitle className="text-gray-100">Jagdeinrichtung hinzufügen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"
          />
          <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
              <SelectValue placeholder="Typ auswählen" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]" style={{ zIndex: 10001 }}>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]" style={{ zIndex: 10001 }}>
              {CONDITION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={formData.orientation} onValueChange={(v) => setFormData({ ...formData, orientation: v })}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
              <SelectValue placeholder="Ausrichtung (optional)" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]" style={{ zIndex: 10001 }}>
              {ORIENTATION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              step="0.0001"
              placeholder="Breitengrad"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 text-xs"
            />
            <Input
              type="number"
              step="0.0001"
              placeholder="Längengrad"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 text-xs"
            />
          </div>
          <Textarea
            placeholder="Notizen"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 text-xs resize-none h-16"
          />

          {/* Photo upload section */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-semibold">Fotos (optional)</label>
            <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-[#3a3a3a] rounded-lg bg-[#1a1a1a] hover:border-[#22c55e]/50 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Fotos hochladen</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploadingPhotos}
                className="hidden"
              />
            </label>
            {uploadingPhotos && <p className="text-xs text-gray-400 text-center">Wird hochgeladen...</p>}
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {formData.photos.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt={`Foto ${idx}`} className="w-full h-16 object-cover rounded border border-[#3a3a3a]" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 border-[#3a3a3a]">
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-[#22c55e] text-black hover:bg-[#16a34a]"
            >
              {mutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}