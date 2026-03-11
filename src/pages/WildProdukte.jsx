import React, { useState, useMemo, useEffect } from "react";
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
import EtikettPrintView from "../components/wildprodukte/EtikettPrintView";
import EtikettEditor from "../components/wildprodukte/EtikettEditor";

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
  const { user, tenant } = useAuth();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [statusFilter, setStatusFilter] = useState("lager");
  const [printProduct, setPrintProduct] = useState(null);
  const [etikettSettings, setEtikettSettings] = useState({
    empfaenger: "",
    eigeneNotiz: "",
  });
  const [savedSettings, setSavedSettings] = useState({});

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.etikett_settings) setSavedSettings(u.etikett_settings);
    });
  }, []);
  const [form, setForm] = useState({
    revier_id: "",
    wildkammer_id: "",
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
    queryKey: ["wildkammers", tenant?.id],
    queryFn: () => base44.entities.Wildkammer.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: produkte } = useQuery({
    queryKey: ["wildProdukte", tenant?.id],
    queryFn: () => base44.entities.WildProdukt.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const wildnummer = `WP-${Date.now().toString().slice(-8)}`;
      await base44.entities.WildProdukt.create({
        tenant_id: tenant.id,
        revier_id: data.revier_id,
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
        revier_id: "",
        wildkammer_id: "",
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

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.WildProdukt.update(editingProduct.id, {
        revier_id: data.revier_id,
        wildkammer_id: data.wildkammer_id,
        produkttyp: data.produkttyp,
        gewicht_kg: parseFloat(data.gewicht_kg),
        einfrierungs_datum: data.einfrierungs_datum,
        einfrierungs_zeit: data.einfrierungs_zeit,
        lager_temperatur: parseFloat(data.lager_temperatur),
        lager_location: data.lager_location,
        beschreibung: data.beschreibung,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wildProdukte"] });
      setShowDialog(false);
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
        revier_id: product.revier_id,
        wildkammer_id: product.wildkammer_id,
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
    setEtikettSettings({ empfaenger: "", eigeneNotiz: "" });
    // Enrich product with wildart from linked wildkammer
    const wk = wildkammers?.find(w => w.id === product.wildkammer_id);
    setPrintProduct({ ...product, wildart: wk?.species || product.wildart });
  };

  const filteredProducts = useMemo(() => {
    if (!produkte) return [];
    return produkte.filter(p => p.status === statusFilter);
  }, [produkte, statusFilter]);

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  if (!tenant) {
    return <div className="text-gray-400">Keine Daten verfügbar</div>;
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
                <td className="px-4 py-3" style={{color: "#e5e5e5"}}>{PRODUKTTYPEN[product.produkttyp]}</td>
                <td className="px-4 py-3" style={{color: "#e5e5e5"}}>{product.gewicht_kg} kg</td>
                <td className="px-4 py-3" style={{color: "#e5e5e5"}}>{product.lager_location}</td>
                <td className="px-4 py-3 text-xs" style={{color: "#e5e5e5"}}>{product.lager_temperatur}°C</td>
                <td className="px-4 py-3 text-xs" style={{color: "#e5e5e5"}}>{product.einfrierungs_datum}</td>
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

      {printProduct && (
        <div className="fixed inset-0 z-50 flex bg-gray-100">
          {/* Linke Seite: Editor */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full print:hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-base">Etikett drucken</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <EtikettEditor settings={etikettSettings} onChange={setEtikettSettings} />
            </div>
            <div className="px-5 py-4 border-t border-gray-200 space-y-2">
              <Button
                onClick={() => setTimeout(() => window.print(), 100)}
                className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white"
              >
                Drucken
              </Button>
              <Button
                variant="outline"
                onClick={() => setPrintProduct(null)}
                className="w-full text-gray-900 border-gray-300"
              >
                Schließen
              </Button>
            </div>
          </div>

          {/* Rechte Seite: Vorschau */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <div>
              <p className="text-center text-gray-500 text-xs mb-3 print:hidden">Vorschau</p>
              <EtikettPrintView product={printProduct} settings={{ ...savedSettings, ...etikettSettings }} />
            </div>
          </div>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#2d2d2d] border-[#3a3a3a]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Produkt bearbeiten" : "Neues Wildprodukt"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-1 block">Revier</Label>
              <Select value={form.revier_id || ""} onValueChange={v => setForm({ ...form, revier_id: v })}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a]">
                  <SelectValue placeholder="Revier wählen" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  {reviere.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-1 block">Wildkammer</Label>
              <Select value={form.wildkammer_id} onValueChange={v => setForm({ ...form, wildkammer_id: v })}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a]">
                  <SelectValue placeholder="Wildkammer wählen" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  {wildkammers?.filter(w => w.revier_id === form.revier_id).map(w => (
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
              onClick={() => editingProduct ? updateMutation.mutate(form) : createMutation.mutate(form)}
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