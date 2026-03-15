import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Trash2 } from "lucide-react";
import MobileSelect from "@/components/ui/MobileSelect";

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

export default function EinrichtungDialog({ isOpen, onClose, einrichtung, revierId, tenantId }) {
  const queryClient = useQueryClient();
  const isEdit = !!einrichtung;
  const [formData, setFormData] = useState({
    name: "", type: "", condition: "gut", notes: "", latitude: "", longitude: "", photos: [],
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (einrichtung) {
      setFormData({
        name: einrichtung.name || "",
        type: einrichtung.type || "",
        condition: einrichtung.condition || "gut",
        notes: einrichtung.notes || "",
        latitude: einrichtung.latitude || "",
        longitude: einrichtung.longitude || "",
        photos: einrichtung.photos || [],
      });
    } else {
      setFormData({ name: "", type: "", condition: "gut", notes: "", latitude: "", longitude: "", photos: [] });
    }
  }, [einrichtung, isOpen]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? base44.entities.Jagdeinrichtung.update(einrichtung.id, data)
        : base44.entities.Jagdeinrichtung.create({ ...data, tenant_id: tenantId, revier_id: revierId }),
    onSuccess: () => {
      queryClient.invalidateQueries(["einrichtungen"]);
      onClose();
    },
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      for (const file of files) {
        const fileData = await file.arrayBuffer();
        const response = await base44.integrations.Core.UploadFile({ file: new Blob([fileData], { type: file.type }) });
        if (response.file_url) {
          setFormData(prev => ({ ...prev, photos: [...prev.photos, response.file_url] }));
        }
      }
    } catch (err) {
      alert("Fehler beim Hochladen: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (url) => {
    setFormData(prev => ({ ...prev, photos: prev.photos.filter(p => p !== url) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.type) { alert("Name und Typ erforderlich"); return; }
    mutation.mutate({
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#2d2d2d] border-[#3a3a3a]">
        <DialogHeader>
          <DialogTitle className="text-gray-100">{isEdit ? "Einrichtung bearbeiten" : "Neue Einrichtung"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
          <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"><SelectValue placeholder="Typ auswählen" /></SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
              {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
              {CONDITION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" step="0.0001" placeholder="Breitengrad" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 text-xs" />
            <Input type="number" step="0.0001" placeholder="Längengrad" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 text-xs" />
          </div>
          <Textarea placeholder="Notizen" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 text-xs resize-none h-16" />

          {/* Fotos */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Fotos</label>
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {formData.photos.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-20 object-cover rounded-lg border border-[#3a3a3a]" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(url)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-[#3a3a3a] rounded-lg p-3 text-center cursor-pointer hover:border-[#22c55e] transition-colors">
                  <Upload className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">{uploading ? "Wird hochgeladen..." : "📷 Foto"}</p>
                </div>
              </label>
              <label className="flex-1">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-[#3a3a3a] rounded-lg p-3 text-center cursor-pointer hover:border-[#22c55e] transition-colors">
                  <Upload className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">{uploading ? "Wird hochgeladen..." : "📁 Datei"}</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 border-[#3a3a3a]">Abbrechen</Button>
            <Button type="submit" disabled={mutation.isPending || uploading} className="flex-1 bg-[#22c55e] text-black hover:bg-[#16a34a]">
              {mutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}