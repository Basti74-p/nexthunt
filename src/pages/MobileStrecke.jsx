import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Crosshair } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";

const SPECIES = [
  { value: "rotwild", label: "Rotwild" },
  { value: "schwarzwild", label: "Schwarzwild" },
  { value: "rehwild", label: "Rehwild" },
  { value: "damwild", label: "Damwild" },
  { value: "sikawild", label: "Sikawild" },
  { value: "wolf", label: "Wolf" },
];

const GENDER = [
  { value: "maennlich", label: "Männlich" },
  { value: "weiblich", label: "Weiblich" },
  { value: "unbekannt", label: "Unbekannt" },
];

const AGE_CLASSES = {
  rotwild: ["Hirsch Klasse I", "Hirsch Klasse II", "Hirsch Klasse III", "Tier", "Schmaltier"],
  schwarzwild: ["Keiler (stark)", "Keiler (mittel)", "Bache", "Überläufer (m)", "Überläufer (w)", "Frischling (m)", "Frischling (w)"],
  rehwild: ["Bock Klasse I", "Bock Klasse II", "Bock Klasse III", "Schmalreh (m)", "Schmalreh (w)", "Ricke", "Kitz (m)", "Kitz (w)"],
  damwild: ["Schaufler Klasse I", "Schaufler Klasse II", "Schaufler Klasse III", "Damtier", "Schmaltier"],
  sikawild: ["Hirsch Klasse I", "Hirsch Klasse II", "Hirsch Klasse III", "Tier", "Schmaltier"],
  wolf: ["Rüde", "Fähe", "Welpe"],
};

const EMPTY_FORM = {
  species: "",
  gender: "unbekannt",
  age_class: "",
  date: new Date().toISOString().split("T")[0],
  wildmark_id: "",
};

export default function MobileStrecke() {
  const { tenant } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere-mob-s", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: strecken = [] } = useQuery({
    queryKey: ["strecke", tenant?.id],
    queryFn: () => base44.entities.Strecke.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: wildmarken = [] } = useQuery({
    queryKey: ["wildmarken", tenant?.id],
    queryFn: () => base44.entities.Wildmarke.filter({ tenant_id: tenant?.id, status: "available" }),
    enabled: !!tenant?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Strecke.create({
      ...data, tenant_id: tenant.id, revier_id: reviere[0]?.id, status: "erfasst",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strecke"] });
      setDialogOpen(false);
    },
  });

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Strecke</h2>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl gap-1">
          <Plus className="w-4 h-4" /> Erfassen
        </Button>
      </div>

      <div className="space-y-2">
        {strecken.map(s => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <Crosshair className="w-5 h-5 text-[#0F2F23]" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 capitalize">{SPECIES.find(sp => sp.value === s.species)?.label || s.species}</p>
              <p className="text-xs text-gray-500">{s.gender === "maennlich" ? "♂" : "♀"} • {s.date}</p>
            </div>
            <StatusBadge status={s.status} />
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setForm(EMPTY_FORM); }}>
         <DialogContent className="bg-[#2d2d2d] border-[#3a3a3a] max-w-md rounded-2xl">
           <DialogHeader>
             <DialogTitle className="text-gray-100">Strecke erfassen</DialogTitle>
           </DialogHeader>
           <div className="space-y-3 mt-2">
             <div>
               <Label className="text-gray-300 text-xs mb-1 block">Wildart *</Label>
               <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v })}>
                 <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                   <SelectValue placeholder="Wildart wählen" />
                 </SelectTrigger>
                 <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                   {SPECIES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                 </SelectContent>
               </Select>
             </div>
             <div className="grid grid-cols-2 gap-3">
               <div>
                 <Label className="text-gray-300 text-xs mb-1 block">Geschlecht</Label>
                 <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                   <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                     {GENDER.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label className="text-gray-300 text-xs mb-1 block">Datum *</Label>
                 <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} 
                   className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
               </div>
             </div>
             <div>
               <Label className="text-gray-300 text-xs mb-1 block">Altersklasse</Label>
               <Select value={form.age_class} onValueChange={(v) => setForm({ ...form, age_class: v })}>
                 <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                   <SelectValue placeholder="Altersklasse wählen" />
                 </SelectTrigger>
                 <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                   {form.species && AGE_CLASSES[form.species]?.map(ac => (
                     <SelectItem key={ac} value={ac}>{ac}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div>
               <Label className="text-gray-300 text-xs mb-1 block">Wildmarke</Label>
               <Select value={form.wildmark_id} onValueChange={(v) => setForm({ ...form, wildmark_id: v })}>
                 <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                   <SelectValue placeholder="Marke wählen" />
                 </SelectTrigger>
                 <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                   {wildmarken.map(w => <SelectItem key={w.id} value={w.id}>{w.code}</SelectItem>)}
                 </SelectContent>
               </Select>
             </div>
             <Button onClick={() => { createMutation.mutate(form); setForm(EMPTY_FORM); }} disabled={createMutation.isPending || !form.species || !form.date} 
               className="w-full bg-[#22c55e] text-black hover:bg-[#16a34a] rounded-xl">
               {createMutation.isPending ? "Erfassen..." : "Erfassen"}
             </Button>
           </div>
         </DialogContent>
       </Dialog>
    </div>
  );
}