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
import { Plus, Crosshair, ChevronRight } from "lucide-react";
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
  weight_kg: "",
  shooter_email: "",
};

export default function MobileStrecke() {
  const { tenant, user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStrecke, setSelectedStrecke] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [wildkammerForm, setWildkammerForm] = useState({
    eingang_datum: new Date().toISOString().split("T")[0],
    eingang_zeit: new Date().toTimeString().slice(0, 5),
    aufbruch_ok: false,
  });
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
      ...data, 
      tenant_id: tenant.id, 
      revier_id: reviere[0]?.id, 
      status: "erfasst",
      weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : undefined,
      shooter_email: data.shooter_email || user?.email,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strecke"] });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
    },
  });

  const createWildkammerMutation = useMutation({
    mutationFn: (data) => base44.entities.Wildkammer.create({
      ...data,
      tenant_id: tenant.id,
      revier_id: selectedStrecke?.revier_id,
      strecke_id: selectedStrecke?.id,
      species: selectedStrecke?.species,
      gender: selectedStrecke?.gender,
      age_class: selectedStrecke?.age_class,
      eingang_datum: data.eingang_datum,
      eingang_zeit: data.eingang_zeit,
      aufbruch_ok: data.aufbruch_ok || false,
      status: "eingang",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strecke"] });
      setDetailOpen(false);
      setSelectedStrecke(null);
      setWildkammerForm({
        eingang_datum: new Date().toISOString().split("T")[0],
        eingang_zeit: new Date().toTimeString().slice(0, 5),
        aufbruch_ok: false,
      });
    },
  });

  const deleteStrecke = async () => {
    if (selectedStrecke && confirm("Eintrag wirklich löschen?")) {
      await base44.entities.Strecke.delete(selectedStrecke.id);
      queryClient.invalidateQueries({ queryKey: ["strecke"] });
      setDetailOpen(false);
      setSelectedStrecke(null);
    }
  };

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
           <button
             key={s.id}
             onClick={() => { setSelectedStrecke(s); setDetailOpen(true); }}
             className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-gray-200 hover:shadow-md transition-all"
           >
             <Crosshair className="w-5 h-5 text-[#0F2F23]" />
             <div className="flex-1">
               <p className="font-medium text-gray-900 capitalize">{SPECIES.find(sp => sp.value === s.species)?.label || s.species}</p>
               <p className="text-xs text-gray-500">{s.gender === "maennlich" ? "♂" : "♀"} • {s.date}</p>
             </div>
             <div className="flex items-center gap-2">
               <StatusBadge status={s.status} />
               <ChevronRight className="w-4 h-4 text-gray-400" />
             </div>
           </button>
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
             <div className="grid grid-cols-2 gap-3">
               <div>
                 <Label className="text-gray-300 text-xs mb-1 block">Wildmarke (Code)</Label>
                 <Input 
                   type="text" 
                   placeholder="Code/scannen" 
                   value={form.wildmark_id} 
                   onChange={(e) => setForm({ ...form, wildmark_id: e.target.value })}
                   className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"
                 />
               </div>
               <div>
                 <Label className="text-gray-300 text-xs mb-1 block">Gewicht (kg)</Label>
                 <Input 
                   type="number" 
                   step="0.1"
                   placeholder="z.B. 24.5" 
                   value={form.weight_kg} 
                   onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                   className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"
                 />
               </div>
             </div>
             <div>
               <Label className="text-gray-300 text-xs mb-1 block">Erleger</Label>
               <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-gray-300 text-sm">
                 {user?.full_name || user?.email}
               </div>
             </div>
             <Button onClick={() => { createMutation.mutate(form); setForm(EMPTY_FORM); }} disabled={createMutation.isPending || !form.species || !form.date} 
               className="w-full bg-[#22c55e] text-black hover:bg-[#16a34a] rounded-xl">
               {createMutation.isPending ? "Erfassen..." : "Erfassen"}
             </Button>
           </div>
         </DialogContent>
         </Dialog>

         {/* Detail Dialog */}
         <Dialog open={detailOpen} onOpenChange={(v) => { setDetailOpen(v); if (!v) setSelectedStrecke(null); }}>
         <DialogContent className="bg-[#2d2d2d] border-[#3a3a3a] max-w-md rounded-2xl">
           <DialogHeader>
             <DialogTitle className="text-gray-100">
               {selectedStrecke && `${SPECIES.find(s => s.value === selectedStrecke.species)?.label || selectedStrecke.species}`}
             </DialogTitle>
           </DialogHeader>
           {selectedStrecke && (
             <div className="space-y-4">
               <div className="bg-[#1a1a1a] rounded-lg p-3 space-y-2 border border-[#3a3a3a]">
                 <p className="text-xs text-gray-400">Datum: <span className="text-gray-200">{selectedStrecke.date}</span></p>
                 <p className="text-xs text-gray-400">Gewicht: <span className="text-gray-200">{selectedStrecke.weight_kg ? `${selectedStrecke.weight_kg} kg` : "–"}</span></p>
                 <p className="text-xs text-gray-400">Altersklasse: <span className="text-gray-200">{selectedStrecke.age_class || "–"}</span></p>
               </div>

               <div className="border-t border-[#3a3a3a] pt-4">
                 <h3 className="text-sm font-semibold text-gray-200 mb-3">Wildkammer-Einlagerung</h3>
                 <div className="space-y-3">
                   <div>
                     <Label className="text-gray-300 text-xs mb-1 block">Eingangsdatum</Label>
                     <Input 
                       type="date" 
                       value={wildkammerForm.eingang_datum}
                       onChange={(e) => setWildkammerForm({ ...wildkammerForm, eingang_datum: e.target.value })}
                       className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 text-sm"
                     />
                   </div>
                   <div>
                     <Label className="text-gray-300 text-xs mb-1 block">Eingangszeit</Label>
                     <Input 
                       type="time" 
                       value={wildkammerForm.eingang_zeit}
                       onChange={(e) => setWildkammerForm({ ...wildkammerForm, eingang_zeit: e.target.value })}
                       className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 text-sm"
                     />
                   </div>
                   <div className="flex items-center gap-2">
                     <input 
                       type="checkbox" 
                       id="aufbruch_ok"
                       checked={wildkammerForm.aufbruch_ok}
                       onChange={(e) => setWildkammerForm({ ...wildkammerForm, aufbruch_ok: e.target.checked })}
                       className="w-4 h-4 rounded"
                     />
                     <label htmlFor="aufbruch_ok" className="text-xs text-gray-300">Aufbruch durchgeführt</label>
                   </div>
                   <Button 
                     onClick={() => createWildkammerMutation.mutate(wildkammerForm)}
                     disabled={createWildkammerMutation.isPending}
                     className="w-full bg-[#22c55e] text-black hover:bg-[#16a34a] rounded-xl text-sm"
                   >
                     {createWildkammerMutation.isPending ? "Einlagern..." : "In Wildkammer einlagern"}
                   </Button>
                   </div>
                   </div>

                   <div className="border-t border-[#3a3a3a] pt-4">
                   <Button 
                   onClick={deleteStrecke}
                   className="w-full bg-red-900/50 text-red-400 hover:bg-red-900/70 rounded-xl text-sm border border-red-700/30"
                   >
                   Eintrag löschen
                   </Button>
                   </div>
                   </div>
                   )}
                   </DialogContent>
                   </Dialog>
         </div>
         );
         }