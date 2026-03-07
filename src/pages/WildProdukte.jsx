import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../components/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Printer, Trash2, Edit2 } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";

const PRODUKTTYPEN = {
  filet: "Filet",
  keule: "Keule",
  rind: "Rind",
  schnitzel: "Schnitzel",
  wurst: "Wurst",
  schinken: "Schinken",
  sonstiges: "Sonstiges"
};

const STATUS_LABELS = {
  lager: "Im Lager",
  ausgegeben: "Ausgegeben",
  verkauft: "Verkauft",
  verbraucht: "Verbraucht"
};

export default function WildProdukte() {
  const { user, currentTenant, currentRevier } = useAuth();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [statusFilter, setStatusFilter] = useState("lager");
  const [form, setForm] = useState({
    produkttyp: "filet",
    gewicht_kg: "",
    einfrierungs_datum: new Date().toISOString().split('T')[0],
    einfrierungs_zeit: new Date().toTimeString().slice(0, 5),
    lager_temperatur: -18,
    lager_location: "",
    beschreibung: "",
    notes: ""
  });

  const { data: wildkammers } = useQuery({
    queryKey: ["wildkammers", currentTenant?.id, currentRevier?.id],
    queryFn: () => base44.entities.Wildkammer.filter({ tenant_id: currentTenant?.id, revier_id: currentRevier?.id }),
  });

  const { data: produkte } = useQuery({
    queryKey: ["wildProdukte", currentTenant?.id, currentRevier?.id],
    queryFn: () => base44.entities.WildProdukt.filter({ tenant_id: currentTenant?.id, revier_id: currentRevier?.id }),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const wildnummer = `WP-${Date.now().toString().slice(-8)}`;
      await base44.entities.WildProdukt.create({
        tenant_id: currentTenant.id,
        revier_id: currentRevier.id,
        wildkammer_id: data.wildkammer_id,
        wildnummer,
        produkttyp: data.produkttyp,
        gewicht_kg: parseFloat(data.gewicht_kg),
        einfrierungs_datum: data.einfrierungs_datum,
        einfrierungs_zeit: data.einfrierungs_zeit,
        lager_temperatur: parseFloat(data.lager_temperatur),
        lager_location: data.lager_location,
        beschreibung: data.beschreibung,
        notes: data.notes,
        status: "lager"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wildProdukte"] });
      setShowDialog(false);
      setForm({
        produkttyp: "filet",
        gewicht_kg: "",
        einfrierungs_datum: new Date().toISOString().split('T')[0],
        einfrierungs_zeit: new Date().toTimeString().slice(0, 5),
        lager_temperatur: -18,
        lager_location: "",
        beschreibung: "",
        notes: ""
      });
      setEditingProduct(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WildProdukt.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wildProdukte"] });
    }
  });

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setForm({
        produkttyp: product.produkttyp,
        gewicht_kg: product.gewicht_kg.toString(),
        einfrierungs_datum: product.einfrierungs_datum,
        einfrierungs_zeit: product.einfrierungs_zeit,
        lager_temperatur: product.lager_temperatur.toString(),
        lager_location: product.lager_location,
        beschreibung: product.beschreibung,
        notes: product.notes
      });
    }
    setShowDialog(true);
  };

  const handlePrintEtikett = (product) => {
    const etikett = `
WILDMARKE / ETIKETT
═══════════════════════════════════════
Wildnummer: ${product.wildnummer}
Produkttyp: ${PRODUKTTYPEN[product.produkttyp]}
Gewicht: ${product.gewicht_kg} kg
Eingefrorenes: ${product.einfrierungs_datum}
Lagertemperatur: ${product.lager_temperatur}°C
Lagerort: ${product.lager_location}
Beschreibung: ${product.beschreibung}
═══════════════════════════════════════
    `;
    window.print();
  };

  const filteredProducts = useMemo(() => {
    if (!produkte) return [];
    return produkte.filter(p => p.status === statusFilter);
  }, [produkte, statusFilter]);

  if (!currentTenant || !currentRevier) {
    return <div className="text-gray-400">Bitte wählen Sie zuerst ein Revier</div>;
  }

  return (
    <div>
      <PageHeader title="Wildprodukt Lager" />

      <div className="flex gap-2 mb-6">
        <Button onClick={() => handleOpenDialog()} className="gap-2 bg-[#22c55e] hover:bg-[#16a34a]">
          <Plus className="w-4 h-4" /> Neues Produkt
        </Button>
      </div>

      <div className="mb-6">
        <Label className="text-sm mb-2 block">Status filtern</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-[#1a1a1a] border-[#3a3a3a]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
            <SelectItem value="lager">Im Lager</SelectItem>
            <SelectItem value="ausgegeben">Ausgegeben</SelectItem>
            <SelectItem value="verkauft">Verkauft</SelectItem>
            <SelectItem value="verbraucht">Verbraucht</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg border border-[#3a3a3a] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#3a3a3a] bg-[#2d2d2d]">
            <tr>
              <th className="px-4 py-3 text-left">Wildnummer</th>
              <th className="px-4 py-3 text-left">Produkttyp</th>
              <th className="px-4 py-3 text-left">Gewicht</th>
              <th className="px-4 py-3 text-left">Lagerlocation</th>
              <th className="px-4 py-3 text-left">Temp.</th>
              <th className="px-4 py-3 text-left">Seit</th>
              <th className="px-4 py-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id} className="border-b border-[#3a3a3a] hover:bg-[#252525]">
                <td className="px-4 py-3 font-mono text-[#22c55e]">{product.wildnummer}</td>
                <td className="px-4 py-3">{PRODUKTTYPEN[product.produkttyp]}</td>
                <td className="px-4 py-3">{product.gewicht_kg} kg</td>
                <td className="px-4 py-3 text-gray-400">{product.lager_location}</td>
                <td className="px-4 py-3 text-xs">{product.lager_temperatur}°C</td>
                <td className="px-4 py-3 text-xs text-gray-400">{product.einfrierungs_datum}</td>
                <td className="px-4 py-3 text-right flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePrintEtikett(product)}
                    className="text-[#22c55e] hover:bg-[#2d2d2d]"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenDialog(product)}
                    className="text-gray-400 hover:bg-[#2d2d2d]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(product.id)}
                    className="text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            Keine Produkte in diesem Status
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#2d2d2d] border-[#3a3a3a]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Produkt bearbeiten" : "Neues Wildprodukt"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-1 block">Wildkammer</Label>
              <Select onValueChange={v => setForm({ ...form, wildkammer_id: v })}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a]">
                  <SelectValue placeholder="Wildkammer wählen" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  {wildkammers?.map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.species} - {w.eingang_datum}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-1 block">Produkttyp</Label>
              <Select value={form.produkttyp} onValueChange={v => setForm({ ...form, produkttyp: v })}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  {Object.entries(PRODUKTTYPEN).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-1 block">Gewicht (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.gewicht_kg}
                  onChange={e => setForm({ ...form, gewicht_kg: e.target.value })}
                  className="bg-[#1a1a1a] border-[#3a3a3a]"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Lagerlocation</Label>
                <Input
                  value={form.lager_location}
                  onChange={e => setForm({ ...form, lager_location: e.target.value })}
                  placeholder="z.B. A1, B2"
                  className="bg-[#1a1a1a] border-[#3a3a3a]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-1 block">Einfrierungs-Datum</Label>
                <Input
                  type="date"
                  value={form.einfrierungs_datum}
                  onChange={e => setForm({ ...form, einfrierungs_datum: e.target.value })}
                  className="bg-[#1a1a1a] border-[#3a3a3a]"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Einfrierungs-Zeit</Label>
                <Input
                  type="time"
                  value={form.einfrierungs_zeit}
                  onChange={e => setForm({ ...form, einfrierungs_zeit: e.target.value })}
                  className="bg-[#1a1a1a] border-[#3a3a3a]"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1 block">Lagertemperatur (°C)</Label>
              <Input
                type="number"
                value={form.lager_temperatur}
                onChange={e => setForm({ ...form, lager_temperatur: e.target.value })}
                className="bg-[#1a1a1a] border-[#3a3a3a]"
              />
            </div>

            <div>
              <Label className="text-xs mb-1 block">Beschreibung</Label>
              <Input
                value={form.beschreibung}
                onChange={e => setForm({ ...form, beschreibung: e.target.value })}
                placeholder="z.B. Oberschale, linke Seite"
                className="bg-[#1a1a1a] border-[#3a3a3a]"
              />
            </div>

            <div>
              <Label className="text-xs mb-1 block">Notizen</Label>
              <Input
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="bg-[#1a1a1a] border-[#3a3a3a]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              className="bg-[#22c55e] hover:bg-[#16a34a]"
            >
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}