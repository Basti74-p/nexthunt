import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FileText, Bell, MapPin, Calendar } from "lucide-react";

import WolfStatCards from "@/components/wolftrack/WolfStatCards";
import ScalpBadge from "@/components/wolftrack/ScalpBadge";
import WolfStatusBadge from "@/components/wolftrack/WolfStatusBadge";
import AuthorityModal from "@/components/wolftrack/AuthorityModal";
import WolfSightingForm from "@/components/wolftrack/WolfSightingForm";
import WolfRissForm from "@/components/wolftrack/WolfRissForm";
import WolfHuntForm from "@/components/wolftrack/WolfHuntForm";
import WolfTerritoryForm from "@/components/wolftrack/WolfTerritoryForm";
import { printRissProtokoll } from "@/components/wolftrack/RissProtokollPrint";

const TABS = ["Sichtungen", "Risse", "Jagd", "Territorien"];

const HUNT_RESULT_STYLE = {
  "Erlegt":       "bg-red-900/40 text-red-300 border-red-800/40",
  "Gesichtet":    "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Angeschossen": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Kein Kontakt": "bg-gray-600/20 text-gray-400 border-gray-600/30",
};

const TERRITORY_STATUS_STYLE = {
  "Aktives Rudel": "bg-green-500/20 text-green-300",
  "Paar":          "bg-blue-500/20 text-blue-300",
  "Einzeltier":    "bg-yellow-500/20 text-yellow-300",
  "Inaktiv":       "bg-gray-500/20 text-gray-400",
};

const SIGHTING_ICONS = {
  "Lebendsichtung": "👁️", "Totfund": "💀", "Spur": "🐾",
  "Riss": "🩸", "Kot": "💩", "Kamerafalle": "📷", "Sonstiges": "❓",
};

function fmt(d) {
  if (!d) return "–";
  return new Date(d).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtDate(d) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("de-DE");
}

export default function WolfTrack() {
  const { tenant } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("Sichtungen");
  const [showForm, setShowForm] = useState(false);
  const [authorityTarget, setAuthorityTarget] = useState(null);
  const [bundeslandFilter, setBundeslandFilter] = useState("alle");

  const tenantId = tenant?.id;

  const { data: sightings = [] } = useQuery({
    queryKey: ["wolf-sightings", tenantId],
    queryFn: () => base44.entities.WolfSighting.filter({ tenant_id: tenantId }),
    enabled: !!tenantId,
  });

  const { data: risse = [] } = useQuery({
    queryKey: ["wolf-risse", tenantId],
    queryFn: () => base44.entities.WolfRiss.filter({ tenant_id: tenantId }),
    enabled: !!tenantId,
  });

  const { data: hunts = [] } = useQuery({
    queryKey: ["wolf-hunts", tenantId],
    queryFn: () => base44.entities.WolfHunt.filter({ tenant_id: tenantId }),
    enabled: !!tenantId,
  });

  const { data: territories = [] } = useQuery({
    queryKey: ["wolf-territories"],
    queryFn: () => base44.entities.WolfTerritory.list(),
  });

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenantId],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenantId }),
    enabled: !!tenantId,
  });

  // Countdown to 1. Juli 2026
  const seasonStart = new Date("2026-07-01");
  const today = new Date();
  const daysToSeason = Math.max(0, Math.ceil((seasonStart - today) / (1000 * 60 * 60 * 24)));

  const revierName = (id) => reviere.find(r => r.id === id)?.name || "–";

  const filteredTerritories = bundeslandFilter === "alle"
    ? territories
    : territories.filter(t => t.federal_state === bundeslandFilter);

  const uniqueBundeslaender = [...new Set(territories.map(t => t.federal_state).filter(Boolean))].sort();

  const handleFormSaved = () => {
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ["wolf-sightings"] });
    qc.invalidateQueries({ queryKey: ["wolf-risse"] });
    qc.invalidateQueries({ queryKey: ["wolf-hunts"] });
    qc.invalidateQueries({ queryKey: ["wolf-territories"] });
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] pb-24">
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a3a15 0%, #2d5a27 60%, #1a3a15 100%)" }}>
        <div className="absolute inset-0 flex items-center justify-end opacity-10 pointer-events-none select-none">
          <span className="text-[180px]">🐺</span>
        </div>
        <div className="relative px-4 pt-6 pb-5">
          <h1 className="text-2xl font-bold text-white">🐺 WolfTrack</h1>
          <p className="text-sm text-green-200 mt-0.5">Wolfsmonitoring für dein Revier</p>
        </div>
      </div>

      <div className="px-4 pt-4">
        <WolfStatCards sightings={sightings} risse={risse} daysToSeason={daysToSeason} />

        {/* Tabs + New button */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto">
          <div className="flex gap-1 flex-1">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "bg-[#2d5a27] text-white"
                    : "bg-[#2a2a2a] text-gray-400 hover:text-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="shrink-0 bg-[#2d5a27] hover:bg-[#1e3d1b] text-white px-3 h-8 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" /> Neu
          </Button>
        </div>

        {/* ─── TAB: SICHTUNGEN ─── */}
        {activeTab === "Sichtungen" && (
          <div className="space-y-3">
            {sightings.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">👁️</div>
                <p>Noch keine Sichtungen erfasst</p>
              </div>
            )}
            {sightings.map(s => (
              <div key={s.id} className="bg-[#252525] border border-[#333] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{SIGHTING_ICONS[s.sighting_type] || "❓"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-gray-100">{s.sighting_type}</span>
                      <ScalpBadge category={s.scalp_category} />
                      <WolfStatusBadge status={s.status} />
                      {s.reported_to_authority && (
                        <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">✓ Gemeldet</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 space-y-0.5">
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmt(s.sighting_date)}</div>
                      {s.location_name && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.location_name}</div>}
                      {s.wolf_count > 0 && <div>🐺 × {s.wolf_count}</div>}
                    </div>
                    {s.photos?.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {s.photos.slice(0, 3).map((url, i) => (
                          <img key={i} src={url} alt="" className="w-12 h-12 object-cover rounded-lg" />
                        ))}
                        {s.photos.length > 3 && <div className="w-12 h-12 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-xs text-gray-400">+{s.photos.length - 3}</div>}
                      </div>
                    )}
                    {!s.reported_to_authority && (
                      <Button size="sm" variant="outline"
                        onClick={() => setAuthorityTarget(s)}
                        className="mt-2 border-[#2d5a27] text-green-400 hover:bg-[#1a2e1a] h-7 text-xs">
                        <Bell className="w-3 h-3 mr-1" /> An Behörde melden
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── TAB: RISSE ─── */}
        {activeTab === "Risse" && (
          <div className="space-y-3">
            {risse.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">🩸</div>
                <p>Noch keine Risse erfasst</p>
              </div>
            )}
            {risse.map(r => (
              <div key={r.id} className="bg-[#252525] border border-[#333] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🩸</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-gray-100">{r.animal_species}</span>
                      <span className="text-xs text-red-400">💀 {r.animal_count_dead} / 🤕 {r.animal_count_injured}</span>
                      <WolfStatusBadge status={r.status} />
                      {r.wolf_confirmed && <span className="text-xs text-red-300 bg-red-900/30 px-2 py-0.5 rounded-full border border-red-800/40">Wolf bestätigt</span>}
                    </div>
                    <div className="text-xs text-gray-400 space-y-0.5">
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(r.incident_date)}</div>
                      {r.location_name && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.location_name}</div>}
                      {r.owner_name && <div>👤 {r.owner_name}</div>}
                    </div>
                    {r.photos?.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {r.photos.slice(0, 3).map((url, i) => (
                          <img key={i} src={url} alt="" className="w-12 h-12 object-cover rounded-lg" />
                        ))}
                      </div>
                    )}
                    <Button size="sm" variant="outline"
                      onClick={() => printRissProtokoll(r)}
                      className="mt-2 border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a] h-7 text-xs">
                      <FileText className="w-3 h-3 mr-1" /> PDF Rissprotokoll
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── TAB: JAGD ─── */}
        {activeTab === "Jagd" && (
          <div className="space-y-3">
            <div className="bg-[#2a1800] border border-orange-700/40 rounded-xl p-3 text-sm">
              <p className="text-orange-300 font-semibold">🗓️ Wolfsjagdsaison 2026</p>
              <p className="text-orange-200/80 text-xs mt-1">1. Juli – 31. Oktober | Entnahme nach Nutztierriss: ganzjährig möglich</p>
              <p className="text-orange-200/60 text-xs">Grundlage: Bundesjagdgesetz §22a</p>
            </div>
            {hunts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">🎯</div>
                <p>Noch keine Jagddokumentation</p>
              </div>
            )}
            {hunts.map(h => (
              <div key={h.id} className="bg-[#252525] border border-[#333] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🎯</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${HUNT_RESULT_STYLE[h.result] || "bg-gray-600/20 text-gray-400 border-gray-600/30"}`}>
                        {h.result}
                      </span>
                      {h.authority_notified && <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">✓ Behörde informiert</span>}
                      {h.sample_taken && <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">🧬 Probe</span>}
                    </div>
                    <div className="text-xs text-gray-400 space-y-0.5">
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(h.hunt_date)}</div>
                      {h.location_name && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {h.location_name}</div>}
                      <div className="text-gray-500">{h.hunt_type}</div>
                      {h.result === "Erlegt" && <div>⚧ {h.wolf_sex} · {h.wolf_age || "Alter unbekannt"} · {h.distance_meters ? h.distance_meters + " m" : ""}</div>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── TAB: TERRITORIEN ─── */}
        {activeTab === "Territorien" && (
          <div className="space-y-3">
            <div className="bg-[#1a2e1a] border border-[#2d5a27]/40 rounded-xl p-3 text-xs text-green-300">
              📊 Daten basieren auf DBBW — <span className="underline">www.dbb-wolf.de</span>
            </div>
            <div>
              <Select value={bundeslandFilter} onValueChange={setBundeslandFilter}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-gray-100">
                  <SelectValue placeholder="Alle Bundesländer" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3a3a3a]">
                  <SelectItem value="alle">Alle Bundesländer</SelectItem>
                  {uniqueBundeslaender.map(bl => <SelectItem key={bl} value={bl}>{bl}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {filteredTerritories.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">🗺️</div>
                <p>Keine Territorien gefunden</p>
              </div>
            )}
            {filteredTerritories.map(t => (
              <div key={t.id} className="bg-[#252525] border border-[#333] rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-100 text-sm">{t.territory_name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{t.federal_state}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TERRITORY_STATUS_STYLE[t.territory_status] || "bg-gray-500/20 text-gray-400"}`}>
                      {t.territory_status}
                    </span>
                    {t.wolf_count_estimated && <span className="text-xs text-gray-400">🐺 × {t.wolf_count_estimated}</span>}
                  </div>
                </div>
                {t.last_confirmed && <div className="text-xs text-gray-500 mt-1">Zuletzt bestätigt: {fmtDate(t.last_confirmed)}</div>}
                {t.notes && <div className="text-xs text-gray-400 mt-1 italic">{t.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={v => !v && setShowForm(false)}>
        <DialogContent className="bg-[#2d2d2d] border-[#3a3a3a] text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-100">
              {activeTab === "Sichtungen" && "🐺 Neue Wolfssichtung"}
              {activeTab === "Risse" && "🩸 Neues Rissprotokoll"}
              {activeTab === "Jagd" && "🎯 Neue Jagddokumentation"}
              {activeTab === "Territorien" && "🗺️ Neues Territorium"}
            </DialogTitle>
          </DialogHeader>
          {activeTab === "Sichtungen" && (
            <WolfSightingForm tenantId={tenantId} revierOptions={reviere} onSaved={handleFormSaved} onCancel={() => setShowForm(false)} />
          )}
          {activeTab === "Risse" && (
            <WolfRissForm tenantId={tenantId} onSaved={handleFormSaved} onCancel={() => setShowForm(false)} />
          )}
          {activeTab === "Jagd" && (
            <WolfHuntForm tenantId={tenantId} onSaved={handleFormSaved} onCancel={() => setShowForm(false)} />
          )}
          {activeTab === "Territorien" && (
            <WolfTerritoryForm onSaved={handleFormSaved} onCancel={() => setShowForm(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Authority Modal */}
      <AuthorityModal
        sighting={authorityTarget}
        revierName={authorityTarget ? revierName(authorityTarget.revier_id) : ""}
        onClose={() => setAuthorityTarget(null)}
        onMarked={() => qc.invalidateQueries({ queryKey: ["wolf-sightings"] })}
      />
    </div>
  );
}