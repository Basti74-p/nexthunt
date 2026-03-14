import React from "react";
import { X, PenLine, Warehouse, Eye } from "lucide-react";

const actions = [
  { icon: PenLine, label: "Reviergrenze einzeichnen", key: "boundary" },
  { icon: Warehouse, label: "Einrichtung hinzufügen", key: "einrichtung" },
  { icon: Eye, label: "Sichtung erfassen", key: "sichtung" },
];

export default function MapActionSheet({ onClose, onSelect }) {
  return (
    <div
      className="fixed inset-0 z-[9998] flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg mx-auto bg-[#1e1e1e]/90 backdrop-blur-md rounded-t-2xl p-5 pb-8 border-t border-[#3a3a3a]"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-[#3a3a3a] rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-gray-300">Hinzufügen</span>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[#2a2a2a]">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-2">
          {actions.map(({ icon: Icon, label, key }) => (
            <button
              key={key}
              onClick={() => { onSelect(key); onClose(); }}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-[#2a2a2a] hover:bg-[#333] active:bg-[#3a3a3a] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#22c55e]/15 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#22c55e]" />
              </div>
              <span className="text-sm font-medium text-gray-100">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}