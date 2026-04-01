import React from "react";

export default function WolfStatCards({ sightings, risse, daysToSeason }) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = new Date().getFullYear();

  const sightingsThisMonth = sightings.filter(s => {
    const d = new Date(s.sighting_date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const risseThisMonth = risse.filter(r => {
    const d = new Date(r.incident_date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const offeneMeldungen = [
    ...sightings.filter(s => s.status === "Neu"),
    ...risse.filter(r => r.status === "Neu")
  ].length;

  const stats = [
    { label: "Sichtungen diesen Monat", value: sightingsThisMonth, icon: "👁️", color: "text-green-400" },
    { label: "Risse diesen Monat", value: risseThisMonth, icon: "🩸", color: "text-red-400" },
    { label: "Offene Meldungen", value: offeneMeldungen, icon: "⚠️", color: "text-amber-400" },
    { label: "Tage bis Jagdsaison", value: daysToSeason, icon: "🗓️", color: "text-blue-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {stats.map(s => (
        <div key={s.label} className="bg-[#1e1e1e] border border-[#333] rounded-xl p-3">
          <div className="text-xl mb-1">{s.icon}</div>
          <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}