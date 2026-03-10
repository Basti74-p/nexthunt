import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Mobile-responsive dialog wrapper
 * Uses full-width on mobile (sm) and normal width on desktop
 */
export function ResponsiveDialogContent({ children, className = "", ...props }) {
  return (
    <DialogContent 
      {...props}
      className={`bg-[#2d2d2d] border-[#3a3a3a] max-w-lg sm:max-w-lg max-h-[90vh] sm:rounded-2xl rounded-t-2xl w-[calc(100vw-2rem)] sm:w-auto ${className}`}
    >
      {children}
    </DialogContent>
  );
}

export function ResponsiveDialog({ open, onOpenChange, children, ...props }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </Dialog>
  );
}