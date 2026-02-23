import React from "react";
import { useAuth } from "@/components/hooks/useAuth";
import AccessDenied from "./AccessDenied";

/**
 * Wrap a page with this component to enforce module-level access.
 * Usage: <ModuleGuard module="strecke">...</ModuleGuard>
 */
export default function ModuleGuard({ module, children }) {
  const { canAccess, isPlatformAdmin, loading } = useAuth();
  if (loading) return null;
  if (isPlatformAdmin || !module || canAccess(module)) return children;
  return <AccessDenied />;
}