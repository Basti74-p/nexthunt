import React, { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle, Weight, Thermometer, Calendar, Clock, MapPin, Tag, FileText, Trash2, ChevronRight, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SPECIES_LABEL = {
  rotwild: "Rotwild", schwarzwild: "Schwarzwild", rehwild: "Rehwild",
  damwild: "Damwild", sikawild: "Sikawild", niederwild: "Niederwild", wolf: "Wolf",
};

const SPECIES_EMOJI = {
  rotwild: "🦌", schwarzwild: "🐗", rehwild: "🦌", damwild: "🦌", sikawild: "🦌", niederwild: "🐇", wolf: "🐺",
};

const GENDER_LABEL = { maennlich: "Männlich", weiblich: "Weiblich", unbekannt: "Unbekannt" };

const STATUS_OPTIONS = [
  { value: "eingang",      label: "Eingang",      color: "text-blue-400" },
  { value: "verarbeitung", label: "Verarbeitung", color: "text-amber-400" },
  { value: "lager",        label: "Lager",        color: "text-green-400" },
  { value: "ausgabe",      label: "Ausgabe",      color: "text-purple-400" },
  { value: "verkauft",     label: "Verkauft",     color: "text-gray-400" },
];

function InfoRow({ icon: Icon, label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#2a2a2a] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-[#1e1e1e] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-100 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function WildkammerDetailSheet({ item, revierName, onClose, onUpdated, onDeleted }) {
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [currentItem, setCurrentItem] = useState(item);

  React.useEffect(() => {
    setCurrentItem(item);
  }, [item]);

  if (!currentItem) return null;

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    await base44.entities.Wildkammer.update(currentItem.id, { status: newStatus });
    setCurrentItem({ ...currentItem, status: newStatus });
    onUpdated();
    setSaving(false);
  };

  const handleToggleFreigabe = async () => {
    setSaving(true);
    const newFreigabe = !currentItem.freigabe;
    await base44.entities.Wildkammer.update(currentItem.id, { freigabe: newFreigabe });
    setCurrentItem({ ...currentItem, freigabe: newFreigabe });
    onUpdated();
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    await base44.entities.Wildkammer.delete(currentItem.id);
    setSaving(false);
    onDeleted();
    onClose();
  };

  const emoji = SPECIES_EMOJI[currentItem.species] || "🦌";
  const currentStatus = STATUS_OPTIONS.find(s => s.value === currentItem.status);

  return (
    <Drawer open={!!item} onOpenChange={v => !v && onClose()}>
      <DrawerContent className="bg-[#222] border-t border-[#333] max-h-[90dvh]">
        <DrawerHeader className="pb-0 px-4 pt-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] flex items-center justify-center text-3xl border border-[#333]">
              {emoji}
            </div>
            <div>
              <DrawerTitle className="text-white text-xl font-bold">
                {SPECIES_LABEL[currentItem.species] || currentItem.species}
              </DrawerTitle>
              <p className="text-gray-500 text-sm mt-0.5">
                {GENDER_LABEL[currentItem.gender] || currentItem.gender}
                {currentItem.age_class ? ` · ${currentItem.age_class}` : ""}
              </p>
            </div>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-8">
          {/* Status ändern */}
          <div className="bg-[#1a1a1a] rounded-2xl p-4 mb-4 border border-[#333]">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Status ändern</p>
            <Select value={currentItem.status} onValueChange={handleStatusChange} disabled={saving}>
              <SelectTrigger className="bg-[#252525] border-[#3a3a3a] text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className={s.color}>{s.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trichinen-Probe */}
          <div className="bg-[#1a1a1a] rounded-2xl p-4 mb-4 border border-[#333]">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Trichinen-Probe</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentItem.trichinenprobe || false}
                  onChange={(e) => {
                    const newVal = e.target.checked;
                    base44.entities.Wildkammer.update(currentItem.id, { trichinenprobe: newVal });
                    setCurrentItem({ ...currentItem, trichinenprobe: newVal });
                    onUpdated();
                  }}
                  className="w-4 h-4 rounded accent-[#22c55e]"
                />
                <span className="text-sm text-gray-300">Probe entnommen</span>
              </label>

              {currentItem.trichinenprobe && (
                <>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Probedatum</label>
                    <input
                      type="date"
                      value={currentItem.trichinenprobe_datum || ""}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        base44.entities.Wildkammer.update(currentItem.id, { trichinenprobe_datum: newVal });
                        setCurrentItem({ ...currentItem, trichinenprobe_datum: newVal });
                        onUpdated();
                      }}
                      className="w-full bg-[#252525] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#22c55e]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Ergebnis</label>
                    <Select value={currentItem.trichinenprobe_ergebnis || "ausstehend"} onValueChange={(v) => {
                      base44.entities.Wildkammer.update(currentItem.id, { trichinenprobe_ergebnis: v });
                      setCurrentItem({ ...currentItem, trichinenprobe_ergebnis: v });
                      onUpdated();
                    }}>
                      <SelectTrigger className="bg-[#252525] border-[#3a3a3a] text-gray-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                        <SelectItem value="ausstehend">⏳ Ausstehend</SelectItem>
                        <SelectItem value="negativ">✓ Negativ (freigegeben)</SelectItem>
                        <SelectItem value="positiv">⚠️ Positiv (gesperrt)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {currentItem.trichinenprobe_ergebnis === "positiv" && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-red-300">Positives Trichinen-Ergebnis – Tier darf nicht freigegeben werden</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Freigabe Toggle */}
          <button
            onClick={handleToggleFreigabe}
            disabled={saving || (currentItem.trichinenprobe && currentItem.trichinenprobe_ergebnis === "positiv")}
            className={`w-full flex items-center justify-between p-4 rounded-2xl mb-4 border transition-all active:scale-95 ${
              currentItem.freigabe
                ? "bg-green-500/15 border-green-500/30"
                : "bg-[#1a1a1a] border-[#333]"
            } ${currentItem.trichinenprobe && currentItem.trichinenprobe_ergebnis === "positiv" ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle className={`w-5 h-5 ${currentItem.freigabe ? "text-green-400" : "text-gray-600"}`} />
              <div className="text-left">
                <p className={`text-sm font-semibold ${currentItem.freigabe ? "text-green-400" : "text-gray-300"}`}>
                  Fleischfreigabe
                </p>
                <p className="text-xs text-gray-500">
                  {currentItem.freigabe ? "Freigegeben" : "Noch nicht freigegeben"}
                </p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${currentItem.freigabe ? "bg-green-500" : "bg-[#3a3a3a]"} relative`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${currentItem.freigabe ? "left-7" : "left-1"}`} />
            </div>
          </button>

          {/* Details */}
          <div className="bg-[#1a1a1a] rounded-2xl px-4 mb-4 border border-[#333]">
            <InfoRow icon={Calendar} label="Eingangsdatum" value={currentItem.eingang_datum} />
            <InfoRow icon={Clock} label="Eingangszeit" value={currentItem.eingang_zeit} />
            <InfoRow icon={MapPin} label="Revier" value={revierName} />
            <InfoRow icon={Weight} label="Gewicht aufgebrochen" value={currentItem.gewicht_aufgebrochen ? `${currentItem.gewicht_aufgebrochen} kg` : null} />
            <InfoRow icon={Weight} label="Kaltgewicht" value={currentItem.gewicht_kalt ? `${currentItem.gewicht_kalt} kg` : null} />
            <InfoRow icon={Thermometer} label="Kühltemperatur" value={currentItem.kuehltemperatur != null ? `${currentItem.kuehltemperatur} °C` : null} />
            <InfoRow icon={Tag} label="Wildmarke" value={currentItem.wildmark_id || null} />
            <InfoRow icon={FileText} label="Notizen" value={currentItem.notes || null} />
          </div>

          {/* Checks */}
          {(currentItem.aufbruch_ok || currentItem.decke_ab || currentItem.trichinenprobe) && (
            <div className="bg-[#1a1a1a] rounded-2xl p-4 mb-4 border border-[#333] flex flex-wrap gap-2">
              {currentItem.aufbruch_ok && (
                <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" /> Aufbruch i.O.
                </span>
              )}
              {currentItem.decke_ab && (
                <span className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" /> Decke ab
                </span>
              )}
              {currentItem.trichinenprobe && (
                <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" /> Trichinen
                </span>
              )}
            </div>
          )}

          {/* Löschen */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-red-500/20 text-red-400 text-sm font-medium active:scale-95 transition-transform"
            >
              <Trash2 className="w-4 h-4" />
              Eintrag löschen
            </button>
          ) : (
            <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4">
              <p className="text-sm text-red-300 font-medium mb-3 text-center">Wirklich löschen?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#3a3a3a] text-gray-300 text-sm font-medium"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold"
                >
                  Löschen
                </button>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}