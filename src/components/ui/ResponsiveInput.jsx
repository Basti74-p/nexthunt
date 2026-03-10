import React from "react";
import { Input } from "@/components/ui/input";

/**
 * ResponsiveInput: Full width on mobile, proper touch size (44px min height)
 */
export default function ResponsiveInput({ className = "", ...props }) {
  return (
    <Input
      className={`min-h-[44px] md:min-h-[40px] w-full ${className}`}
      {...props}
    />
  );
}