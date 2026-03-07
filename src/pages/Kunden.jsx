import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Mail, Phone, MapPin } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

const TYPES = [
  { value: "privat", label: "Privat" },
  { value: "gewerbe", label: "Gewerbe" },
  { value: "gastronomie", label: "Gastronomie" },
];

const EMPTY_FORM = {
  name: "",
  contact_person: "",
  email: "",
  phone: "",
  address: "",
  type: "privat",
  notes: "",
};

export default function Kunden() {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: kunden = [], isLoading } = useQuery({
    queryKey: ["kunden", tenant?.id],
    queryFn: () => base44.entities.Kunde.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Kunde.create({ ...data, tenant_id: tenant.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kunden"] });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Kunde.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kunden"] });
      setDialogOpen(false);
      setEditItem(null);
      setForm(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Kunde.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kunden"] }),
  });

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name || "",
      contact_person: item.contact_person || "",
      email: item.email || "",
      phone: item.phone || "",
      address: item.address || "",
      type: item.type || "privat",
      notes: item.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const typeLabel = (v) => TYPES.find(t => t.value === v)?.label || v;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Kunden"
        subtitle={`${kunden.length} Kunden verwaltet`}
        actions={
          <Button onClick={openCreate} className="bg-[#22c55e] text-black hover:bg-[#16a34a] rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Neuer Kunde
          </Button>
        }
      />

      {kunden.length === 0 && !isLoading ? (
        <EmptyState icon={Plus} title="Keine Kunden" description="Erstellen Sie Ihren ersten Kunden." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kunden.map((item) => (
            <div key={item.id} className="bg-[#232323] rounded-2xl border border-[#3a3a3a] p-4 hover:border-[#22c55e]/40 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-100">{item.name}</h3>
                  {item.contact_person && <p className="text-xs text-gray-400">{item.contact_person}</p>}
                </div>
                <span className="text-xs bg-[#2d2d2d] border border-[#3a3a3a] text-gray-300 px-2 py-1 rounded-lg">{typeLabel(item.type)}</span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                {item.email && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail className="w-3.5 h-3.5" />
                    <a href={`mailto:${item.email}`} className="text-gray-300 hover:text-[#22c55e]">{item.email}</a>
                  </div>
                )}
                {item.phone && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone className="w-3.5 h-3.5" />
                    <a href={`tel:${item.phone}`} className="text-gray-300 hover:text-[#22c55e]">{item.phone}</a>
                  </div>
                )}
                {item.address && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-gray-300">{item.address}</span>
                  </div>
                )}
              </div>

              {item.notes && <p className="text-xs text-gray-500 mb-3 p-2 bg-[#1a1a1a] rounded">{item.notes}</p>}

              <div className="flex gap-2">
                <button onClick={() => openEdit(item)} className="flex-1 p-2 rounded-lg hover:bg-[#3a3a3a] text-gray-400 hover:text-gray-200 transition-colors text-sm">
                  <Pencil className="w-3.5 h-3.5 mx-auto" />
                </button>
                <button onClick={() => { if (confirm("Kunde wirklich löschen?")) deleteMutation.mutate(item.id); }} className="flex-1 p-2 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors text-sm">
                  <Trash2 className="w-3.5 h-3.5 mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditItem(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="bg-[#2d2d2d] border-[#3a3a3a] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-100">{editItem ? "Kunde bearbeiten" : "Neuer Kunde"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Kundenname" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Typ</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Ansprechperson</Label>
              <Input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })}
                placeholder="Name der Ansprechperson" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="E-Mail" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Telefon</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="Telefonnummer" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Adresse</Label>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Straße, PLZ, Stadt" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>

            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Notizen</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Besonderheiten, Vorlieben…" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 resize-none h-16" />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 border-[#3a3a3a]">Abbrechen</Button>
              <Button
                onClick={handleSubmit}
                disabled={!form.name || createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-[#22c55e] text-black hover:bg-[#16a34a]">
                {createMutation.isPending || updateMutation.isPending ? "Speichern..." : editItem ? "Aktualisieren" : "Erstellen"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}