import React from "react";

const STATUS_CONFIG = {
  "Neu":                     "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "In Bearbeitung":          "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Bestätigt":               "bg-green-500/20 text-green-300 border-green-500/30",
  "Abgeschlossen":           "bg-gray-500/20 text-gray-400 border-gray-500/30",
  "Gutachter angefordert":   "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Entschädigung beantragt": "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

export default function WolfStatusBadge({ status }) {
  const cls = STATUS_CONFIG[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status}
    </span>
  );
}