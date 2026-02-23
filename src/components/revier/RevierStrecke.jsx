import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Crosshair } from "lucide-react";
import { useAuth } from "@/components/hooks/useAuth";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";

const SPECIES = [
  { value: "rotwild", label: "Rotwild" },
  { value: "schwarzwild", label: "Schwarzwild" },
  { value: "rehwild", label: "Rehwild" },
  { value: "damwild", label: "Damwild" },
  { value: "sikawild", label: "Sikawild" },
  { value: "wolf", label: "Wolf" },
];

export default function RevierStrecke({ revier }) {
  const { tenant } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subTab, setSubTab] = useState("alle");
  const [form, setForm] = useState({
    species: "rehwild", gender: "maennlich", age_class: "",
    date: new Date().toISOString().split("T")[0], notes: "", weight_kg: "",
  });
  const queryClient = useQueryClient();

  const { data: strecken = [] } = useQuery({
    queryKey: ["strecke", revier.id],
    queryFn: () => base44.entities.Strecke.filter({ revier_id: revier.id }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Strecke.create({
      ...data, revier_id: revier.id, tenant_id: tenant.id, status: "erfasst",
      weight_kg: data.weight_kg ? Number(data.weight_kg) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strecke"] });
      setDialogOpen(false);
    },
  });

  const filtered = subTab === "alle" ? strecken :
    subTab === "wildkammer" ? strecken.filter(s => s.status === "wildkammer") :
    subTab === "archiv" ? strecken.filter(s => s.status === "archiviert") : strecken;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Tabs value={subTab} onValueChange={setSubTab}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="alle">Alle</TabsTrigger>
            <TabsTrigger value="wildkammer">Wildkammer</TabsTrigger>
            <TabsTrigger value="archiv">Archiv</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setDialogOpen(true)} className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Neuer Eintrag
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Crosshair} title="Keine Einträge" description="Die Streckenliste ist noch leer." />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-5 py-3 text-gray-500 font-medium">Datum</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Wildart</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Geschlecht</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Altersklasse</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Gewicht</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700">{s.date}</td>
                    <td className="px-5 py-3 font-medium text-gray-900 capitalize">{SPECIES.find(sp => sp.value === s.species)?.label || s.species}</td>
                    <td className="px-5 py-3 text-gray-700 capitalize">{s.gender === "maennlich" ? "Männlich" : s.gender === "weiblich" ? "Weiblich" : "Unbekannt"}</td>
                    <td className="px-5 py-3 text-gray-700">{s.age_class || "—"}</td>
                    <td className="px-5 py-3 text-gray-700">{s.weight_kg ? `${s.weight_kg} kg` : "—"}</td>
                    <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Strecke erfassen</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Wildart</Label>
                <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SPECIES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Geschlecht</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maennlich">Männlich</SelectItem>
                    <SelectItem value="weiblich">Weiblich</SelectItem>
                    <SelectItem value="unbekannt">Unbekannt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Altersklasse</Label><Input value={form.age_class} onChange={(e) => setForm({ ...form, age_class: e.target.value })} /></div>
              <div><Label>Datum</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Gewicht (kg)</Label><Input type="number" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} /></div>
            </div>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] rounded-xl">
              {createMutation.isPending ? "Speichern..." : "Erfassen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}