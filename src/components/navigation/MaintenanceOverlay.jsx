import React from "react";
import { AlertCircle } from "lucide-react";

export default function MaintenanceOverlay() {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 safe-area-pt safe-area-pb">
      <div className="bg-[#2d2d2d] border border-[#3a3a3a] rounded-2xl p-6 mx-4 max-w-sm text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-amber-500/20 p-3 rounded-full">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Wartungsmodus</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          Gerade finden technische Arbeiten statt. Die App wird bald vollständig wieder nutzbar sein.
        </p>
        <p className="text-xs text-gray-500 mt-4">
          Die Kartenfunktion ist weiterhin verfügbar.
        </p>
      </div>
    </div>
  );
}