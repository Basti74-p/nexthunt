import React from "react";

/**
 * MobileCard: Optimized card component for mobile display
 * Used for converting table data to card view on mobile
 */
export default function MobileCard({ title, subtitle, content, actions, className = "" }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-100 shadow-sm p-4 ${className}`}>
      {title && <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>}
      {subtitle && <p className="text-xs text-gray-500 mb-2">{subtitle}</p>}
      
      {content && (
        <div className="text-sm text-gray-700 space-y-2 mb-3">
          {content}
        </div>
      )}

      {actions && (
        <div className="flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}