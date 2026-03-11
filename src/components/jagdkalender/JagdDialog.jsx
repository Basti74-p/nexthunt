import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";

const JAGDFORMEN = [
  { value: "drueckjagd", label: "Drückjagd" },
  { value: "treibjagd", label: "Treibjagd" },
  { value: "stoeberjagd", label: "Stöberjagd" },
  { value: "feldtreibjagd", label: "Feldtreibjagd" },
  { value: "bewegungsjagd", label: "Bewegungsjagd" },
  { value: "gemeinschaftsansitz", label: "Gemeinschaftsansitz" },
  { value: "niederwildjagd", label: "Niederwildjagd" },
];

export default function JagdDialog({ open, onClose, jagd = null }) {
  const { tenant, user } = useAuth();
  const isEdit = !!jagd;

  const [form, setForm] = useState(jagd ? { ...jagd } : {
    titel: "",
    jagdform: "",
    datum: "",
    uhrzeit_start: "",
    uhrzeit_ende: "",
    treffpunkt: "",
    beschreibung: "",
    sicherheitshinweise: "",
    revier_id: "",
  });

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id, status: "active" }),
    enabled: !!tenant?.id,
  });

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? base44.entities.GesellschaftsJagd.update(jagd.id, data)
      : base44.entities.GesellschaftsJagd.create({
          ...data,
          tenant_id: tenant.id,
          jagdleiter_email: user?.email,
          jagdleiter_name: user?.full_name,
          status: "planung",
        }),
    onSuccess: () => onClose(),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.titel && form.jagdform && form.datum && form.revier_id;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="bg-[#1e1e1e] border-[#2d2d2d] text-gray-100 max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Jagd bearbeiten" : "Neue Gesellschaftsjagd"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <Label className="text-gray-300">Titel *</Label>
            <Input value={form.titel} onChange={e => set("titel", e.target.value)}
              placeholder="z.B. Drückjagd Revier Nord" className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300">Jagdform *</Label>
              <Select value={form.jagdform} onValueChange={v => set("jagdform", v)}>
                <SelectTrigger className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1">
                  <SelectValue placeholder="Wählen..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1e1e] border-[#2d2d2d]">
                  {JAGDFORMEN.map(j => <SelectItem key={j.value} value={j.value} className="text-gray-100">{j.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Revier *</Label>
              <Select value={form.revier_id} onValueChange={v => set("revier_id", v)}>
                <SelectTrigger className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1">
                  <SelectValue placeholder="Wählen..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1e1e] border-[#2d2d2d]">
                  {reviere.map(r => <SelectItem key={r.id} value={r.id} className="text-gray-100">{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-gray-300">Datum *</Label>
              <Input type="date" value={form.datum} onChange={e => set("datum", e.target.value)}
                className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1" />
            </div>
            <div>
              <Label className="text-gray-300">Beginn</Label>
              <Input type="time" value={form.uhrzeit_start} onChange={e => set("uhrzeit_start", e.target.value)}
                className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1" />
            </div>
            <div>
              <Label className="text-gray-300">Ende</Label>
              <Input type="time" value={form.uhrzeit_ende} onChange={e => set("uhrzeit_ende", e.target.value)}
                className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-gray-300">Treffpunkt</Label>
            <Input value={form.treffpunkt} onChange={e => set("treffpunkt", e.target.value)}
              placeholder="z.B. Parkplatz Waldweg, 99999 Musterstadt"
              className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1" />
          </div>
          <div>
            <Label className="text-gray-300">Beschreibung</Label>
            <Textarea value={form.beschreibung} onChange={e => set("beschreibung", e.target.value)}
              rows={2} className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1" />
          </div>
          <div>
            <Label className="text-gray-300">Sicherheitshinweise</Label>
            <Textarea value={form.sicherheitshinweise} onChange={e => set("sicherheitshinweise", e.target.value)}
              placeholder="z.B. Schusslinie beachten, Sicherheitsabstände..."
              rows={2} className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1" />
          </div>
          <Button onClick={() => mutation.mutate(form)} disabled={!valid || mutation.isPending} className="w-full">
            {mutation.isPending ? "Speichern..." : isEdit ? "Änderungen speichern" : "Jagd erstellen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}