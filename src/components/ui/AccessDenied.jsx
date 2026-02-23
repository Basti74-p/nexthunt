import React from "react";
import { Lock } from "lucide-react";

export default function AccessDenied({ message = "Sie haben keinen Zugriff auf diesen Bereich." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Lock className="w-7 h-7 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Kein Zugriff</h3>
      <p className="text-sm text-gray-500 max-w-sm">{message}</p>
    </div>
  );
}