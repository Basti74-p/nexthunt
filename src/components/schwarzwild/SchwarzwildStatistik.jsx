import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const JAGDJAHRE = ["2024/2025", "2025/2026", "2026/2027"];

function getJagdjahrRange(jj) {
  const [y1, y2] = jj.split("/").map(Number);
  return { from: new Date(`${y1}-04-01`), to: new Date(`${y2}-03-31`) };
}

const MONTHS_DE = ["Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez","Jan","Feb","Mär"];

export default function SchwarzwildStatistik({ tenant }) {
  const [jagdjahr, setJagdjahr] = useState("2025/2026");
  const { from, to } = getJagdjahrRange(jagdjahr);

  const { data: strecke = [] } = useQuery({ queryKey: ["strecke", tenant?.id], queryFn: () => base44.entities.Strecke.filter({ tenant_id: tenant.id, species: "schwarzwild" }), enabled: !!tenant?.id });
  const { data: sichtungen = [] } = useQuery({ queryKey: ["schwarzwild_sichtungen", tenant?.id], queryFn: () => base44.entities.SchwarzwildSichtung.filter({ tenant_id: tenant.id }), enabled: !!tenant?.id });
  const { data: schaeden = [] } = useQuery({ queryKey: ["schwarzwild_schaeden", tenant?.id], queryFn: () => base44.entities.SchwarzwildSchaden.filter({ tenant_id: tenant.id }), enabled: !!tenant?.id });

  const streckData = MONTHS_DE.map((m, i) => {
    const monthIdx = (i + 3) % 12;
    const year = i < 9 ? from.getFullYear() : to.getFullYear();
    const filtered = strecke.filter(s => { const d = new Date(s.date || s.created_date); return d.getMonth() === monthIdx && d.getFullYear() === year; });
    return { monat: m, Frischling: 0, Überläufer: 0, Bache: 0, Keiler: 0, total: filtered.length };
  });

  const sichtData = MONTHS_DE.map((m, i) => {
    const monthIdx = (i + 3) % 12;
    const year = i < 9 ? from.getFullYear() : to.getFullYear();
    const filtered = sichtungen.filter(s => { const d = new Date(s.datum); return d.getMonth() === monthIdx && d.getFullYear() === year; });
    const total = filtered.reduce((acc, s) => acc + (s.anzahl_frischlinge || 0) + (s.anzahl_ueberlaeufer || 0) + (s.anzahl_bachen || 0) + (s.anzahl_keiler || 0) + (s.anzahl_unbekannt || 0), 0);
    return { monat: m, Gesichtet: total };
  });

  const schadenData = MONTHS_DE.map((m, i) => {
    const monthIdx = (i + 3) % 12;
    const year = i < 9 ? from.getFullYear() : to.getFullYear();
    const filtered = schaeden.filter(s => { const d = new Date(s.datum); return d.getMonth() === monthIdx && d.getFullYear() === year; });
    const total = filtered.reduce((acc, s) => acc + (s.schadenshoehe_euro || 0), 0);
    return { monat: m, "Schäden (€)": total };
  });

  const chartStyle = { background: "transparent" };
  const tooltipStyle = { backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px" };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Schwarzwild Statistik</h3>
        <select
          className="bg-[#111] border border-[#2a2a2a] text-gray-300 rounded-xl px-3 py-2 text-sm"
          value={jagdjahr}
          onChange={e => setJagdjahr(e.target.value)}
        >
          {JAGDJAHRE.map(j => <option key={j}>{j}</option>)}
        </select>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Strecke nach Monat</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={streckData} style={chartStyle}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="monat" tick={{ fill: "#6b7280", fontSize: 11 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="total" name="Strecke gesamt" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Sichtungen pro Monat</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={sichtData} style={chartStyle}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="monat" tick={{ fill: "#6b7280", fontSize: 11 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="Gesichtet" stroke="#c8a84b" strokeWidth={2} dot={{ fill: "#c8a84b" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Schäden in € nach Monat</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={schadenData} style={chartStyle}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="monat" tick={{ fill: "#6b7280", fontSize: 11 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="Schäden (€)" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#1a1a0a] border border-yellow-800/30 rounded-xl px-4 py-3 flex items-center justify-between">
        <p className="text-xs text-gray-400">📄 Schwarzwild-Bericht als PDF exportieren</p>
        <span className="text-xs px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-600 rounded-lg">🔒 Nur PRO/Enterprise</span>
      </div>
    </div>
  );
}