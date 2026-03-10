import React from "react";
import { useMobile } from "@/components/hooks/useMobile";
import MobileTopBar from "@/components/navigation/MobileTopBar";
import MobileNav from "@/components/navigation/MobileNav";

/**
 * MobileLayout: Wrapper component for mobile-optimized pages
 * Automatically applies proper spacing and navigation on mobile
 */
export default function MobileLayout({ 
  children, 
  title, 
  showBackButton = true, 
  onBack, 
  currentPage 
}) {
  const isMobile = useMobile();

  if (!isMobile) {
    return children;
  }

  return (
    <div className="min-h-screen bg-white">
      <MobileTopBar title={title} showBackButton={showBackButton} onBack={onBack} />
      <MobileNav currentPage={currentPage} />
      
      <main className="pt-14 pb-20 px-4 max-w-full">
        {children}
      </main>
    </div>
  );
}