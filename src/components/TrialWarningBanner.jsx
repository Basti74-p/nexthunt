import React from "react";
import { AlertCircle, Calendar } from "lucide-react";

export default function TrialWarningBanner({ daysRemaining, onDismiss }) {
  if (!daysRemaining) return null;

  const isExpired = daysRemaining <= 0;
  const isWarning = daysRemaining <= 7;
  const isInfo = daysRemaining > 7;

  return (
    <div className={`${isExpired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'} border rounded-xl p-4 flex items-start gap-3 mb-6`}>
      <AlertCircle className={`${isExpired ? 'text-red-600' : 'text-amber-600'} w-5 h-5 mt-0.5 flex-shrink-0`} />
      <div className="flex-1">
        {isExpired ? (
          <>
            <h3 className="font-semibold text-red-900 text-sm mb-1">Testphase abgelaufen</h3>
            <p className="text-xs text-red-700 mb-3">
              Ihre 30-Tage-Testphase ist vorbei. Bitte wählen Sie einen Plan, um weiterzumachen.
            </p>
          </>
        ) : (
          <>
            <h3 className="font-semibold text-amber-900 text-sm mb-1">Testphase endet bald</h3>
            <p className="text-xs text-amber-700 mb-3">
              Sie haben noch <strong>{daysRemaining} {daysRemaining === 1 ? 'Tag' : 'Tage'}</strong> kostenlosen Zugriff. 
              Wählen Sie danach einen Plan, um Ihre Daten zu behalten.
            </p>
          </>
        )}
        <a href="#" className="text-xs font-semibold text-amber-900 hover:underline">Lizenz kaufen →</a>
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5"
      >
        ✕
      </button>
    </div>
  );
}