import React, { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import RevierMapCore from "@/components/map/RevierMapCore";
import EinrichtungenLayer from "@/components/map/layers/EinrichtungenLayer";
import WildmanagementLayer from "@/components/map/layers/WildmanagementLayer";
import BoundaryLayer, { REVIER_COLORS } from "@/components/map/layers/BoundaryLayer";
import BoundaryDrawer, { BoundaryDrawerControls } from "@/components/map/BoundaryDrawer";
import WindLayer from "@/components/map/layers/WindLayer";
import JagdWetterWidget from "@/components/map/JagdWetterWidget";
import EinrichtungForm from "@/components/map/EinrichtungForm";
import MapActionSheet from "@/components/map/MapActionSheet";
import { Plus, X } from "lucide-react";

export default function MobileMap() {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  const [activeLayers] = useState(new Set(["einrichtungen", "sichtungen"]));
  const [selectedRevierId, setSelectedRevierId] = useState(null);
  const [windData, setWindData] = useState({ deg: null, speed: 0 });
  const [userPos, setUserPos] = useState(null);
  const [showWeather, setShowWeather] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);


  // Einrichtung state
  const [einrichtungMode, setEinrichtungMode] = useState(false); // waiting for map click
  const [einrichtungCoords, setEinrichtungCoords] = useState(null);
  const [showEinrichtungForm, setShowEinrichtungForm] = useState(false);

  // Boundary drawing state
  const [drawingBoundary, setDrawingBoundary] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState([]);
  const [showAssignBoundary, setShowAssignBoundary] = useState(false);
  const [boundaryColor, setBoundaryColor] = useState("#22c55e");
  const [assignRevierIdForBoundary, setAssignRevierIdForBoundary] = useState("");
  const [savingBoundary, setSavingBoundary] = useState(false);
  const [newRevierName, setNewRevierName] = useState("");
  const [showNewRevierInput, setShowNewRevierInput] = useState(false);

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant.id }),
    enabled: !!tenant?.id,
    onSuccess: (data) => {
      if (!selectedRevierId && data.length > 0) setSelectedRevierId(data[0].id);
    },
  });

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

  // Saved boundaries for drawing tool
  const boundaries = reviere
    .filter(r => r.boundary_geojson)
    .map((r, i) => {
      try {
        const geo = typeof r.boundary_geojson === "string" ? JSON.parse(r.boundary_geojson) : r.boundary_geojson;
        const coords = geo.features?.[0]?.geometry?.coordinates?.[0]?.map(c => [c[1], c[0]])
          || geo.coordinates?.[0]?.map(c => [c[1], c[0]])
          || [];
        return { revierId: r.id, revierName: r.name, coords, color: REVIER_COLORS[i % REVIER_COLORS.length] };
      } catch { return null; }
    })
    .filter(Boolean);

  const handleMapClick = useCallback((e) => {
    if (einrichtungMode) {
      setEinrichtungCoords([e.latlng.lat, e.latlng.lng]);
      setEinrichtungMode(false);
      setShowEinrichtungForm(true);
    }
  }, [einrichtungMode]);

  const handleAction = (key) => {
    if (key === "einrichtung") {
      setEinrichtungMode(true);
    } else if (key === "boundary") {
      setDrawingBoundary(true);
      setBoundaryPoints([]);
    }
  };

  const handleSaveBoundary = async () => {
    if (!assignRevierIdForBoundary || boundaryPoints.length < 3) return;
    setSavingBoundary(true);
    const geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[...boundaryPoints.map(p => [p[1], p[0]]), [boundaryPoints[0][1], boundaryPoints[0][0]]]],
        },
        properties: { color: boundaryColor },
      }],
    };
    await base44.entities.Revier.update(assignRevierIdForBoundary, { boundary_geojson: JSON.stringify(geojson) });
    queryClient.invalidateQueries(["reviere", tenant?.id]);
    setSavingBoundary(false);
    setDrawingBoundary(false);
    setShowAssignBoundary(false);
    setBoundaryPoints([]);
    setAssignRevierIdForBoundary("");
  };

  const cancelBoundary = () => {
    setDrawingBoundary(false);
    setShowAssignBoundary(false);
    setBoundaryPoints([]);
    setAssignRevierIdForBoundary("");
    setNewRevierName("");
    setShowNewRevierInput(false);
  };

  const handleCreateNewRevier = async () => {
    if (!newRevierName.trim()) return;
    const newRevier = await base44.entities.Revier.create({ tenant_id: tenant.id, name: newRevierName.trim() });
    queryClient.invalidateQueries(["reviere", tenant?.id]);
    setAssignRevierIdForBoundary(newRevier.id);
    setNewRevierName("");
    setShowNewRevierInput(false);
  };

  if (!selectedRevier) {
    return (
      <div className="fixed inset-0 top-0 bottom-20 bg-[#2d2d2d] flex items-center justify-center">
        <p className="text-gray-400">Kein Revier verfügbar</p>
      </div>
    );
  }

  return (
    <>
      {/* Revier Selector – oben mittig */}
      {!drawingBoundary && !showAssignBoundary && !einrichtungMode && reviere.length > 1 && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999]">
          <button
            onClick={() => setShowRevierPicker(p => !p)}
            className="flex items-center gap-2 bg-[#1e1e1e]/90 backdrop-blur-md border border-[#3a3a3a] rounded-2xl px-4 py-2 shadow-lg"
          >
            <span className="text-sm font-semibold text-gray-100 max-w-[160px] truncate">
              {selectedRevier?.name || "Revier wählen"}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showRevierPicker ? "rotate-180" : ""}`} />
          </button>

          {showRevierPicker && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#1e1e1e]/95 backdrop-blur-md border border-[#3a3a3a] rounded-2xl overflow-hidden shadow-xl min-w-[200px]">
              {reviere.map(r => (
                <button
                  key={r.id}
                  onClick={() => { setSelectedRevierId(r.id); setShowRevierPicker(false); }}
                  className={`w-full text-left px-4 py-3 text-sm border-b border-[#2a2a2a] last:border-0 transition-colors ${
                    r.id === selectedRevierId
                      ? "text-[#22c55e] font-semibold bg-[#22c55e]/10"
                      : "text-gray-200 hover:bg-[#2a2a2a]"
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Einrichtung mode hint banner */}
      {einrichtungMode && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999] bg-[#22c55e] text-black text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3"
          style={{ zIndex: 9999 }}
        >
          <span>📍 Auf Karte tippen um Standort zu setzen</span>
          <button onClick={() => setEinrichtungMode(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="fixed inset-0 bottom-20" style={{ zIndex: 10 }}>
        <div className="absolute inset-0">
          <RevierMapCore
            revier={selectedRevier}
            height="100%"
            className="!rounded-none !border-0 !shadow-none"
            onUserLocation={(pos) => setUserPos(pos)}
            onWeatherButtonClick={() => setShowWeather(true)}
            onMapClick={handleMapClick}
          >
            {reviere.map((r, i) => (
              <BoundaryLayer key={r.id} revier={r} color={REVIER_COLORS[i % REVIER_COLORS.length]} />
            ))}
            {activeLayers.has("einrichtungen") && <EinrichtungenLayer items={einrichtungen} />}
            {activeLayers.has("sichtungen") && <WildmanagementLayer items={wildmanagement} />}
            {windData.deg !== null && <WindLayer windDeg={windData.deg} windSpeed={windData.speed} />}

            {/* Boundary drawing layer */}
            <BoundaryDrawer
              drawing={drawingBoundary}
              points={boundaryPoints}
              onPoint={(p) => setBoundaryPoints(prev => [...prev, p])}
              boundaries={[]}
              boundaryColor={boundaryColor}
            />
          </RevierMapCore>
        </div>

        {showWeather && (
          <JagdWetterWidget
            lat={userPos?.[0] ?? 51.1657}
            lng={userPos?.[1] ?? 10.4515}
            onWeatherLoaded={(deg, speed) => setWindData({ deg, speed })}
            onClose={() => setShowWeather(false)}
          />
        )}

        {/* Boundary drawing controls */}
        {(drawingBoundary || showAssignBoundary) && (
          <div className="absolute bottom-2 left-0 right-0 px-4" style={{ zIndex: 1000 }}>
            <div className="bg-[#1e1e1e]/95 backdrop-blur-md border border-[#3a3a3a] rounded-2xl p-4 space-y-3">
              {drawingBoundary && !showAssignBoundary && (
                <>
                  <p className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse inline-block" />
                    Reviergrenze zeichnen
                  </p>
                  <p className="text-xs text-gray-400">{boundaryPoints.length} Punkte gesetzt – auf die Karte tippen</p>
                  <div className="flex gap-2">
                    <button
                      disabled={boundaryPoints.length === 0}
                      onClick={() => setBoundaryPoints(prev => prev.slice(0, -1))}
                      className="flex-1 text-sm px-3 py-2.5 rounded-xl border border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a] disabled:opacity-40"
                    >
                      Rückgängig
                    </button>
                    <button
                      disabled={boundaryPoints.length < 3}
                      onClick={() => { setDrawingBoundary(false); setShowAssignBoundary(true); }}
                      className="flex-1 text-sm px-3 py-2.5 rounded-xl bg-[#22c55e] text-black font-semibold disabled:opacity-40"
                    >
                      Fertig ({boundaryPoints.length})
                    </button>
                    <button onClick={cancelBoundary} className="px-3 py-2.5 rounded-xl border border-[#3a3a3a] text-gray-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

              {showAssignBoundary && (
                <>
                  <p className="text-sm font-semibold text-gray-200">Revier zuweisen</p>

                  {/* Farbe wählen */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Grenzfarbe</p>
                    <div className="flex gap-2 flex-wrap">
                      {["#22c55e","#ef4444","#3b82f6","#f59e0b","#a855f7","#ffffff"].map(c => (
                        <button
                          key={c}
                          onClick={() => setBoundaryColor(c)}
                          className="w-8 h-8 rounded-full border-2 transition-transform active:scale-90"
                          style={{ background: c, borderColor: boundaryColor === c ? "#fff" : "transparent", boxShadow: boundaryColor === c ? "0 0 0 2px #22c55e" : "none" }}
                        />
                      ))}
                      <input
                        type="color"
                        value={boundaryColor}
                        onChange={e => setBoundaryColor(e.target.value)}
                        className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent p-0"
                        title="Eigene Farbe"
                      />
                    </div>
                  </div>

                  <select
                    value={assignRevierIdForBoundary}
                    onChange={e => setAssignRevierIdForBoundary(e.target.value)}
                    className="w-full text-sm bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-3 py-2.5 text-gray-100 focus:outline-none"
                  >
                    <option value="">— Revier wählen —</option>
                    {reviere.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>

                  {!showNewRevierInput ? (
                    <button
                      onClick={() => setShowNewRevierInput(true)}
                      className="w-full text-sm px-3 py-2.5 rounded-xl border border-dashed border-[#22c55e]/50 text-[#22c55e] hover:bg-[#22c55e]/10 transition-colors"
                    >
                      + Neues Revier erstellen
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Reviername..."
                        value={newRevierName}
                        onChange={e => setNewRevierName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleCreateNewRevier()}
                        className="flex-1 text-sm bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-3 py-2.5 text-gray-100 focus:outline-none focus:border-[#22c55e]"
                      />
                      <button
                        onClick={handleCreateNewRevier}
                        disabled={!newRevierName.trim()}
                        className="px-3 py-2.5 rounded-xl bg-[#22c55e] text-black font-semibold disabled:opacity-40"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => { setShowNewRevierInput(false); setNewRevierName(""); }}
                        className="px-3 py-2.5 rounded-xl border border-[#3a3a3a] text-gray-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={cancelBoundary} className="flex-1 text-sm px-3 py-2.5 rounded-xl border border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a]">
                      Abbrechen
                    </button>
                    <button
                      disabled={!assignRevierIdForBoundary || savingBoundary}
                      onClick={handleSaveBoundary}
                      className="flex-1 text-sm px-3 py-2.5 rounded-xl bg-[#22c55e] text-black font-semibold disabled:opacity-40"
                    >
                      {savingBoundary ? "Speichern..." : "Speichern"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FAB – verstecken wenn Drawing-Modus aktiv */}
      {!drawingBoundary && !showAssignBoundary && !einrichtungMode && (
        <button
          style={{ zIndex: 9999 }}
          className="fixed bottom-24 right-4 w-14 h-14 bg-[#22c55e] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          onClick={() => setShowActionSheet(true)}
        >
          <Plus className="w-7 h-7 text-black stroke-[2.5]" />
        </button>
      )}

      {showActionSheet && (
        <MapActionSheet
          onClose={() => setShowActionSheet(false)}
          onSelect={(key) => {
            setShowActionSheet(false);
            handleAction(key);
          }}
        />
      )}

      {/* Einrichtung Form Dialog */}
      <EinrichtungForm
        isOpen={showEinrichtungForm}
        onClose={() => { setShowEinrichtungForm(false); setEinrichtungCoords(null); }}
        revierId={selectedRevier?.id}
        tenantId={tenant?.id}
        lat={einrichtungCoords?.[0]}
        lng={einrichtungCoords?.[1]}
      />
    </>
  );
}