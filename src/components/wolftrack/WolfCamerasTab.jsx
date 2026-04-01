import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const BATTERY_COLORS = { Voll: "#22c55e", Gut: "#84cc16", Mittel: "#f59e0b", Leer: "#ef4444", Unbekannt: "#6b7280" };
const BATTERY_PCT = { Voll: 100, Gut: 75, Mittel: 50, Leer: 5, Unbekannt: 0 };

function BatteryBar({ status }) {
  const pct = BATTERY_PCT[status] || 0;
  const color = BATTERY_COLORS[status] || "#6b7280";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full" style={{ background: "#374151" }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs" style={{ color }}>{status}</span>
    </div>
  );
}

export default function WolfCamerasTab({ cameras = [], tenantId, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    camera_name: "", camera_model: "", location_name: "", location_description: "",
    location_lat: "", location_lng: "", battery_status: "Unbekannt",
    installation_date: new Date().toISOString().split("T")[0], notes: "", active: true
  });

  const today = new Date();

  function daysAgo(dateStr) {
    if (!dateStr) return null;
    return Math.floor((today - new Date(dateStr)) / (1000 * 60 * 60 * 24));
  }

  async function handleSave() {
    if (!form.camera_name) return;
    setSaving(true);
    await base44.entities.WolfCamera.create({
      ...form,
      tenant_id: tenantId,
      location_lat: form.location_lat ? parseFloat(form.location_lat) : undefined,
      location_lng: form.location_lng ? parseFloat(form.location_lng) : undefined,
      wolf_detections_count: 0
    });
    setSaving(false);
    setShowForm(false);
    onRefresh?.();
  }

  async function handleCheck(camera) {
    await base44.entities.WolfCamera.update(camera.id, { last_checked: new Date().toISOString().split("T")[0] });
    onRefresh?.();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-bold text-lg">🎥 Wildkameras</span>
          <span className="ml-2 text-gray-400 text-sm">{cameras.filter(c => c.active).length} aktiv</span>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Kamera</Button>
      </div>

      {cameras.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📷</div>
          <div>Keine Wildkameras erfasst</div>
        </div>
      ) : (
        <div className="space-y-3">
          {cameras.map(c => {
            const daysSinceCheck = daysAgo(c.last_checked);
            const needsCheck = daysSinceCheck === null || daysSinceCheck > 30;
            const batteryEmpty = c.battery_status === "Leer";
            const alertColor = batteryEmpty ? "#ef4444" : needsCheck ? "#f59e0b" : null;
            return (
              <div key={c.id} className="p-3 rounded-xl"
                style={{ background: "#2a2a2a", border: `1px solid ${alertColor || "#3a3a3a"}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.active ? "#22c55e" : "#6b7280" }} />
                      <span className="font-bold text-white">{c.camera_name}</span>
                      {c.camera_model && <span className="text-xs text-gray-400">{c.camera_model}</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{c.location_name}</div>
                    <div className="mt-1.5"><BatteryBar status={c.battery_status} /></div>
                    <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                      <span>🕐 Geprüft: {c.last_checked ? new Date(c.last_checked).toLocaleDateString("de") : "Nie"}</span>
                      <span>🐺 Detektionen: <strong className="text-white">{c.wolf_detections_count || 0}</strong></span>
                    </div>
                    {needsCheck && <div className="text-xs mt-1" style={{ color: "#f59e0b" }}>⚠️ Kamera seit {daysSinceCheck ?? "?"} Tagen nicht geprüft!</div>}
                    {batteryEmpty && <div className="text-xs mt-0.5 text-red-400">🔴 Akku leer – bitte wechseln!</div>}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleCheck(c)} className="text-xs shrink-0">✅ Geprüft</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent style={{ background: "#2a2a2a", border: "1px solid #3a3a3a" }}>
          <DialogHeader><DialogTitle>📷 Neue Wildkamera</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Kameraname *</Label>
              <Input value={form.camera_name} onChange={e => setForm(f => ({ ...f, camera_name: e.target.value }))} placeholder="z.B. Kamera Nordwald 1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Modell</Label>
                <Input value={form.camera_model} onChange={e => setForm(f => ({ ...f, camera_model: e.target.value }))} placeholder="z.B. Bushnell Core" />
              </div>
              <div>
                <Label>Akku-Status</Label>
                <Select value={form.battery_status} onValueChange={v => setForm(f => ({ ...f, battery_status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(BATTERY_COLORS).map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Standortname</Label>
              <Input value={form.location_name} onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))} placeholder="Waldname / Flur" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Breitengrad</Label><Input value={form.location_lat} onChange={e => setForm(f => ({ ...f, location_lat: e.target.value }))} placeholder="51.5..." /></div>
              <div><Label>Längengrad</Label><Input value={form.location_lng} onChange={e => setForm(f => ({ ...f, location_lng: e.target.value }))} placeholder="10.5..." /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Abbrechen</Button>
              <Button onClick={handleSave} disabled={saving || !form.camera_name} className="flex-1">{saving ? "..." : "Speichern"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}