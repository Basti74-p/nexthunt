/**
 * RevierMap – Karten-Tab im Revier.
 * Verwendet die zentrale RevierMapCore-Basis mit allen verfügbaren Layern.
 */
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import RevierMapCore from "@/components/map/RevierMapCore";
import EinrichtungenLayer from "@/components/map/layers/EinrichtungenLayer";
import WildmanagementLayer from "@/components/map/layers/WildmanagementLayer";
import BoundaryLayer, { REVIER_COLORS } from "@/components/map/layers/BoundaryLayer";
import EinrichtungForm from "@/components/map/EinrichtungForm";
import AddMapFeatureButton from "@/components/revier/AddMapFeatureButton";
import { BoundaryEditorLayer, BoundaryEditorControls } from "@/components/map/BoundaryEditor";
import { useMobile } from "@/components/hooks/useMobile";
import { Building2, Eye, Map as MapIcon, Pencil } from "lucide-react";
import { calcFlaecheHa } from "@/lib/revierArea";

const LAYERS = [
  { id: "einrichtungen", label: "Jagdeinrichtungen", icon: Building2 },
  { id: "sichtungen", label: "Sichtungen", icon: Eye },
];

export default function RevierMap({ revier }) {
  const [activeLayers, setActiveLayers] = useState(new Set(["einrichtungen", "sichtungen"]));
  const [showEinrichtungForm, setShowEinrichtungForm] = useState(false);
  const [clickedCoords, setClickedCoords] = useState(null);
  const [selectedEinrichtung, setSelectedEinrichtung] = useState(null);
  const [editingBoundary, setEditingBoundary] = useState(false);
  const [editCoords, setEditCoords] = useState([]);
  const [savingBoundary, setSavingBoundary] = useState(false);
  const isMobile = useMobile();
  const queryClient = useQueryClient();

  const deleteEinrichtung = useMutation({
    mutationFn: (id) => base44.entities.Jagdeinrichtung.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["einrichtungen", revier.id]),
  });

  const { data: einrichtungen = [] } = useQuery({
    queryKey: ["einrichtungen", revier.id],
    queryFn: () => base44.entities.Jagdeinrichtung.filter({ revier_id: revier.id }),
  });

  const { data: wildmanagement = [] } = useQuery({
    queryKey: ["wildmanagement", revier.id],
    queryFn: () => base44.entities.WildManagement.filter({ revier_id: revier.id }),
  });

  const toggleLayer = (id) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setClickedCoords({ lat, lng });
    setShowEinrichtungForm(true);
  };

  const handleAddEinrichtung = () => {
    // Default coordinates if no click
    setSelectedEinrichtung(null);
    setClickedCoords({ lat: revier.latitude || 51.1657, lng: revier.longitude || 10.4515 });
    setShowEinrichtungForm(true);
  };

  const handleEditEinrichtung = (einrichtung) => {
    setSelectedEinrichtung(einrichtung);
    setClickedCoords(null);
    setShowEinrichtungForm(true);
  };

  // Parse existing boundary coords from GeoJSON
  const startEditBoundary = () => {
    if (!revier.boundary_geojson) return;
    try {
      const gj = typeof revier.boundary_geojson === "string"
        ? JSON.parse(revier.boundary_geojson)
        : revier.boundary_geojson;
      let rawCoords;
      if (gj.type === "FeatureCollection") rawCoords = gj.features?.[0]?.geometry?.coordinates?.[0];
      else if (gj.type === "Feature") rawCoords = gj.geometry?.coordinates?.[0];
      else rawCoords = gj.coordinates?.[0];
      if (!rawCoords?.length) return;
      // GeoJSON is [lng, lat], convert to [lat, lng]
      const coords = rawCoords.map(([lng, lat]) => [lat, lng]);
      // Remove closing point if it's the same as the first
      const last = coords[coords.length - 1];
      const first = coords[0];
      const cleaned = (last[0] === first[0] && last[1] === first[1]) ? coords.slice(0, -1) : coords;
      setEditCoords(cleaned);
      setEditingBoundary(true);
    } catch (e) {
      console.error("Boundary parse error", e);
    }
  };

  const saveBoundary = async () => {
    setSavingBoundary(true);
    try {
      // Convert [lat, lng] back to GeoJSON [lng, lat]
      const geoCoords = [...editCoords, editCoords[0]].map(([lat, lng]) => [lng, lat]);
      const existingGj = revier.boundary_geojson
        ? (typeof revier.boundary_geojson === "string" ? JSON.parse(revier.boundary_geojson) : revier.boundary_geojson)
        : {};
      const color = existingGj.color || "#22c55e";
      const geojson = {
        type: "Feature",
        color,
        geometry: { type: "Polygon", coordinates: [geoCoords] },
      };
      // Calculate area
      let flaeche_ha = null;
      try { flaeche_ha = await calcFlaecheHa(JSON.stringify(geojson)); } catch {}
      await base44.entities.Revier.update(revier.id, {
        boundary_geojson: JSON.stringify(geojson),
        ...(flaeche_ha !== null ? { flaeche_ha } : {}),
      });
      queryClient.invalidateQueries(["revier", revier.id]);
      queryClient.invalidateQueries(["reviere"]);
      setEditingBoundary(false);
    } finally {
      setSavingBoundary(false);
    }
  };

  const deleteBoundary = async () => {
    if (!window.confirm("Reviergrenze wirklich löschen?")) return;
    await base44.entities.Revier.update(revier.id, { boundary_geojson: null, flaeche_ha: null });
    queryClient.invalidateQueries(["revier", revier.id]);
    queryClient.invalidateQueries(["reviere"]);
    setEditingBoundary(false);
  };

  return (
    <div className={isMobile ? "fixed inset-0 top-14 bottom-20 bg-white flex flex-col z-40" : "space-y-3"}>
      {/* Layer toggles */}
      {isMobile ? (
        <div className={`bg-[#2d2d2d] border-b border-gray-700 px-4 py-3 space-y-3`}>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Layer:</p>
            <div className="flex gap-2 flex-wrap">
              {LAYERS.map(l => (
                <button
                  key={l.id}
                  onClick={() => toggleLayer(l.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border font-medium transition-all text-sm ${
                    activeLayers.has(l.id)
                      ? "bg-[#22c55e] text-black border-[#22c55e]"
                      : "bg-[#1a1a1a] text-gray-400 border-gray-600 hover:border-gray-500"
                  }`}
                >
                  <l.icon className="w-4 h-4" />
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Layer:</span>
          {LAYERS.map(l => (
            <button
              key={l.id}
              onClick={() => toggleLayer(l.id)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                activeLayers.has(l.id)
                  ? "bg-[#0F2F23] text-white border-[#0F2F23]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              <l.icon className="w-3.5 h-3.5" />
              {l.label}
            </button>
          ))}
        </div>
      )}

      {/* Central map */}
      <div className={isMobile ? "flex-1 overflow-hidden relative" : "relative"}>
        <RevierMapCore
          revier={revier}
          height={isMobile ? "100%" : "520px"}
          onMapClick={editingBoundary ? undefined : handleMapClick}
        >
          {editingBoundary ? (
            <BoundaryEditorLayer
              coords={editCoords}
              color="#22c55e"
              onChange={setEditCoords}
            />
          ) : (
            <BoundaryLayer revier={revier} color={REVIER_COLORS[0]} />
          )}
          {!editingBoundary && activeLayers.has("einrichtungen") && <EinrichtungenLayer items={einrichtungen} onDelete={(id) => deleteEinrichtung.mutate(id)} onEdit={handleEditEinrichtung} />}
          {!editingBoundary && activeLayers.has("sichtungen") && <WildmanagementLayer items={wildmanagement} />}
        </RevierMapCore>

        {/* Edit boundary button */}
        {!editingBoundary && revier.boundary_geojson && (
          <button
            onClick={startEditBoundary}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e1e]/90 border border-[#444] text-gray-200 text-xs font-semibold rounded-xl shadow-lg hover:border-[#22c55e] hover:text-[#22c55e] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Grenze bearbeiten
          </button>
        )}

        {/* Boundary editor controls */}
        {editingBoundary && (
          <BoundaryEditorControls
            coords={editCoords}
            color="#22c55e"
            onSave={saveBoundary}
            onDelete={deleteBoundary}
            onCancel={() => setEditingBoundary(false)}
            saving={savingBoundary}
          />
        )}

        {/* FAB Button */}
        {!editingBoundary && (
          <AddMapFeatureButton
            onAddEinrichtung={handleAddEinrichtung}
            onAddBoundary={() => {}}
          />
        )}
      </div>

      {/* Einrichtung Form Dialog */}
      <EinrichtungForm
        isOpen={showEinrichtungForm}
        onClose={() => {
          setShowEinrichtungForm(false);
          setClickedCoords(null);
          setSelectedEinrichtung(null);
        }}
        revierId={revier.id}
        tenantId={revier.tenant_id}
        lat={clickedCoords?.lat}
        lng={clickedCoords?.lng}
        einrichtung={selectedEinrichtung}
      />

      {!isMobile && (
        <p className="text-xs text-gray-400 text-center">
          {einrichtungen.filter(e => e.latitude).length} Einrichtungen · {wildmanagement.filter(w => w.latitude).length} Sichtungen auf der Karte
        </p>
      )}
    </div>
  );
}