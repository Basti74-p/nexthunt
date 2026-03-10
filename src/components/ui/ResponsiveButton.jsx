import React from "react";
import { Button } from "@/components/ui/button";

/**
 * ResponsiveButton: Ensures 44px minimum height on mobile for touch-friendly interaction
 */
export default function ResponsiveButton({ children, className = "", ...props }) {
  return (
    <Button
      className={`min-h-[44px] md:min-h-[40px] ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}