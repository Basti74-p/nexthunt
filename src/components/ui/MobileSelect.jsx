import React from "react";
import { useMobile } from "@/components/hooks/useMobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

/**
 * Responsive Select that renders as Drawer (bottom sheet) on mobile
 * and regular Select on desktop
 */
export default function MobileSelect({ value, onValueChange, placeholder, children, label, items = [] }) {
  const isMobile = useMobile();
  const [open, setOpen] = React.useState(false);

  if (isMobile) {
    const selectedItem = items.find(i => i.value === value);
    
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 hover:border-gray-300 transition-colors"
        >
          <span>{selectedItem?.label || placeholder || "Wählen..."}</span>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{label || "Wählen"}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 space-y-2">
              {items.map(item => (
                <button
                  key={item.value}
                  onClick={() => {
                    onValueChange(item.value);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${
                    value === item.value
                      ? "bg-[#0F2F23] text-white font-medium"
                      : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map(item => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}