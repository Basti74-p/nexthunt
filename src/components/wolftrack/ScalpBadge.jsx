import React from "react";

const SCALP_CONFIG = {
  "C1 Eindeutiger Nachweis":   { color: "bg-red-600 text-white",    short: "C1" },
  "C2 Bestätigter Hinweis":    { color: "bg-orange-500 text-white", short: "C2" },
  "C3a Wahrscheinlich":        { color: "bg-yellow-500 text-black", short: "C3a" },
  "C3c Unwahrscheinlich":      { color: "bg-gray-600 text-white",   short: "C3c" },
};

export default function ScalpBadge({ category }) {
  if (!category) return null;
  const cfg = SCALP_CONFIG[category] || { color: "bg-gray-700 text-gray-300", short: category };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${cfg.color}`}>
      {cfg.short}
    </span>
  );
}