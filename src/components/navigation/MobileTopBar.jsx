import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, TreePine } from "lucide-react";

export default function MobileTopBar({ title, showBackButton = true, onBack }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-40 px-4 py-3 safe-area-pt flex items-center gap-3 select-none">
      {showBackButton && (
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors text-[#0F2F23]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      
      {!showBackButton && (
        <div className="w-8 h-8 bg-[#0F2F23] rounded-lg flex items-center justify-center shrink-0">
          <TreePine className="w-4 h-4 text-white" />
        </div>
      )}

      <h1 className="text-sm font-bold text-[#0F2F23] truncate flex-1">
        {title || "NextHunt"}
      </h1>
    </div>
  );
}