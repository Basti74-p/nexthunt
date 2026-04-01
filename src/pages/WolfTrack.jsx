import React, { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Sub-components
import WolfTrackMap from "@/components/wolftrack/WolfTrackMap";
import WolfStatCards from "@/components/wolftrack/WolfStatCards";
import WolfSightingForm from "@/components/wolftrack/WolfSightingForm";
import WolfRissForm from "@/components/wolftrack/WolfRissForm";
import WolfHuntForm from "@/components/wolftrack/WolfHuntForm";
import WolfTerritoryForm from "@/components/wolftrack/WolfTerritoryForm";
import WolfSamplesTab from "@/components/wolftrack/WolfSamplesTab";
import WolfCamerasTab from "@/components/wolftrack/WolfCamerasTab";
import WolfReportsTab from "@/components/wolftrack/WolfReportsTab";
import MeldepflichtModal from "@/components/wolftrack/MeldepflichtModal";
import ScalpBadge from "@/components/wolftrack/ScalpBadge";
import WolfStatusBadge from "@/components/wolftrack/WolfStatusBadge";

const TABS = [
  { id: "karte", label: "🗺️ Karte" },
  { id: "sichtungen", label: "👁️ Sichtungen" },
  { id: "risse", label: "⚠️ Risse" },
  { id: "proben", label: "🧪 Proben" },
  { id: "jagd", label: "🎯 Jagd" },
  { id: "kameras", label: "📷 Kameras" },
  { id: "berichte", label: "📊 Berichte" },
  { id: "territorien", label: "🗺 Territorien" },
];

export default function WolfTrack() {
  const { tenant } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("karte");
  const [showForm, setShowForm] = useState(null);
  const [quickAddCoords, setQuickAddCoords] = useState(null);
  const [meldepflichtHunt, setMeldepflichtHunt] = useState(null);
  const [jumpToSample, setJumpToSample] = useState(false);

  const tenantId = tenant?.id;

  const refetchAll = () => {
    qc.invalidateQueries({ queryKey: ["wolf-sightings", tenantId] });
    qc.invalidateQueries({ queryKey: ["wolf-risse", tenantId] });
    qc.invalidateQueries({ queryKey: ["wolf-hunts", tenantId] });
    qc.invalidateQueries({ queryKey: ["wolf-territories"] });
    qc.invalidateQueries({ queryKey: ["wolf-samples", tenantId] });
    qc.invalidateQueries({ queryKey: ["wolf-cameras", tenantId] });
    qc.invalidateQueries({ queryKey: ["wolf-reports", tenantId] });
    qc.invalidateQueries({ queryKey: ["wolf-contacts", tenantId] });
  };

  const { data: sightings = [] } = useQuery({ queryKey: ["wolf-sightings", tenantId], queryFn: () => tenantId ? base44.entities.WolfSighting.filter({ tenant_id: tenantId }) : [], enabled: !!tenantId });
  const { data: risse = [] } = useQuery({ queryKey: ["wolf-risse", tenantId], queryFn: () => tenantId ? base44.entities.WolfRiss.filter({ tenant_id: tenantId }) : [], enabled: !!tenantId });
  const { data: hunts = [] } = useQuery({ queryKey: ["wolf-hunts", tenantId], queryFn: () => tenantId ? base44.entities.WolfHunt.filter({ tenant_id: tenantId }) : [], enabled: !!tenantId });
  const { data: territories = [] } = useQuery({ queryKey: ["wolf-territories"], queryFn: () => base44.entities.WolfTerritory.list() });
  const { data: samples = [] } = useQuery({ queryKey: ["wolf-samples", tenantId], queryFn: () => tenantId ? base44.entities.WolfSample.filter({ tenant_id: tenantId }) : [], enabled: !!tenantId });
  const { data: cameras = [] } = useQuery({ queryKey: ["wolf-cameras", tenantId], queryFn: () => tenantId ? base44.entities.WolfCamera.filter({ tenant_id: tenantId }) : [], enabled: !!tenantId });
  const { data: reports = [] } = useQuery({ queryKey: ["wolf-reports", tenantId], queryFn: () => tenantId ? base44.entities.WolfReport.filter({ tenant_id: tenantId }) : [], enabled: !!tenantId });
  const { data: contacts = [] } = useQuery({ queryKey: ["wolf-contacts", tenantId], queryFn: () => tenantId ? base44.entities.WolfContact.filter({ tenant_id: tenantId }) : [], enabled: !!tenantId });

  const handleQuickAdd = useCallback((coords) => {
    setQuickAddCoords(coords);
    setShowForm("sichtung");
  }, []);

  function handleHuntSaved(hunt) {
    refetchAll();
    if (hunt?.result === "Erlegt") {
      setMeldepflichtHunt(hunt);
    }
  }

  const formMap = {
    sichtung: <WolfSightingForm tenantId={tenantId} initialCoords={quickAddCoords} onSaved={() => { setShowForm(null); setQuickAddCoords(null); refetchAll(); }} onCancel={() => { setShowForm(null); setQuickAddCoords(null); }} />,
    riss: <WolfRissForm tenantId={tenantId} onSaved={() => { setShowForm(null); refetchAll(); }} onCancel={() => setShowForm(null)} />,
    jagd: <WolfHuntForm tenantId={tenantId} onSaved={(h) => { setShowForm(null); handleHuntSaved(h); }} onCancel={() => setShowForm(null)} />,
    territorium: <WolfTerritoryForm onSaved={() => { setShowForm(null); refetchAll(); }} onCancel={() => setShowForm(null)} />,
  };

  const addBtnMap = {
    sichtungen: { label: "+ Sichtung", form: "sichtung" },
    risse: { label: "+ Riss", form: "riss" },
    jagd: { label: "+ Jagdeintrag", form: "jagd" },
    territorien: { label: "+ Territorium", form: "territorium" },
  };

  return (
    <div className="min-h-screen" style={{ background: "#1e1e1e" }}>
      {/* Header */}
      <div className="px-4 md:px-6 pt-4 pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: "#2d5a27" }}>
              <span className="text-2xl">🐺</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">WolfTrack</h1>
              <p className="text-gray-400 text-xs">DBBW-Standard · Senckenberg Genetik · Professionelles Wolfsmonitoring</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {addBtnMap[activeTab] && (
              <Button onClick={() => setShowForm(addBtnMap[activeTab].form)} className="text-sm">{addBtnMap[activeTab].label}</Button>
            )}
            <a href="/wolftrack/contacts" className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: "#2a2a2a", border: "1px solid #3a3a3a", color: "#e5e5e5" }}>
              📞 Kontakte
            </a>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="mt-3">
          <WolfStatCards sightings={sightings} risse={risse} samples={samples} hunts={hunts} cameras={cameras} />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-6 border-b border-gray-700 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="px-3 py-2.5 text-xs md:text-sm font-medium whitespace-nowrap transition-all border-b-2"
              style={{
                color: activeTab === tab.id ? "#22c55e" : "#9ca3af",
                borderBottomColor: activeTab === tab.id ? "#22c55e" : "transparent",
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 py-4">
        {/* KARTE */}
        {activeTab === "karte" && (
          <WolfTrackMap
            sightings={sightings} risse={risse} samples={samples}
            cameras={cameras} territories={territories} hunts={hunts}
            onQuickAdd={handleQuickAdd}
          />
        )}

        {/* SICHTUNGEN */}
        {activeTab === "sichtungen" && (
          <div className="space-y-3">
            {sightings.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">👁️</div><div>Keine Sichtungen erfasst</div>
              </div>
            ) : sightings.map(s => (
              <div key={s.id} className="p-3 rounded-xl" style={{ background: "#2a2a2a", border: "1px solid #3a3a3a" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">{s.sighting_type}</span>
                      {s.scalp_category && <ScalpBadge category={s.scalp_category} />}
                      <WolfStatusBadge status={s.status} />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {s.sighting_date && new Date(s.sighting_date).toLocaleString("de")}
                      {s.location_name && ` · ${s.location_name}`}
                      {s.wolf_count && ` · ${s.wolf_count} Wolf/Wölfe`}
                    </div>
                    {s.description && <p className="text-sm text-gray-300 mt-1">{s.description}</p>}
                    {s.photos?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {s.photos.map((p, i) => <img key={i} src={p} alt="" className="w-12 h-12 object-cover rounded" />)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RISSE */}
        {activeTab === "risse" && (
          <div className="space-y-3">
            {risse.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">⚠️</div><div>Keine Riss-Ereignisse erfasst</div>
              </div>
            ) : risse.map(r => (
              <div key={r.id} className="p-3 rounded-xl" style={{ background: "#2a2a2a", border: "1px solid #cc220033" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-red-300">{r.animal_species}</span>
                      <WolfStatusBadge status={r.status} />
                      {r.wolf_confirmed && <span className="text-xs px-2 py-0.5 rounded-full bg-red-900 text-red-300">Wolf bestätigt</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {r.incident_date} · {r.location_name}
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                      {r.animal_count_dead > 0 && `${r.animal_count_dead} tot `}
                      {r.animal_count_injured > 0 && `${r.animal_count_injured} verletzt`}
                    </div>
                    {r.owner_name && <div className="text-xs text-gray-400">Tierhalter: {r.owner_name}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PROBEN */}
        {activeTab === "proben" && (
          <WolfSamplesTab samples={samples} tenantId={tenantId} onRefresh={refetchAll} />
        )}

        {/* JAGD */}
        {activeTab === "jagd" && (
          <div className="space-y-3">
            {hunts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">🎯</div><div>Keine Jagdeinträge erfasst</div>
              </div>
            ) : hunts.map(h => (
              <div key={h.id} className="p-3 rounded-xl" style={{ background: "#2a2a2a", border: h.result === "Erlegt" ? "1px solid #ef4444" : "1px solid #3a3a3a" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">{h.hunt_type}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        background: h.result === "Erlegt" ? "#7f1d1d" : h.result === "Gesichtet" ? "#1a3a1a" : "#1a1a1a",
                        color: h.result === "Erlegt" ? "#fca5a5" : h.result === "Gesichtet" ? "#86efac" : "#9ca3af"
                      }}>{h.result}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{h.hunt_date} · {h.location_name}</div>
                    {h.result === "Erlegt" && (
                      <Button size="sm" variant="outline" className="mt-2 text-xs border-red-800 text-red-400"
                        onClick={() => setMeldepflichtHunt(h)}>
                        ⚠️ Meldepflicht anzeigen
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* KAMERAS */}
        {activeTab === "kameras" && (
          <WolfCamerasTab cameras={cameras} tenantId={tenantId} onRefresh={refetchAll} />
        )}

        {/* BERICHTE */}
        {activeTab === "berichte" && (
          <WolfReportsTab reports={reports} sightings={sightings} risse={risse} samples={samples} hunts={hunts} contacts={contacts} tenantId={tenantId} onRefresh={refetchAll} />
        )}

        {/* TERRITORIEN */}
        {activeTab === "territorien" && (
          <div className="space-y-3">
            {territories.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">🗺</div><div>Keine Territorien erfasst</div>
              </div>
            ) : territories.map(t => (
              <div key={t.id} className="p-3 rounded-xl" style={{ background: "#2a2a2a", border: "1px solid #3a3a3a" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{t.territory_name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#1a3a1a", color: "#86efac" }}>{t.territory_status}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{t.federal_state} · ~{t.wolf_count_estimated || "?"} Wölfe</div>
                    {t.last_confirmed && <div className="text-xs text-gray-500">Zuletzt bestätigt: {t.last_confirmed}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && formMap[showForm] && (
        <Dialog open={!!showForm} onOpenChange={() => setShowForm(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: "#2a2a2a", border: "1px solid #3a3a3a" }}>
            <DialogHeader>
              <DialogTitle>
                {showForm === "sichtung" && "👁️ Neue Sichtung erfassen"}
                {showForm === "riss" && "⚠️ Riss erfassen"}
                {showForm === "jagd" && "🎯 Jagdeintrag erfassen"}
                {showForm === "territorium" && "🗺 Territorium erfassen"}
              </DialogTitle>
            </DialogHeader>
            {formMap[showForm]}
          </DialogContent>
        </Dialog>
      )}

      {/* Meldepflicht Modal */}
      <MeldepflichtModal
        hunt={meldepflichtHunt}
        contacts={contacts}
        onClose={() => setMeldepflichtHunt(null)}
        onCreateSample={() => { setMeldepflichtHunt(null); setActiveTab("proben"); setShowForm(null); }}
      />
    </div>
  );
}