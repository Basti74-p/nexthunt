import React from "react";
import { useMobile } from "@/components/hooks/useMobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { X } from "lucide-react";

/**
 * Responsive Dialog that renders as Drawer (bottom sheet) on mobile
 * and regular Dialog on desktop
 */
export function MobileDialogContent({ children, className = "", ...props }) {
  const isMobile = useMobile();

  if (isMobile) {
    return (
      <DrawerContent className={`${className}`}>
        {children}
      </DrawerContent>
    );
  }

  return (
    <DialogContent className={`bg-white border-gray-200 ${className}`} {...props}>
      {children}
    </DialogContent>
  );
}

export function MobileDialogHeader({ children, title, closeButton = true, ...props }) {
  const isMobile = useMobile();

  if (isMobile) {
    return (
      <DrawerHeader className="flex items-center justify-between" {...props}>
        <DrawerTitle>{title}</DrawerTitle>
        {closeButton && <DrawerClose asChild><button className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></DrawerClose>}
      </DrawerHeader>
    );
  }

  return (
    <DialogHeader {...props}>
      <DialogTitle>{title}</DialogTitle>
      {children}
    </DialogHeader>
  );
}

export function MobileDialog({ open, onOpenChange, children, ...props }) {
  const isMobile = useMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} {...props}>
        {children}
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </Dialog>
  );
}