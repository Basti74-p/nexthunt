import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Radio, MapPin, Crosshair, Truck, Search,
  Clock, CheckCircle, AlertTriangle, ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const WILDARTEN = [
  { value: "rotwild", label: "Rotwild" },
  { value: "schwarzwild", label: "Schwarzwild" },
  { value: "rehwild", label: "Rehwild" },
  { value: "damwild", label: "Damwild" },
  { value: "sikawild", label: "Sikawild" },
  { value: "niederwild", label: "Niederwild" },
  { value: "raubwild", label: "Raubwild" },
  { value: "sonstiges", label: "Sonstiges" },
];

const AKTIONEN = [
  { typ: "stand_bezogen", label: "Stand bezogen", icon: MapPin, color: "bg-blue-700 active:bg-blue-600" },
  { typ: "schuss", label: "Schuss abgegeben", icon: Crosshair, color: "bg-amber-700 active:bg-amber-600", brauchtWild: true },
  { typ: "erlegt", label: "Wild erlegt ✓", icon: Crosshair, color: "bg-green-700 active:bg-green-600", brauchtWild: true },
  { typ: "bergung_angefordert", label: "Bergung anfordern", icon: Truck, color: "bg-orange-700 active:bg-orange-600" },
  { typ: "nachsuche_angefordert", label: "Nachsuche anfordern", icon: Search, color: "bg-red-700 active:bg-red-600" },
  { typ: "sonstiges", label: "Sonstige Meldung", icon: Radio, color: "bg-gray-700 active:bg-gray-600" },
];

const TYP_LABEL = {
  schuss: "Schuss", erlegt: "Erlegt ✓", bergung_angefordert: "Bergung angefordert",
  nachsuche_angefordert: "Nachsuche angefordert", stand_bezogen: "Stand bezogen",
  sonstiges: "Meldung",
};

const TYP_COLOR = {
  erlegt: "border-green-700 bg-green-900/20",
  schuss: "border-amber-700 bg-amber-900/20",
  bergung_angefordert: "border-orange-700 bg-orange-900/20",
  nachsuche_angefordert: "border-red-700 bg-red-900/20",
  stand_bezogen: "border-blue-700 bg-blue-900/20",
  default: "border-[#2d2d2d] bg-[#1e1e1e]",
};

export default function MobileMonitor() {
  const { tenant, user } = useAuth();
  const queryClient = useQueryClient();
  const [showAktion, setShowAktion] = useState(false);
  const [aktionTyp, setAktionTyp] = useState(null);
  const [wildart, setWildart] = useState("");
  const [nachricht, setNachricht] = useState("");
  const [gpsCoords, setGpsCoords] = useState(null);

  const { data: aktiveJagden = [] } = useQuery({
    queryKey: ["aktive-jagden-mobile", tenant?.id],
    queryFn: () => base44.entities.GesellschaftsJagd.filter({ tenant_id: tenant?.id, status: "aktiv" }),
    enabled: !!tenant?.id,
    refetchInterval: 15000,
  });

  const { data: meineTeilnahmen = [] } = useQuery({
    queryKey: ["meine-teilnahmen", user?.email, tenant?.id],
    queryFn: () => base44.entities.JagdTeilnehmer.filter({ user_email: user?.email, tenant_id: tenant?.id }),
    enabled: !!user?.email && !!tenant?.id,
  });

  // Finde aktive Jagd + Teilnahme
  const aktiveTeilnahme = meineTeilnahmen.find(t => aktiveJagden.some(j => j.id === t.jagd_id));
  const aktiveJagd = aktiveJagden.find(j => j.id === aktiveTeilnahme?.jagd_id);

  const { data: meldungen = [] } = useQuery({
    queryKey: ["meldungen-mobile", aktiveJagd?.id],
    queryFn: () => base44.entities.JagdMeldung.filter({ jagd_id: aktiveJagd.id }, "-zeitstempel", 20),
    enabled: !!aktiveJagd?.id,
    refetchInterval: 8000,
  });

  // Real-time subscribe
  useEffect(() => {
    if (!aktiveJagd?.id) return;
    const unsub = base44.entities.JagdMeldung.subscribe((event) => {
      if (event.data?.jagd_id === aktiveJagd.id) {
        queryClient.invalidateQueries({ queryKey: ["meldungen-mobile", aktiveJagd.id] });
      }
    });
    return unsub;
  }, [aktiveJagd?.id]);

  const meldungMutation = useMutation({
    mutationFn: (data) => base44.entities.JagdMeldung.create({
      ...data,
      jagd_id: aktiveJagd.id,
      tenant_id: tenant.id,
      teilnehmer_id: aktiveTeilnahme?.id,
      teilnehmer_name: aktiveTeilnahme?.name || user?.full_name,
      stand_name: aktiveTeilnahme?.stand_nummer ? `Stand ${aktiveTeilnahme.stand_nummer}` : aktiveTeilnahme?.stand_name,
      zeitstempel: new Date().toISOString(),
      status: "neu",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meldungen-mobile", aktiveJagd.id] });
      setShowAktion(false);
      setWildart("");
      setNachricht("");
      setGpsCoords(null);
    },
  });

  const handleAktion = (aktion) => {
    setAktionTyp(aktion);
    setShowAktion(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setGpsCoords({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }),
        () => {}
      );
    }
  };

  const sendMeldung = () => {
    meldungMutation.mutate({
      typ: aktionTyp.typ,
      wildart: aktionTyp.brauchtWild ? wildart : undefined,
      nachricht,
      latitude: gpsCoords?.lat,
      longitude: gpsCoords?.lng,
    });
  };

  // Kein aktives Event
  if (!aktiveJagd) {
    return (
      <div className="pt-4">
        <div className="flex items-center gap-2 mb-5">
          <Radio className="w-5 h-5 text-gray-400" />
          <h2 className="text-xl font-bold text-gray-100">Jagdmonitor</h2>
        </div>
        <div className="bg-[#1e1e1e] rounded-2xl border border-[#2d2d2d] p-8 text-center">
          <Radio className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">Keine aktive Jagd</p>
          <p className="text-sm text-gray-500 mt-1">Sie sind keiner laufenden Jagd zugewiesen</p>
        </div>
        {aktiveJagden.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Aktive Jagden:</p>
            {aktiveJagden.map(j => (
              <Link key={j.id} to={createPageUrl(`JagdDetail?id=${j.id}`)}
                className="flex items-center justify-between bg-[#1e1e1e] rounded-xl border border-[#2d2d2d] p-3 mb-2 hover:border-[#22c55e]/40">
                <div>
                  <p className="text-sm font-medium text-gray-200">{j.titel}</p>
                  <p className="text-xs text-gray-500">{j.datum}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const ROLLE_LABELS = {
    jagdleiter: "Jagdleiter", schuetze: "Schütze", ansteller: "Ansteller",
    treiber: "Treiber", hundefuehrer: "Hundeführer", nachsuchetrupp: "Nachsuchetrupp",
    bergetrupp: "Bergetrupp", wildkammer: "Wildkammer", strassensicherung: "Straßensicherung",
    sicherheit: "Sicherheit", gast: "Jagdgast",
  };

  return (
    <div className="pt-4 space-y-4">
      {/* Event Info */}
      <div className="bg-[#1e1e1e] rounded-2xl border border-green-800 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-medium text-green-400 uppercase">Jagd aktiv</span>
        </div>
        <h2 className="font-bold text-gray-100 text-lg">{aktiveJagd.titel}</h2>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <p className="text-xs text-gray-500">Ihre Rolle</p>
            <p className="text-sm font-medium text-gray-200">{ROLLE_LABELS[aktiveTeilnahme?.rolle] || aktiveTeilnahme?.rolle}</p>
          </div>
          {aktiveTeilnahme?.stand_nummer && (
            <div>
              <p className="text-xs text-gray-500">Stand</p>
              <p className="text-sm font-medium text-gray-200">Stand {aktiveTeilnahme.stand_nummer}</p>
            </div>
          )}
        </div>
      </div>

      {/* Aktionen */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Meldung senden</p>
        <div className="grid grid-cols-2 gap-2">
          {AKTIONEN.map(a => (
            <button
              key={a.typ}
              onClick={() => handleAktion(a)}
              className={`flex items-center gap-2 px-4 py-4 rounded-xl text-sm font-medium text-white transition-all active:scale-95 ${a.color}`}
            >
              <a.icon className="w-5 h-5 shrink-0" />
              <span className="text-left leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live-Feed */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          Live-Feed <span className="text-green-400">● Live</span>
        </p>
        {meldungen.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Noch keine Meldungen</p>
        ) : (
          <div className="space-y-2">
            {meldungen.map(m => {
              const cfg = TYP_COLOR[m.typ] || TYP_COLOR.default;
              const zeitStr = (() => { try { return format(new Date(m.zeitstempel), "HH:mm"); } catch { return ""; } })();
              return (
                <div key={m.id} className={`rounded-xl border p-3 ${cfg}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-100">{TYP_LABEL[m.typ] || m.typ}</p>
                      <p className="text-xs text-gray-500">{m.teilnehmer_name}{m.wildart ? ` · ${m.wildart}` : ""}{m.stand_name ? ` · ${m.stand_name}` : ""}</p>
                      {m.nachricht && <p className="text-xs text-gray-400 mt-1">{m.nachricht}</p>}
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 ml-2">{zeitStr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Meldung Dialog */}
      <Dialog open={showAktion} onOpenChange={setShowAktion}>
        <DialogContent className="bg-[#1e1e1e] border-[#2d2d2d] text-gray-100 max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>{aktionTyp?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {aktionTyp?.brauchtWild && (
              <div>
                <Label className="text-gray-300 text-sm">Wildart</Label>
                <Select value={wildart} onValueChange={setWildart}>
                  <SelectTrigger className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1">
                    <SelectValue placeholder="Wildart wählen" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e1e] border-[#2d2d2d]">
                    {WILDARTEN.map(w => <SelectItem key={w.value} value={w.value} className="text-gray-100">{w.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {gpsCoords && (
              <div className="flex items-center gap-2 bg-[#2d2d2d] rounded-lg px-3 py-2 text-xs text-green-400">
                <MapPin className="w-3.5 h-3.5" /> GPS: {gpsCoords.lat}, {gpsCoords.lng}
              </div>
            )}
            <div>
              <Label className="text-gray-300 text-sm">Nachricht</Label>
              <Textarea value={nachricht} onChange={e => setNachricht(e.target.value)}
                placeholder="Details zur Meldung..." rows={3}
                className="bg-[#2d2d2d] border-[#3a3a3a] text-gray-100 mt-1" />
            </div>
            <Button onClick={sendMeldung}
              disabled={meldungMutation.isPending || (aktionTyp?.brauchtWild && !wildart)}
              className="w-full h-12 text-base">
              {meldungMutation.isPending ? "Senden..." : "Meldung senden"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}