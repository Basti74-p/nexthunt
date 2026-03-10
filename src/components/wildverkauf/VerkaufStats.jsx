import React from "react";
import { TrendingUp, Euro, Package, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function VerkaufStats({ verkauefe, kunden }) {
  const totalBrutto = verkauefe.reduce((s, v) => s + (v.brutto_betrag || 0), 0);
  const bezahlt = verkauefe.filter(v => v.zahlungsstatus === "bezahlt").reduce((s, v) => s + (v.brutto_betrag || 0), 0);
  const offen = verkauefe.filter(v => v.zahlungsstatus === "offen").reduce((s, v) => s + (v.brutto_betrag || 0), 0);
  const uniqueKunden = new Set(verkauefe.map(v => v.kunde_id)).size;

  // Umsatz pro Monat
  const byMonth = {};
  verkauefe.forEach(v => {
    if (!v.datum) return;
    const key = v.datum.slice(0, 7);
    byMonth[key] = (byMonth[key] || 0) + (v.brutto_betrag || 0);
  });
  const chartData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, val]) => ({
      monat: format(new Date(key + "-01"), "MMM yy", { locale: de }),
      umsatz: parseFloat(val.toFixed(2)),
    }));

  // Top Kunden
  const byKunde = {};
  verkauefe.forEach(v => {
    byKunde[v.kunde_name || v.kunde_id] = (byKunde[v.kunde_name || v.kunde_id] || 0) + (v.brutto_betrag || 0);
  });
  const topKunden = Object.entries(byKunde).sort(([, a], [, b]) => b - a).slice(0, 5);

  const stats = [
    { label: "Gesamtumsatz", value: `€ ${totalBrutto.toFixed(2)}`, icon: TrendingUp, color: "text-[#22c55e]" },
    { label: "Bezahlt", value: `€ ${bezahlt.toFixed(2)}`, icon: Euro, color: "text-blue-400" },
    { label: "Offen", value: `€ ${offen.toFixed(2)}`, icon: Package, color: "text-yellow-400" },
    { label: "Aktive Kunden", value: uniqueKunden, icon: Users, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-[#232323] rounded-xl border border-[#3a3a3a] p-4">
            <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {chartData.length > 0 && (
          <div className="bg-[#232323] rounded-xl border border-[#3a3a3a] p-4">
            <p className="text-sm font-medium text-gray-300 mb-4">Umsatz letzte 6 Monate</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <XAxis dataKey="monat" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #3a3a3a", borderRadius: 8 }}
                  labelStyle={{ color: "#e5e5e5" }}
                  formatter={v => [`€ ${v}`, "Umsatz"]}
                />
                <Bar dataKey="umsatz" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {topKunden.length > 0 && (
          <div className="bg-[#232323] rounded-xl border border-[#3a3a3a] p-4">
            <p className="text-sm font-medium text-gray-300 mb-4">Top Kunden</p>
            <div className="space-y-2">
              {topKunden.map(([name, betrag]) => (
                <div key={name} className="flex justify-between items-center">
                  <span className="text-sm text-gray-300 truncate flex-1">{name}</span>
                  <span className="text-sm font-bold text-[#22c55e] ml-4">€ {betrag.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}