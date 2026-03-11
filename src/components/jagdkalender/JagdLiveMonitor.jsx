import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin, Crosshair, Truck, Search as SearchIcon,
  CheckCircle, Clock, AlertTriangle, Radio, Plus, Map
} from "lucide-react";
import { format } from "date-fns";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";

const MELDUNG_TYPEN = [
  { value: "schuss", label: "Schuss abgegeben", icon: Crosshair, color: "bg-amber-700 hover:bg-amber-600" },
  { value: "erlegt", label: "Wild erlegt", icon: Crosshair, color: "bg-green-700 hover:bg-green-600" },
  { value: "bergung_angefordert", label: "Bergung anfordern", icon: Truck, color: "bg-orange-700 hover:bg-orange-600" },
  { value: "nachsuche_angefordert", label: "Nachsuche anfordern", icon: SearchIcon, color: "bg-red-700 hover:bg-red-600" },
  { value: "stand_bezogen", label: "Stand bezogen", icon: MapPin, color: "bg-blue-700 hover:bg-blue-600" },
  { value: "sonstiges", label: "Sonstige Meldung", icon: Radio, color: "bg-gray-700 hover:bg-gray-600" },
];

const WILDARTEN = ["rotwild", "schwarzwild", "rehwild", "damwild", "sikawild", "niederwild", "raubwild", "sonstiges"];
const WILDART_LABELS = { rotwild: "Rotwild", schwarzwild: "Schwarzwild", rehwild: "Rehwild", damwild: "Damwild", sikawild: "Sikawild", niederwild: "Niederwild", raubwild: "Raubwild", sonstiges: "Sonstiges" };

const TYP_LABEL = {
  schuss: "Schuss", erlegt: "Erlegt ✓", sichtung: "Sichtung",
  bergung_angefordert: "Bergung angefordert", bergung_erledigt: "Bergung erledigt",
  nachsuche_angefordert: "Nachsuche angefordert", nachsuche_laeuft: "Nachsuche läuft",
  nachsuche_erledigt: "Nachsuche erledigt", stand_bezogen: "Stand bezogen",
  stand_verlassen: "Stand verlassen", jagd_start: "Jagd gestartet",
  jagd_ende: "Jagd beendet", sonstiges: "Sonstige Meldung",
};

const TYP_COLOR = {
  schuss: "border-amber-700 bg-amber-900/20",
  erlegt: "border-green-700 bg-green-900/20",
  bergung_angefordert: "border-orange-700 bg-orange-900/20",
  nachsuche_angefordert: "border-red-700 bg-red-900/20",
  stand_bezogen: "border-blue-700 bg-blue-900/20",
  default: "border-[#2d2d2d] bg-[#1e1e1e]",
};

// Custom Leaflet icons (data URIs to avoid asset issues)
const standIcon = new L.DivIcon({
  html: `<div style="background:#3b82f6;border:2px solid white;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;font-weight:bold;">S</div>`,
  className: "", iconSize: [18, 18], iconAnchor: [9, 9],
});
const erlegtIcon = new L.DivIcon({
  html: `<div style="background:#22c55e;border:2px solid white;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;">✓</div>`,
  className: "", iconSize: [20, 20], iconAnchor: [10, 10],
});
const schussIcon = new L.DivIcon({
  html: `<div style="background:#d97706;border:2px solid white;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:10px;">!</div>`,
  className: "", iconSize: [18, 18], iconAnchor: [9, 9],
});

export default function JagdLiveMonitor({ jagd, canManage }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showMeldung, setShowMeldung] = useState(false);
  const [meldungTyp, setMeldungTyp] = useState(null);
  const [meldungForm, setMeldungForm] = useState({ wildart: "", nachricht: "", latitude: "", longitude: "" });
  const [showMap, setShowMap] = useState(false);

  const { data: meldungen = [] } = useQuery({
    queryKey: ["jagd-meldungen", jagd.id],
    queryFn: () => base44.entities.JagdMeldung.filter({ jagd_id: jagd.id }, "-zeitstempel", 100),
    enabled: !!jagd.id,
    refetchInterval: jagd.status === "aktiv" ? 10000 : false,
  });

  const { data: teilnehmer = [] } = useQuery({
    queryKey: ["jagd-teilnehmer", jagd.id],
    queryFn: () => base44.entities.JagdTeilnehmer.filter({ jagd_id: jagd.id }),
    enabled: !!jagd.id,
  });

  const { data: einrichtungen = [] } = useQuery({
    queryKey: ["einrichtungen-live", jagd.revier_id],
    queryFn: () => base44.entities.Jagdeinrichtung.filter({ revier_id: jagd.revier_id }),
    enabled: !!jagd.revier_id,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (jagd.status !== "aktiv") return;
    const unsub = base44.entities.JagdMeldung.subscribe((event) => {
      if (event.data?.jagd_id === jagd.id) {
        queryClient.invalidateQueries({ queryKey: ["jagd-meldungen", jagd.id] });
      }
    });
    return unsub;
  }, [jagd.id, jagd.status]);

  const addMeldungMutation = useMutation({
    mutationFn: (data) => base44.entities.JagdMeldung.create({
      ...data,
      jagd_id: jagd.id,
      tenant_id: jagd.tenant_id,
      zeitstempel: new Date().toISOString(),
      status: "neu",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jagd-meldungen", jagd.id] });
      setShowMeldung(false);
      setMeldungForm({ wildart: "", nachricht: "", latitude: "", longitude: "" });
      setMeldungTyp(null);
    },
  });

  const updateMeldungMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.JagdMeldung.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jagd-meldungen", jagd.id] }),
  });

  const handleMeldung = (typ) => {
    setMeldungTyp(typ);
    // Try GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setMeldungForm(f => ({ ...f, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }));
      }, () => {});
    }
    setShowMeldung(true);
  };

  // Stände mit GPS-Koordinaten
  const staendeMitGPS = einrichtungen.filter(e =>
    ["hochsitz", "leiter", "erdsitz", "drueckjagdbock", "ansitzdrueckjagdleiter"].includes(e.type) &&
    e.latitude && e.longitude
  );

  // Meldungen mit GPS
  const meldungenMitGPS = meldungen.filter(m => m.latitude && m.longitude);

  // Karten-Mittelpunkt: erster Stand oder Meldung mit GPS
  const allPoints = [
    ...staendeMitGPS.map(s => [s.latitude, s.longitude]),
    ...meldungenMitGPS.map(m => [parseFloat(m.latitude), parseFloat(m.longitude)]),
  ];
  const mapCenter = allPoints.length > 0 ? allPoints[0] : [51.0, 10.0];

  const standStats = {
    gesamt: teilnehmer.filter(t => t.stand_nummer || t.stand_id).length,
    besetzt: teilnehmer.filter(t => (t.stand_nummer || t.stand_id) && t.status === "stand_bezogen").length,
  };

  const erlegteCount = meldungen.filter(m => m.typ === "erlegt").length;
  const offeneBergungen = meldungen.filter(m => m.typ === "bergung_angefordert" && m.status === "neu").length;
  const offeneNachsuchen = meldungen.filter(m => m.typ === "nachsuche_angefordert" && m.status === "neu").length;

  return (
    <div className="space-y-5">
      {/* Status Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatusCard label="Stände besetzt" value={`${standStats.besetzt}/${standStats.gesamt}`} color="text-green-400" />
        <StatusCard label="Erlegt" value={erlegteCount} color="text-[#22c55e]" />
        <StatusCard label="Bergungen offen" value={offeneBergungen} color={offeneBergungen > 0 ? "text-orange-400" : "text-gray-400"} />
        <StatusCard label="Nachsuchen offen" value={offeneNachsuchen} color={offeneNachsuchen > 0 ? "text-red-400" : "text-gray-400"} />
      </div>

      {/* Quick Actions (für aktive Jagd) */}
      {jagd.status === "aktiv" && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Meldung senden</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MELDUNG_TYPEN.map(m => (
              <button
                key={m.value}
                onClick={() => handleMeldung(m.value)}
                className={`flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium text-white transition-all ${m.color}`}
              >
                <m.icon className="w-4 h-4 shrink-0" />
                <span className="text-left leading-tight">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stand-Status */}
      {teilnehmer.filter(t => t.stand_nummer || t.stand_id).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" />Stand-Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {teilnehmer.filter(t => t.stand_nummer || t.stand_id).map(t => {
              const isBesetzt = t.status === "stand_bezogen" || t.status === "aktiv";
              return (
                <div key={t.id} className={`rounded-xl border p-3 transition-all ${isBesetzt ? "border-green-700 bg-green-900/20" : "border-[#3a3a3a] bg-[#1e1e1e]"}`}>
                  <div className={`w-2.5 h-2.5 rounded-full mb-2 ${isBesetzt ? "bg-green-400" : "bg-red-500"}`} />
                  <p className="text-xs font-medium text-gray-200 truncate">{t.stand_nummer ? `Stand ${t.stand_nummer}` : t.stand_name}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{t.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Feed */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
          <Radio className="w-4 h-4 text-green-400" />
          Live-Meldungen
          {jagd.status === "aktiv" && <span className="text-xs text-green-400 ml-1">● Live</span>}
        </h3>
        {meldungen.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Noch keine Meldungen</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {meldungen.map(m => (
              <MeldungCard key={m.id} meldung={m} canManage={canManage} onUpdate={updateMeldungMutation} />
            ))}
          </div>
        )}
      </div>

      {/* Meldung Dialog */}
      <Dialog open={showMeldung} onOpenChange={setShowMeldung}>
        <DialogContent className="bg-[#1e1e1e] border-[#2d2d2d] text-gray-100 max-w-sm">
          <DialogHeader>
            <DialogTitle>{MELDUNG_TYPEN.find(m => m.value === meldungTyp)?.label || "Meldung"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {(meldungTyp === "erlegt" || meldungTyp === "schuss" || meldungTyp === "sichtung") && (
              <>
                <div>
                  <Label className="text-gray-300 text-sm">Wildart</Label>
                  <Select value={meldungForm.wildart} onValueChange={v => setMeldungForm(f => ({ ...f, wildart: v }))}>
                    <SelectTrigger className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1">
                      <SelectValue placeholder="Wildart wählen" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1e1e] border-[#2d2d2d]">
                      {WILDARTEN.map(w => <SelectItem key={w} value={w} className="text-gray-100">{WILDART_LABELS[w]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {meldungForm.latitude && (
              <div className="bg-[#2d2d2d] rounded-lg px-3 py-2 text-xs text-gray-400 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-green-400" />
                GPS: {meldungForm.latitude}, {meldungForm.longitude}
              </div>
            )}
            <div>
              <Label className="text-gray-300 text-sm">Nachricht (optional)</Label>
              <Textarea
                value={meldungForm.nachricht}
                onChange={e => setMeldungForm(f => ({ ...f, nachricht: e.target.value }))}
                placeholder="Weitere Details..."
                rows={2}
                className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1"
              />
            </div>
            <Button
              onClick={() => addMeldungMutation.mutate({ ...meldungForm, typ: meldungTyp, teilnehmer_name: user?.full_name || user?.email })}
              disabled={addMeldungMutation.isPending}
              className="w-full"
            >
              {addMeldungMutation.isPending ? "Senden..." : "Meldung senden"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusCard({ label, value, color }) {
  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-[#2d2d2d] p-3 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function MeldungCard({ meldung, canManage, onUpdate }) {
  const cfg = TYP_COLOR[meldung.typ] || TYP_COLOR.default;
  const zeitStr = (() => {
    try { return format(new Date(meldung.zeitstempel), "HH:mm"); } catch { return ""; }
  })();

  return (
    <div className={`rounded-xl border p-3 ${cfg}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-100">{TYP_LABEL[meldung.typ] || meldung.typ}</span>
            {meldung.wildart && <span className="text-xs text-gray-400 capitalize">{meldung.wildart}</span>}
            {meldung.status === "neu" && meldung.typ.includes("angefordert") && (
              <span className="text-xs bg-red-900 text-red-200 px-1.5 py-0.5 rounded-full animate-pulse">Offen</span>
            )}
          </div>
          {meldung.teilnehmer_name && <p className="text-xs text-gray-500 mt-0.5">{meldung.teilnehmer_name}</p>}
          {meldung.nachricht && <p className="text-xs text-gray-400 mt-1">{meldung.nachricht}</p>}
          {meldung.latitude && (
            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />{parseFloat(meldung.latitude).toFixed(4)}, {parseFloat(meldung.longitude).toFixed(4)}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-gray-500">{zeitStr}</span>
          {canManage && meldung.status === "neu" && (meldung.typ === "bergung_angefordert" || meldung.typ === "nachsuche_angefordert") && (
            <button
              onClick={() => onUpdate.mutate({ id: meldung.id, data: { status: "erledigt" } })}
              className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
            >
              <CheckCircle className="w-3 h-3" /> Erledigt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}