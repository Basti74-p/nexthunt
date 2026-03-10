import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, FileText, Printer, RotateCcw, ShoppingCart,
  Users, BarChart2, Trash2, CheckCircle, Clock, AlertCircle,
  Mail, Phone, MapPin, Pencil
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import VerkaufDialog from "@/components/wildverkauf/VerkaufDialog";
import RechnungPrint from "@/components/wildverkauf/RechnungPrint";
import PrintWindow from "@/components/wildverkauf/PrintWindow";
import VerkaufStats from "@/components/wildverkauf/VerkaufStats";

const ZAHLUNGSSTATUS_CONFIG = {
  offen: { label: "Offen", color: "text-yellow-400 bg-yellow-400/10", icon: Clock },
  bezahlt: { label: "Bezahlt", color: "text-green-400 bg-green-400/10", icon: CheckCircle },
  teilbezahlt: { label: "Teilbezahlt", color: "text-blue-400 bg-blue-400/10", icon: Clock },
  storniert: { label: "Storniert", color: "text-red-400 bg-red-400/10", icon: AlertCircle },
};

const TYPES = [
  { value: "privat", label: "Privat" },
  { value: "gewerbe", label: "Gewerbe" },
  { value: "gastronomie", label: "Gastronomie" },
];
const EMPTY_KUNDE = { name: "", contact_person: "", email: "", phone: "", address: "", type: "privat", notes: "" };

const formatDate = (d) => {
  if (!d) return "–";
  try { return format(new Date(d), "dd.MM.yyyy", { locale: de }); } catch { return d; }
};

export default function Wildverkauf() {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("verkauefe");
  const [showVerkaufDialog, setShowVerkaufDialog] = useState(false);
  const [printData, setPrintData] = useState(null); // { verkauf, mode }
  const [kundeDialog, setKundeDialog] = useState(false);
  const [editKunde, setEditKunde] = useState(null);
  const [kundeForm, setKundeForm] = useState(EMPTY_KUNDE);
  const [statusFilter, setStatusFilter] = useState("alle");

  // Tenant settings for print
  const [tenantSettings, setTenantSettings] = useState({});
  React.useEffect(() => {
    base44.auth.me().then(u => { if (u?.etikett_settings) setTenantSettings(u.etikett_settings); });
  }, []);

  const { data: verkauefe = [] } = useQuery({
    queryKey: ["verkauefe", tenant?.id],
    queryFn: () => base44.entities.Verkauf.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: kunden = [] } = useQuery({
    queryKey: ["kunden", tenant?.id],
    queryFn: () => base44.entities.Kunde.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const createVerkaufMutation = useMutation({
    mutationFn: async (data) => {
      const v = await base44.entities.Verkauf.create({ ...data, tenant_id: tenant.id });
      for (const pos of data.positionen) {
        if (pos.typ === "wildprodukt") {
          await base44.entities.WildProdukt.update(pos.ref_id, { status: "verkauft", ausgabe_datum: data.datum, ausgabe_an: data.kunde_name });
        } else if (pos.typ === "wildkammer") {
          await base44.entities.Wildkammer.update(pos.ref_id, { status: "verkauft", ausgabe_datum: data.datum, ausgabe_an: data.kunde_name, ausgabe_typ: "verkauf", verkaufspreis: pos.gesamtpreis });
        }
      }
      return v;
    },
    onMutate: (data) => {
      queryClient.setQueryData(["verkauefe", tenant?.id], old => [...(old || []), { ...data, id: "temp-" + Date.now() }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verkauefe"] });
      queryClient.invalidateQueries({ queryKey: ["wildProdukte"] });
      queryClient.invalidateQueries({ queryKey: ["wildkammer"] });
      setShowVerkaufDialog(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, bezahlt_am }) => base44.entities.Verkauf.update(id, { zahlungsstatus: status, bezahlt_am }),
    onMutate: ({ id, status, bezahlt_am }) => {
      queryClient.setQueryData(["verkauefe", tenant?.id], old => (old || []).map(v => v.id === id ? { ...v, zahlungsstatus: status, bezahlt_am } : v));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["verkauefe"] }),
  });

  const deleteVerkaufMutation = useMutation({
    mutationFn: (id) => base44.entities.Verkauf.delete(id),
    onMutate: (id) => {
      queryClient.setQueryData(["verkauefe", tenant?.id], old => (old || []).filter(v => v.id !== id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["verkauefe"] }),
  });

  const createKundeMutation = useMutation({
    mutationFn: (data) => base44.entities.Kunde.create({ ...data, tenant_id: tenant.id }),
    onMutate: (data) => {
      queryClient.setQueryData(["kunden", tenant?.id], old => [...(old || []), { ...data, id: "temp-" + Date.now() }]);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["kunden"] }); setKundeDialog(false); setKundeForm(EMPTY_KUNDE); },
  });

  const updateKundeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Kunde.update(id, data),
    onMutate: ({ id, data }) => {
      queryClient.setQueryData(["kunden", tenant?.id], old => (old || []).map(k => k.id === id ? { ...k, ...data } : k));
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["kunden"] }); setKundeDialog(false); setEditKunde(null); setKundeForm(EMPTY_KUNDE); },
  });

  const deleteKundeMutation = useMutation({
    mutationFn: (id) => base44.entities.Kunde.delete(id),
    onMutate: (id) => {
      queryClient.setQueryData(["kunden", tenant?.id], old => (old || []).filter(k => k.id !== id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kunden"] }),
  });

  const filteredVerkauefe = statusFilter === "alle" ? verkauefe : verkauefe.filter(v => v.zahlungsstatus === statusFilter);

  const openPrint = (verkauf, mode) => {
    const kunde = kunden.find(k => k.id === verkauf.kunde_id);
    setPrintData({ verkauf, kunde, mode });
  };

  const openKundeEdit = (k) => {
    setEditKunde(k);
    setKundeForm({ name: k.name || "", contact_person: k.contact_person || "", email: k.email || "", phone: k.phone || "", address: k.address || "", type: k.type || "privat", notes: k.notes || "" });
    setKundeDialog(true);
  };

  const handleKundeSave = () => {
    if (editKunde) updateKundeMutation.mutate({ id: editKunde.id, data: kundeForm });
    else createKundeMutation.mutate(kundeForm);
  };

  const tabs = [
    { id: "verkauefe", label: "Verkäufe", icon: ShoppingCart },
    { id: "kunden", label: "Kunden", icon: Users },
    { id: "statistik", label: "Statistik", icon: BarChart2 },
  ];

  if (!tenant) return <div className="text-gray-400">Keine Daten verfügbar</div>;

  return (
    <div>
      {/* Print-Ansicht */}
      {printData && (
        <PrintWindow
          printData={printData}
          tenantSettings={tenantSettings}
          onClose={() => setPrintData(null)}
        />
      )}

      <PageHeader
        title="Wildverkauf"
        subtitle={`${verkauefe.length} Verkäufe`}
        actions={
          <Button onClick={() => setShowVerkaufDialog(true)} className="bg-[#22c55e] text-black hover:bg-[#16a34a] gap-2">
            <Plus className="w-4 h-4" /> Neuer Verkauf
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#1a1a1a] p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? "bg-[#22c55e] text-black" : "text-gray-400 hover:text-gray-200"}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Verkäufe */}
      {tab === "verkauefe" && (
        <div>
          <div className="flex gap-3 mb-4 flex-wrap">
            {["alle", "offen", "bezahlt", "teilbezahlt", "storniert"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-[#22c55e] text-black" : "bg-[#1a1a1a] text-gray-400 hover:text-gray-200 border border-[#3a3a3a]"}`}>
                {s === "alle" ? "Alle" : ZAHLUNGSSTATUS_CONFIG[s]?.label}
                {s !== "alle" && (
                  <span className="ml-1 opacity-70">({verkauefe.filter(v => v.zahlungsstatus === s).length})</span>
                )}
              </button>
            ))}
          </div>

          {filteredVerkauefe.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="Keine Verkäufe" description="Erstellen Sie Ihren ersten Verkauf mit 'Neuer Verkauf'." />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-[#3a3a3a] bg-[#232323]">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-400 font-medium">Rechnung</th>
                      <th className="px-4 py-3 text-left text-gray-400 font-medium">Datum</th>
                      <th className="px-4 py-3 text-left text-gray-400 font-medium">Kunde</th>
                      <th className="px-4 py-3 text-left text-gray-400 font-medium">Positionen</th>
                      <th className="px-4 py-3 text-right text-gray-400 font-medium">Betrag</th>
                      <th className="px-4 py-3 text-left text-gray-400 font-medium">Status</th>
                      <th className="px-4 py-3 text-right text-gray-400 font-medium">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVerkauefe.map(v => {
                      const sc = ZAHLUNGSSTATUS_CONFIG[v.zahlungsstatus] || ZAHLUNGSSTATUS_CONFIG.offen;
                      const StatusIcon = sc.icon;
                      return (
                        <tr key={v.id} className="border-b border-[#3a3a3a] hover:bg-[#252525]">
                          <td className="px-4 py-3 font-mono text-[#22c55e] text-xs">{v.rechnungsnummer || "–"}</td>
                          <td className="px-4 py-3" style={{color:"#e5e5e5"}}>{formatDate(v.datum)}</td>
                          <td className="px-4 py-3 font-medium" style={{color:"#e5e5e5"}}>{v.kunde_name || "–"}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{(v.positionen || []).length} Pos.</td>
                          <td className="px-4 py-3 text-right font-bold" style={{color:"#22c55e"}}>€ {(v.brutto_betrag || 0).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {v.zahlungsstatus !== "bezahlt" && (
                                <button onClick={() => updateStatusMutation.mutate({ id: v.id, status: "bezahlt", bezahlt_am: new Date().toISOString().split("T")[0] })}
                                  title="Als bezahlt markieren"
                                  className="p-1.5 rounded hover:bg-green-400/10 text-gray-400 hover:text-green-400 transition-colors">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => openPrint(v, "lieferschein")} title="Lieferschein"
                                className="p-1.5 rounded hover:bg-[#2d2d2d] text-gray-400 hover:text-blue-400 transition-colors">
                                <FileText className="w-4 h-4" />
                              </button>
                              <button onClick={() => openPrint(v, "rechnung")} title="Rechnung drucken"
                                className="p-1.5 rounded hover:bg-[#2d2d2d] text-gray-400 hover:text-[#22c55e] transition-colors">
                                <Printer className="w-4 h-4" />
                              </button>
                              <button onClick={() => { if (confirm("Verkauf wirklich löschen?")) deleteVerkaufMutation.mutate(v.id); }}
                                title="Löschen"
                                className="p-1.5 rounded hover:bg-red-900/20 text-gray-400 hover:text-red-400 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3">
                {filteredVerkauefe.map(v => {
                  const sc = ZAHLUNGSSTATUS_CONFIG[v.zahlungsstatus] || ZAHLUNGSSTATUS_CONFIG.offen;
                  const StatusIcon = sc.icon;
                  return (
                    <div key={v.id} className="bg-[#232323] rounded-xl border border-[#3a3a3a] p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono text-[#22c55e] text-sm font-medium">{v.rechnungsnummer || "–"}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(v.datum)}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-gray-100">{v.kunde_name || "–"}</p>
                        <p className="text-gray-400">{(v.positionen || []).length} Position(en) • €{(v.brutto_betrag || 0).toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-[#3a3a3a]">
                        {v.zahlungsstatus !== "bezahlt" && (
                          <button onClick={() => updateStatusMutation.mutate({ id: v.id, status: "bezahlt", bezahlt_am: new Date().toISOString().split("T")[0] })}
                            className="flex-1 p-2 rounded-lg hover:bg-green-400/10 text-gray-400 hover:text-green-400 transition-colors">
                            <CheckCircle className="w-4 h-4 mx-auto" />
                          </button>
                        )}
                        <button onClick={() => openPrint(v, "lieferschein")}
                          className="flex-1 p-2 rounded-lg hover:bg-[#2d2d2d] text-gray-400 hover:text-blue-400 transition-colors">
                          <FileText className="w-4 h-4 mx-auto" />
                        </button>
                        <button onClick={() => openPrint(v, "rechnung")}
                          className="flex-1 p-2 rounded-lg hover:bg-[#2d2d2d] text-gray-400 hover:text-[#22c55e] transition-colors">
                          <Printer className="w-4 h-4 mx-auto" />
                        </button>
                        <button onClick={() => { if (confirm("Verkauf wirklich löschen?")) deleteVerkaufMutation.mutate(v.id); }}
                          className="flex-1 p-2 rounded-lg hover:bg-red-900/20 text-gray-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Kunden */}
      {tab === "kunden" && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setEditKunde(null); setKundeForm(EMPTY_KUNDE); setKundeDialog(true); }}
              className="bg-[#22c55e] text-black hover:bg-[#16a34a] gap-2">
              <Plus className="w-4 h-4" /> Neuer Kunde
            </Button>
          </div>
          {kunden.length === 0 ? (
            <EmptyState icon={Users} title="Keine Kunden" description="Legen Sie Ihren ersten Kunden an." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kunden.map(k => (
                <div key={k.id} className="bg-[#232323] rounded-xl border border-[#3a3a3a] p-4 hover:border-[#22c55e]/40 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-100">{k.name}</h3>
                      {k.contact_person && <p className="text-xs text-gray-400">{k.contact_person}</p>}
                    </div>
                    <span className="text-xs bg-[#2d2d2d] border border-[#3a3a3a] text-gray-300 px-2 py-1 rounded-lg">
                      {TYPES.find(t => t.value === k.type)?.label || k.type}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm mb-4">
                    {k.email && <div className="flex items-center gap-2 text-gray-400"><Mail className="w-3.5 h-3.5" /><span className="text-gray-300">{k.email}</span></div>}
                    {k.phone && <div className="flex items-center gap-2 text-gray-400"><Phone className="w-3.5 h-3.5" /><span className="text-gray-300">{k.phone}</span></div>}
                    {k.address && <div className="flex items-center gap-2 text-gray-400"><MapPin className="w-3.5 h-3.5" /><span className="text-gray-300">{k.address}</span></div>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openKundeEdit(k)} className="flex-1 p-2 rounded-lg hover:bg-[#3a3a3a] text-gray-400 hover:text-gray-200 transition-colors">
                      <Pencil className="w-3.5 h-3.5 mx-auto" />
                    </button>
                    <button onClick={() => { if (confirm("Kunde wirklich löschen?")) deleteKundeMutation.mutate(k.id); }}
                      className="flex-1 p-2 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Statistik */}
      {tab === "statistik" && (
        <VerkaufStats verkauefe={verkauefe} kunden={kunden} />
      )}

      {/* Verkauf erfassen Dialog */}
      <VerkaufDialog
        open={showVerkaufDialog}
        onClose={() => setShowVerkaufDialog(false)}
        onSave={(data) => createVerkaufMutation.mutate(data)}
        tenant={tenant}
      />

      {/* Kunden Dialog */}
      <Dialog open={kundeDialog} onOpenChange={v => { setKundeDialog(v); if (!v) { setEditKunde(null); setKundeForm(EMPTY_KUNDE); } }}>
        <DialogContent className="bg-[#2d2d2d] border-[#3a3a3a] max-w-lg sm:max-w-lg max-h-[90vh] w-[calc(100vw-2rem)] sm:w-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-100">{editKunde ? "Kunde bearbeiten" : "Neuer Kunde"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Name *</Label>
                <Input value={kundeForm.name} onChange={e => setKundeForm({ ...kundeForm, name: e.target.value })}
                  placeholder="Kundenname" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Typ</Label>
                <Select value={kundeForm.type} onValueChange={v => setKundeForm({ ...kundeForm, type: v })}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                    {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Ansprechperson</Label>
              <Input value={kundeForm.contact_person} onChange={e => setKundeForm({ ...kundeForm, contact_person: e.target.value })}
                placeholder="Name" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Email</Label>
                <Input type="email" value={kundeForm.email} onChange={e => setKundeForm({ ...kundeForm, email: e.target.value })}
                  className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
              </div>
              <div>
                <Label className="text-gray-300 text-xs mb-1 block">Telefon</Label>
                <Input value={kundeForm.phone} onChange={e => setKundeForm({ ...kundeForm, phone: e.target.value })}
                  className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
              </div>
            </div>
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Adresse</Label>
              <Input value={kundeForm.address} onChange={e => setKundeForm({ ...kundeForm, address: e.target.value })}
                placeholder="Straße, PLZ, Stadt" className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100" />
            </div>
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Notizen</Label>
              <Textarea value={kundeForm.notes} onChange={e => setKundeForm({ ...kundeForm, notes: e.target.value })}
                className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100 resize-none h-16" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setKundeDialog(false)} className="flex-1 border-[#3a3a3a]">Abbrechen</Button>
              <Button onClick={handleKundeSave} disabled={!kundeForm.name}
                className="flex-1 bg-[#22c55e] text-black hover:bg-[#16a34a]">
                {editKunde ? "Aktualisieren" : "Erstellen"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}