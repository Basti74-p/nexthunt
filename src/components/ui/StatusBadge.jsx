import React from "react";

const styles = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
  archived: "bg-gray-100 text-gray-600 border-gray-200",
  planned: "bg-blue-50 text-blue-700 border-blue-200",
  finished: "bg-gray-100 text-gray-600 border-gray-200",
  offen: "bg-amber-50 text-amber-700 border-amber-200",
  in_bearbeitung: "bg-blue-50 text-blue-700 border-blue-200",
  erledigt: "bg-emerald-50 text-emerald-700 border-emerald-200",
  erfasst: "bg-amber-50 text-amber-700 border-amber-200",
  bestaetigt: "bg-blue-50 text-blue-700 border-blue-200",
  wildkammer: "bg-purple-50 text-purple-700 border-purple-200",
  verkauft: "bg-emerald-50 text-emerald-700 border-emerald-200",
  archiviert: "bg-gray-100 text-gray-600 border-gray-200",
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  assigned: "bg-blue-50 text-blue-700 border-blue-200",
  used: "bg-gray-100 text-gray-600 border-gray-200",
  geplant: "bg-blue-50 text-blue-700 border-blue-200",
  abgesagt: "bg-red-50 text-red-700 border-red-200",
  zugewiesen: "bg-amber-50 text-amber-700 border-amber-200",
  stand_bezogen: "bg-blue-50 text-blue-700 border-blue-200",
  aktiv: "bg-emerald-50 text-emerald-700 border-emerald-200",
  fertig: "bg-gray-100 text-gray-600 border-gray-200",
  starter: "bg-gray-100 text-gray-600 border-gray-200",
  pro: "bg-blue-50 text-blue-700 border-blue-200",
  enterprise: "bg-purple-50 text-purple-700 border-purple-200",
};

const labels = {
  in_bearbeitung: "In Bearbeitung",
  stand_bezogen: "Stand bezogen",
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {labels[status] || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}