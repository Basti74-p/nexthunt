import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ShoppingCart } from "lucide-react";

const PRODUKTTYPEN = {
  filet: "Filet", keule: "Keule", rind: "Rind", schnitzel: "Schnitzel",
  wurst: "Wurst", schinken: "Schinken", sonstiges: "Sonstiges"
};
const SPECIES_LABEL = {
  rotwild: "Rotwild", schwarzwild: "Schwarzwild", rehwild: "Rehwild",
  damwild: "Damwild", sikawild: "Sikawild", wolf: "Wolf"
};

export default function VerkaufDialog({ open, onClose, onSave, tenant }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    datum: today,
    kunde_id: "",
    positionen: [],
    mwst_prozent: 7,
    zahlungsart: "ueberweisung",
    zahlungsstatus: "offen",
    faelligkeitsdatum: "",
    notizen: "",
  });
  const [newPos, setNewPos] = useState({ typ: "wildprodukt", ref_id: "", preis_pro_kg: "" });

  const { data: kunden = [] } = useQuery({
    queryKey: ["kunden", tenant?.id],
    queryFn: () => base44.entities.Kunde.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: wildprodukte = [] } = useQuery({
    queryKey: ["wildProdukte-lager", tenant?.id],
    queryFn: () => base44.entities.WildProdukt.filter({ tenant_id: tenant?.id, status: "lager" }),
    enabled: !!tenant?.id,
  });

  const { data: wildkammer = [] } = useQuery({
    queryKey: ["wildkammer-freigabe", tenant?.id],
    queryFn: () => base44.entities.Wildkammer.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const availableWildkammer = wildkammer.filter(w => w.freigabe && (w.status === "lager" || w.status === "verarbeitung"));

  const addPosition = () => {
    let item = null;
    if (newPos.typ === "wildprodukt") {
      item = wildprodukte.find(w => w.id === newPos.ref_id);
      if (!item) return;
    } else {
      item = availableWildkammer.find(w => w.id === newPos.ref_id);
      if (!item) return;
    }
    const preis = parseFloat(newPos.preis_pro_kg) || 0;
    const gewicht = newPos.typ === "wildprodukt" ? item.gewicht_kg : (item.gewicht_kalt || 0);
    const pos = {
      typ: newPos.typ,
      ref_id: newPos.ref_id,
      bezeichnung: newPos.typ === "wildprodukt"
        ? `${PRODUKTTYPEN[item.produkttyp] || item.produkttyp} (${item.wildnummer})`
        : `${SPECIES_LABEL[item.species] || item.species} – ${item.eingang_datum}`,
      gewicht_kg: gewicht,
      preis_pro_kg: preis,
      gesamtpreis: parseFloat((gewicht * preis).toFixed(2)),
    };
    setForm(f => ({ ...f, positionen: [...f.positionen, pos] }));
    setNewPos({ typ: "wildprodukt", ref_id: "", preis_pro_kg: "" });
  };

  const removePosition = (idx) => {
    setForm(f => ({ ...f, positionen: f.positionen.filter((_, i) => i !== idx) }));
  };

  const netto = form.positionen.reduce((s, p) => s + p.gesamtpreis, 0);
  const mwst = parseFloat((netto * form.mwst_prozent / 100).toFixed(2));
  const brutto = parseFloat((netto + mwst).toFixed(2));

  const selectedKunde = kunden.find(k => k.id === form.kunde_id);

  const handleSave = () => {
    const rechnungsnummer = `RE-${Date.now().toString().slice(-8)}`;
    onSave({
      ...form,
      rechnungsnummer,
      kunde_name: selectedKunde?.name || "",
      gesamtbetrag: netto,
      mwst_betrag: mwst,
      brutto_betrag: brutto,
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[#2d2d2d] border-[#3a3a3a] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-100 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#22c55e]" /> Neuer Verkauf
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Kopfdaten */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Datum *</Label>
              <Input type="date" value={form.datum}
                onChange={e => setForm({ ...form, datum: e.target.value })}
                className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Fälligkeit</Label>
              <Input type="date" value={form.faelligkeitsdatum}
                onChange={e => setForm({ ...form, faelligkeitsdatum: e.target.value })}
                className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Kunde *</Label>
              <Select value={form.kunde_id} onValueChange={v => setForm({ ...form, kunde_id: v })}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                  <SelectValue placeholder="Kunde wählen" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  {kunden.map(k => <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Zahlungsart</Label>
              <Select value={form.zahlungsart} onValueChange={v => setForm({ ...form, zahlungsart: v })}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="ueberweisung">Überweisung</SelectItem>
                  <SelectItem value="ec">EC-Karte</SelectItem>
                  <SelectItem value="sonstiges">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Positionen */}
          <div className="border border-[#3a3a3a] rounded-lg p-3 space-y-3">
            <p className="text-xs font-medium text-gray-300 uppercase tracking-wide">Positionen</p>

            {form.positionen.length > 0 && (
              <div className="space-y-2">
                {form.positionen.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[#1a1a1a] rounded p-2 text-sm">
                    <div className="flex-1">
                      <p className="text-gray-200 text-xs">{p.bezeichnung}</p>
                      <p className="text-gray-400 text-xs">{p.gewicht_kg} kg × €{p.preis_pro_kg}/kg = <span className="text-[#22c55e]">€{p.gesamtpreis.toFixed(2)}</span></p>
                    </div>
                    <button onClick={() => removePosition(i)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Neue Position */}
            <div className="bg-[#1a1a1a] rounded p-3 space-y-2">
              <p className="text-xs text-gray-400">Position hinzufügen</p>
              <div className="grid grid-cols-3 gap-2">
                <Select value={newPos.typ} onValueChange={v => setNewPos({ typ: v, ref_id: "", preis_pro_kg: "" })}>
                  <SelectTrigger className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    <SelectItem value="wildprodukt">Wildprodukt</SelectItem>
                    <SelectItem value="wildkammer">Wildkammer (Ganz)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={newPos.ref_id} onValueChange={v => setNewPos({ ...newPos, ref_id: v })}>
                  <SelectTrigger className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 text-xs">
                    <SelectValue placeholder="Artikel wählen" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    {newPos.typ === "wildprodukt"
                      ? wildprodukte.map(w => (
                          <SelectItem key={w.id} value={w.id}>
                            {PRODUKTTYPEN[w.produkttyp]} – {w.wildnummer} ({w.gewicht_kg}kg)
                          </SelectItem>
                        ))
                      : availableWildkammer.map(w => (
                          <SelectItem key={w.id} value={w.id}>
                            {SPECIES_LABEL[w.species]} – {w.eingang_datum} ({w.gewicht_kalt || 0}kg)
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>

                <div className="flex gap-1">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="€/kg"
                    value={newPos.preis_pro_kg}
                    onChange={e => setNewPos({ ...newPos, preis_pro_kg: e.target.value })}
                    className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 text-xs"
                  />
                  <Button size="sm" onClick={addPosition} disabled={!newPos.ref_id || !newPos.preis_pro_kg}
                    className="bg-[#22c55e] text-black hover:bg-[#16a34a] px-2">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Summen */}
          {form.positionen.length > 0 && (
            <div className="bg-[#1a1a1a] rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Netto</span>
                <span>€ {netto.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400">
                <div className="flex items-center gap-2">
                  <span>MwSt.</span>
                  <Input
                    type="number"
                    value={form.mwst_prozent}
                    onChange={e => setForm({ ...form, mwst_prozent: parseFloat(e.target.value) || 0 })}
                    className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 w-16 h-6 text-xs py-0"
                  />
                  <span>%</span>
                </div>
                <span>€ {mwst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-100 border-t border-[#3a3a3a] pt-1 mt-1">
                <span>Gesamt (Brutto)</span>
                <span className="text-[#22c55e]">€ {brutto.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs text-gray-400 mb-1 block">Notizen</Label>
            <Textarea value={form.notizen} onChange={e => setForm({ ...form, notizen: e.target.value })}
              placeholder="Besonderheiten, Hinweise…"
              className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 resize-none h-16" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#3a3a3a]">Abbrechen</Button>
          <Button
            onClick={handleSave}
            disabled={!form.kunde_id || form.positionen.length === 0}
            className="bg-[#22c55e] text-black hover:bg-[#16a34a]"
          >
            Verkauf speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}