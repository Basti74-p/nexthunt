import React, { useState } from "react";
import { Plus, Building2, MapPin } from "lucide-react";

export default function AddMapFeatureButton({ onAddEinrichtung, onAddBoundary }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-6 right-3 z-[999] flex flex-col items-end gap-3">
      {/* Menu items */}
      {isOpen && (
        <div className="flex flex-col gap-2 bg-[#2d2d2d] rounded-xl shadow-lg border border-[#444] overflow-hidden">
          <button
            onClick={() => {
              onAddEinrichtung();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-[#3a3a3a] transition-colors whitespace-nowrap"
          >
            <Building2 className="w-4 h-4 text-blue-400" />
            Einrichtung hinzufügen
          </button>
          <button
            onClick={() => {
              onAddBoundary();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-[#3a3a3a] transition-colors whitespace-nowrap"
          >
            <MapPin className="w-4 h-4 text-green-400" />
            Reviergrenzen
          </button>
        </div>
      )}

      {/* Main button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all hover:scale-110"
        title="Einrichtung oder Reviergrenzen hinzufügen"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}