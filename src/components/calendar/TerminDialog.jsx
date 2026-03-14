import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

  // Fetch available persons
  const { data: persons = [] } = useQuery({
    queryKey: ["persons", tenant?.id],
    queryFn: () => base44.entities.Person.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const createTermin = useMutation({
    mutationFn: (data) =>
      base44.entities.Termin.create({
        tenant_id: tenant?.id,
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["termine", tenant?.id] });
      setFormData({ titel: "", beschreibung: "", uhrzeit_start: "09:00", uhrzeit_ende: "17:00", ort: "", gast_ids: [] });
      onClose();
      onSuccess?.();
    },
  });

  const handleAddGuest = (personId) => {
    setFormData((prev) => ({
      ...prev,
      gast_ids: [...prev.gast_ids, personId],
    }));
  };

  const handleRemoveGuest = (personId) => {
    setFormData((prev) => ({
      ...prev,
      gast_ids: prev.gast_ids.filter((id) => id !== personId),
    }));
  };

  const handleSubmit = () => {
    if (!formData.titel || !formData.datum) return;
    createTermin.mutate(formData);
  };

  const selectedPersons = persons.filter((p) => formData.gast_ids.includes(p.id));
  const availablePersons = persons.filter((p) => !formData.gast_ids.includes(p.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Neuer Termin</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300">Titel</label>
            <Input
              value={formData.titel}
              onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
              placeholder="z.B. Revierbegehung"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300">Datum</label>
            <Input
              type="date"
              value={formData.datum || ""}
              onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-300">Von</label>
              <Input
                type="time"
                value={formData.uhrzeit_start}
                onChange={(e) => setFormData({ ...formData, uhrzeit_start: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Bis</label>
              <Input
                type="time"
                value={formData.uhrzeit_ende}
                onChange={(e) => setFormData({ ...formData, uhrzeit_ende: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300">Ort</label>
            <Input
              value={formData.ort}
              onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
              placeholder="z.B. Revier Nord"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300">Beschreibung</label>
            <Textarea
              value={formData.beschreibung}
              onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
              placeholder="Optionale Notizen..."
              className="mt-1 h-20"
            />
          </div>

          {/* Eingeladene Personen */}
          {selectedPersons.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Eingeladene Personen</label>
              <div className="space-y-2">
                {selectedPersons.map((person) => (
                  <div key={person.id} className="flex items-center justify-between bg-[#2d2d2d] p-2 rounded">
                    <span className="text-sm text-gray-300">{person.name}</span>
                    <button
                      onClick={() => handleRemoveGuest(person.id)}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verfügbare Personen zum Hinzufügen */}
          {availablePersons.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Person hinzufügen</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availablePersons.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => handleAddGuest(person.id)}
                    className="w-full text-left bg-[#2d2d2d] hover:bg-[#3d3d3d] p-2 rounded text-sm text-gray-300 transition-colors"
                  >
                    {person.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.titel || !formData.datum || createTermin.isPending}>
            Erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}