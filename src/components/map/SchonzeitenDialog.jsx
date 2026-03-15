import { useState } from 'react';
import { X, Calendar } from 'lucide-react';

const SCHONZEITEN_DATA = {
  rotwild: {
    label: 'Rotwild',
    schonzeit: '16.04. - 20.07.',
    notes: 'Hirsche bis 30.06. schonend behandeln'
  },
  schwarzwild: {
    label: 'Schwarzwild',
    schonzeit: 'ganzjährig bejagbar',
    notes: 'Keine gesetzliche Schonzeit'
  },
  rehwild: {
    label: 'Rehwild',
    schonzeit: '16.01. - 31.07.',
    notes: 'Böcke ab 01.08. wieder bejagbar'
  },
  damwild: {
    label: 'Damwild',
    schonzeit: '01.04. - 30.06.',
    notes: 'Spießer bis 31.07. schonend behandeln'
  },
  sikawild: {
    label: 'Sikawild',
    schonzeit: '01.04. - 30.06.',
    notes: 'Regional unterschiedlich'
  },
  wolf: {
    label: 'Wolf',
    schonzeit: 'ganzjährig geschützt',
    notes: 'Bejagung nur auf Antrag möglich'
  }
};

export default function SchonzeitenDialog({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 flex items-end">
      <div className="bg-[#1e1e1e] w-full rounded-t-3xl animate-in slide-in-from-bottom-5 border border-[#3a3a3a]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3a3a3a]">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#22c55e]" />
            <h2 className="text-lg font-bold text-gray-100">Aktuelle Schonzeiten</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#2a2a2a] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {Object.entries(SCHONZEITEN_DATA).map(([key, data]) => (
            <div
              key={key}
              className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-4 hover:border-[#22c55e]/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-100">{data.label}</h3>
                <span className="text-xs bg-[#22c55e]/20 text-[#22c55e] px-2.5 py-1 rounded-lg font-medium">
                  {data.schonzeit}
                </span>
              </div>
              <p className="text-xs text-gray-400">{data.notes}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-[#3a3a3a] p-4">
          <p className="text-xs text-gray-500 text-center">
            Stand: 2026 | Quelle: Bundesweit gültige Schonzeiten
          </p>
        </div>
      </div>
    </div>
  );
}