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
    <div className="fixed top-0 left-0 right-0 bg-[#1e1e1e] border-b border-[#3a3a3a] z-40 px-4 py-3 safe-area-pt flex items-center gap-3 select-none">
      {showBackButton && (
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#2d2d2d] hover:bg-[#3a3a3a] transition-colors text-gray-300"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      
      {!showBackButton && (
        <div className="w-9 h-9 bg-[#22c55e] rounded-xl flex items-center justify-center shrink-0">
          <TreePine className="w-5 h-5 text-black" />
        </div>
      )}

      <h1 className="text-base font-bold text-gray-100 truncate flex-1">
        {title || "NextHunt"}
      </h1>
    </div>
  );
}