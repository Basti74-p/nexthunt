import React from "react";
import { Button } from "@/components/ui/button";

/**
 * FloatingActionButton: Mobile-optimized FAB for bottom-right corner
 * Automatically positioned to avoid bottom navigation
 */
export default function FloatingActionButton({ icon: Icon, onClick, label, className = "" }) {
  return (
    <Button
      onClick={onClick}
      className={`fixed bottom-24 md:bottom-8 right-4 rounded-full w-14 h-14 md:w-12 md:h-12 shadow-lg hover:shadow-xl transition-shadow ${className}`}
      title={label}
    >
      <Icon className="w-6 h-6 md:w-5 md:h-5" />
    </Button>
  );
}