import React, { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";

export default function TerminDialog({ isOpen, onClose, selectedDate, tenant, onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titel: "",
    beschreibung: "",
    uhrzeit_start: "09:00",
    uhrzeit_ende: "17:00",
    ort: "",
    gast_ids: [],
  });

  useEffect(() => {
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        datum: format(selectedDate, "yyyy-MM-dd"),
      }));
    }
  }, [selectedDate]);

  const { data: persons = [] } = useQuery({
    queryKey: ["persons", tenant?.id],
    queryFn: () => base44.entities.Person.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const createTermin = useMutation({
    mutationFn: (data) =>
      base44.entities.Termin.create({ tenant_id: tenant?.id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["termine", tenant?.id] });
      queryClient.invalidateQueries({ queryKey: ["termine-mobile", tenant?.id] });
      setFormData({ titel: "", beschreibung: "", uhrzeit_start: "09:00", uhrzeit_ende: "17:00", ort: "", gast_ids: [] });
      onClose();
      onSuccess?.();
    },
  });

  const handleSubmit = () => {
    if (!formData.titel || !formData.datum) return;
    createTermin.mutate(formData);
  };

  const selectedPersons = persons.filter((p) => formData.gast_ids.includes(p.id));
  const availablePersons = persons.filter((p) => !formData.gast_ids.includes(p.id));

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="bg-[#2d2d2d] border-t border-[#3a3a3a] max-h-[92dvh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-gray-100 text-base">Neuer Termin</DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 space-y-4 pb-2">
          {/* Titel */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Titel *</label>
            <Input
              value={formData.titel}
              onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
              placeholder="z.B. Revierbegehung"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"
              autoFocus={false}
            />
          </div>

          {/* Datum */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Datum *</label>
            <Input
              type="date"
              value={formData.datum || ""}
              onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
              className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"
            />
          </div>

          {/* Zeiten */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Von</label>
              <Input
                type="time"
                value={formData.uhrzeit_start}
                onChange={(e) => setFormData({ ...formData, uhrzeit_start: e.target.value })}
                className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Bis</label>
              <Input
                type="time"
                value={formData.uhrzeit_ende}
                onChange={(e) => setFormData({ ...formData, uhrzeit_ende: e.target.value })}
                className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"
              />
            </div>
          </div>

          {/* Ort */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Ort</label>
            <Input
              value={formData.ort}
              onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
              placeholder="z.B. Revier Nord"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"
            />
          </div>

          {/* Beschreibung */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Beschreibung</label>
            <Textarea
              value={formData.beschreibung}
              onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
              placeholder="Optionale Notizen..."
              className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 resize-none h-20"
            />
          </div>

          {/* Eingeladene */}
          {selectedPersons.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-400 mb-2 block">Eingeladene Personen</label>
              <div className="space-y-1.5">
                {selectedPersons.map((person) => (
                  <div key={person.id} className="flex items-center justify-between bg-[#1a1a1a] px-3 py-2 rounded-lg">
                    <span className="text-sm text-gray-300">{person.name}</span>
                    <button onClick={() => setFormData(p => ({ ...p, gast_ids: p.gast_ids.filter(id => id !== person.id) }))} className="text-gray-500 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {availablePersons.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-400 mb-2 block">Person hinzufügen</label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {availablePersons.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => setFormData(p => ({ ...p, gast_ids: [...p.gast_ids, person.id] }))}
                    className="w-full text-left bg-[#1a1a1a] hover:bg-[#2d2d2d] px-3 py-2 rounded-lg text-sm text-gray-300 transition-colors"
                  >
                    {person.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="pt-2 pb-safe" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <Button
            onClick={handleSubmit}
            disabled={!formData.titel || !formData.datum || createTermin.isPending}
            className="w-full bg-[#22c55e] text-black hover:bg-[#16a34a]"
          >
            Termin erstellen
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full border-[#3a3a3a]">
            Abbrechen
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}