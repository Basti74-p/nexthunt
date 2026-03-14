import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import RevierMapCore from "@/components/map/RevierMapCore";
import EinrichtungenLayer from "@/components/map/layers/EinrichtungenLayer";
import WildmanagementLayer from "@/components/map/layers/WildmanagementLayer";
import BoundaryDrawer, { BoundaryDrawerControls } from "@/components/map/BoundaryDrawer";
import EinrichtungForm from "@/components/map/EinrichtungForm";
import { Building2, Eye, Map as MapIcon, Plus, Pencil } from "lucide-react";

const LAYERS = [
  { id: "einrichtungen", label: "Jagdeinrichtungen", icon: Building2 },
  { id: "sichtungen", label: "Sichtungen", icon: Eye },
];

export default function Karte() {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  const [activeLayers, setActiveLayers] = useState(new Set(["einrichtungen", "sichtungen"]));
  const [selectedRevierId, setSelectedRevierId] = useState(null);

  // Boundary drawer state
  const [drawing, setDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState([]);
  const [showAssign, setShowAssign] = useState(false);
  const [assignRevierId, setAssignRevierId] = useState("");
  const [saving, setSaving] = useState(false);
  const [boundaryColor, setBoundaryColor] = useState("#22c55e");
  // boundaries state passed from BoundaryDrawer via ref pattern – we use queryClient to reload reviere
  const [boundariesState, setBoundariesState] = useState([]);
  const [showEinrichtungForm, setShowEinrichtungForm] = useState(false);
  const [formCoords, setFormCoords] = useState({ lat: null, lng: null });
  const [highlightedRevierId, setHighlightedRevierId] = useState(null);
  const [placingEinrichtung, setPlacingEinrichtung] = useState(false);

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant.id }),
    enabled: !!tenant?.id,
    onSuccess: (data) => {
      const b = data
        .filter(r => r.boundary_geojson)
        .map(r => {
          try {
            const gj = JSON.parse(r.boundary_geojson);
            let rawCoords;
            if (gj.type === "FeatureCollection") {
              rawCoords = gj.features?.[0]?.geometry?.coordinates?.[0];
            } else {
              rawCoords = gj.coordinates?.[0];
            }
            if (!rawCoords) return null;
            const coords = rawCoords.map(([lng, lat]) => [lat, lng]);
            return { revierId: r.id, revierName: r.name, coords };
          } catch { return null; }
        })
        .filter(Boolean);
      setBoundariesState(b);
    },
  });

  // Also compute boundaries from reviere directly — supports both Polygon and FeatureCollection format
  const boundaries = reviere
    .filter(r => r.boundary_geojson)
    .map(r => {
      try {
        const gj = JSON.parse(r.boundary_geojson);
        let rawCoords, color;
        if (gj.type === "FeatureCollection") {
          const feat = gj.features?.[0];
          rawCoords = feat?.geometry?.coordinates?.[0];
          color = feat?.properties?.color || "#22c55e";
        } else {
          rawCoords = gj.coordinates?.[0];
          color = gj.color || "#22c55e";
        }
        if (!rawCoords) return null;
        const coords = rawCoords.map(([lng, lat]) => [lat, lng]);
        return { revierId: r.id, revierName: r.name, coords, color };
      } catch { return null; }
    })
    .filter(Boolean);

  const selectedRevier = reviere.find(r => r.id === selectedRevierId) || reviere[0] || null;

  const { data: einrichtungen = [] } = useQuery({
    queryKey: ["einrichtungen-map", tenant?.id],
    queryFn: () => base44.entities.Jagdeinrichtung.filter({ tenant_id: tenant.id }),
    enabled: !!tenant?.id,
  });

  const { data: wildmanagement = [] } = useQuery({
    queryKey: ["wildmanagement-map", selectedRevier?.id],
    queryFn: () => base44.entities.WildManagement.filter({ revier_id: selectedRevier.id }),
    enabled: !!selectedRevier?.id,
  });

  const toggleLayer = (id) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const resetCursor = () => { const el = document.querySelector('.leaflet-container'); if (el) el.style.cursor = ''; };

  // Boundary drawing handlers
  const handleStart = () => {
    setDrawing(true); setDrawnPoints([]);
    const el = document.querySelector('.leaflet-container');
    if (el) el.style.cursor = 'crosshair';
  };
  const handleFinish = () => {
    if (drawnPoints.length < 3) return;
    setDrawing(false); setShowAssign(true); resetCursor();
    if (reviere.length === 1) setAssignRevierId(reviere[0].id);
  };
  const handleUndo = () => setDrawnPoints(prev => prev.slice(0, -1));
  const handleCancel = () => { setDrawing(false); setDrawnPoints([]); setShowAssign(false); setAssignRevierId(""); resetCursor(); };
  const handleSave = async () => {
    if (!assignRevierId || drawnPoints.length < 3) return;
    setSaving(true);
    const coords = [...drawnPoints, drawnPoints[0]].map(([lat, lng]) => [lng, lat]);
    const geojson = JSON.stringify({ type: "Polygon", coordinates: [coords], color: boundaryColor });
    await base44.entities.Revier.update(assignRevierId, { boundary_geojson: geojson });
    setSaving(false);
    setShowAssign(false);
    setDrawnPoints([]);
    setAssignRevierId("");
    queryClient.invalidateQueries(["reviere", tenant?.id]);
  };
  const handleDeleteBoundary = async (revierId) => {
    await base44.entities.Revier.update(revierId, { boundary_geojson: null });
    queryClient.invalidateQueries(["reviere", tenant?.id]);
  };

  const handleCreateNewRevier = async (name) => {
    const newRevier = await base44.entities.Revier.create({ tenant_id: tenant.id, name, status: "active" });
    queryClient.invalidateQueries(["reviere", tenant?.id]);
    return newRevier.id;
  };

  const handleMapClick = (e) => {
    if (drawing || showAssign) return;
    if (placingEinrichtung && e.latlng) {
      setFormCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      setShowEinrichtungForm(true);
      setPlacingEinrichtung(false);
      const el = document.querySelector('.leaflet-container');
      if (el) el.style.cursor = '';
    }
  };

  const handleStartPlacingEinrichtung = () => {
    setPlacingEinrichtung(true);
    const el = document.querySelector('.leaflet-container');
    if (el) el.style.cursor = 'crosshair';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <MapIcon className="w-5 h-5 text-[#22c55e]" />
          <h1 className="text-xl font-bold text-gray-100">Karte</h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {reviere.length > 1 && (
            <select
              value={selectedRevier?.id || ""}
              onChange={e => setSelectedRevierId(e.target.value)}
              className="text-sm bg-[#2d2d2d] border border-[#3a3a3a] text-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#22c55e]"
            >
              {reviere.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Layer:</span>
            {LAYERS.map(l => (
              <button
                key={l.id}
                onClick={() => toggleLayer(l.id)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                  activeLayers.has(l.id)
                    ? "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/40"
                    : "bg-[#2d2d2d] text-gray-500 border-[#3a3a3a] hover:border-gray-500"
                }`}
              >
                <l.icon className="w-3.5 h-3.5" />
                {l.label}
              </button>
            ))}
            <button
               onClick={handleStartPlacingEinrichtung}
               className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                 placingEinrichtung
                   ? "bg-yellow-500 text-black border border-yellow-400"
                   : "bg-[#22c55e] text-black hover:bg-[#16a34a]"
               }`}
             >
               <Plus className="w-3.5 h-3.5" />
               {placingEinrichtung ? "Klick auf Karte..." : "Einrichtung"}
             </button>
             <button
               onClick={handleStart}
               className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-[#22c55e] text-black font-medium hover:bg-[#16a34a] transition-all"
             >
               <Pencil className="w-3.5 h-3.5" />
               Reviergrenze
             </button>
          </div>
        </div>
      </div>

      {selectedRevier ? (
        <>
          <div className="relative">
            <RevierMapCore revier={selectedRevier} height="calc(100vh - 180px)" onMapClick={handleMapClick}>
              {activeLayers.has("einrichtungen") && <EinrichtungenLayer items={einrichtungen} />}
              {activeLayers.has("sichtungen") && <WildmanagementLayer items={wildmanagement} />}
              <BoundaryDrawer
                reviere={reviere}
                drawing={drawing}
                points={drawnPoints}
                onPoint={(p) => setDrawnPoints(prev => [...prev, p])}
                boundaries={boundaries}
                previewColor={boundaryColor}
                highlightedRevierId={highlightedRevierId}
              />
            </RevierMapCore>

            <BoundaryDrawerControls
              drawing={drawing}
              points={drawnPoints}
              onStart={handleStart}
              onFinish={handleFinish}
              onUndo={handleUndo}
              onCancel={handleCancel}
              showAssign={showAssign}
              reviere={reviere}
              selectedRevierId={assignRevierId}
              onSelectRevier={setAssignRevierId}
              onSave={handleSave}
              saving={saving}
              boundaries={boundaries}
              onDeleteBoundary={handleDeleteBoundary}
              boundaryColor={boundaryColor}
              onColorChange={setBoundaryColor}
              onCreateNewRevier={handleCreateNewRevier}
              highlightedRevierId={highlightedRevierId}
              onHighlightRevier={setHighlightedRevierId}
            />
          </div>
          <p className="text-xs text-gray-500 text-center">
            {einrichtungen.filter(e => e.latitude).length} Einrichtungen · {wildmanagement.filter(w => w.latitude).length} Sichtungen · {selectedRevier.name}
          </p>

          <EinrichtungForm
           isOpen={showEinrichtungForm}
           onClose={() => setShowEinrichtungForm(false)}
           revierId={selectedRevier?.id}
           tenantId={tenant?.id}
           lat={formCoords.lat}
           lng={formCoords.lng}
          />
          </>
          ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
          Kein Revier verfügbar
          </div>
          )}
          </div>
          );
          }