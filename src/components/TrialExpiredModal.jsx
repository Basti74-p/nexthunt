import React, { useState } from "react";
import { AlertCircle, Calendar, CreditCard, ArrowRight } from "lucide-react";

export default function TrialExpiredModal({ daysRemaining, onClose }) {
  const [showLicenseOptions, setShowLicenseOptions] = useState(false);

  if (daysRemaining === null) return null;

  // Trial still active
  if (daysRemaining > 0) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 max-w-md w-full p-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 mx-auto mb-4">
            <Calendar className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">30-Tage-Testphase aktiv</h2>
          <p className="text-sm text-gray-600 text-center mb-6">
            Sie haben noch <strong>{daysRemaining} Tage</strong> kostenlosen Zugriff auf alle Funktionen.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-[#22c55e] text-black rounded-xl font-medium hover:bg-[#16a34a] transition-colors"
          >
            Weiter zur App
          </button>
        </div>
      </div>
    );
  }

  // Trial expired
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 max-w-md w-full p-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Testphase abgelaufen</h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Ihre 30-Tage-Testphase ist leider abgelaufen. Ihr Konto bleibt erhalten, aber der Zugriff auf die Plattform ist eingeschränkt.
        </p>

        {!showLicenseOptions ? (
          <div className="space-y-3">
            <button
              onClick={() => setShowLicenseOptions(true)}
              className="w-full px-4 py-2.5 bg-[#22c55e] text-black rounded-xl font-medium hover:bg-[#16a34a] transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Lizenz kaufen
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 border border-gray-300 text-gray-900 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Später entscheiden
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { name: "Starter", price: "€29/Monat", features: "Bis zu 3 Reviere" },
              { name: "Pro", price: "€79/Monat", features: "Unbegrenzte Reviere" },
              { name: "Enterprise", price: "Auf Anfrage", features: "Custom-Lösung" }
            ].map((plan) => (
              <button
                key={plan.name}
                className="w-full p-4 border border-gray-200 rounded-xl hover:border-[#22c55e] hover:bg-green-50 transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 group-hover:text-[#22c55e]">{plan.name}</span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#22c55e]" />
                </div>
                <p className="text-sm font-bold text-gray-900 mb-0.5">{plan.price}</p>
                <p className="text-xs text-gray-500">{plan.features}</p>
              </button>
            ))}
            <button
              onClick={() => setShowLicenseOptions(false)}
              className="w-full px-4 py-2 text-gray-600 text-sm hover:text-gray-900"
            >
              Zurück
            </button>
          </div>
        )}
      </div>
    </div>
  );
}