import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Map, Users, TreePine, Settings, Shield,
  ChevronDown, ChevronRight, LogOut
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { base44 } from "@/api/base44Client";

export default function DesktopSidebar({ currentPage, selectedRevier }) {
  const { user, tenant, isPlatformAdmin, isTenantOwner } = useAuth();
  const [revierOpen, setRevierOpen] = React.useState(!!selectedRevier);

  const navLinkClass = (page) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      currentPage === page
        ? "bg-[#0F2F23] text-white shadow-md"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0F2F23] rounded-xl flex items-center justify-center">
            <TreePine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0F2F23] tracking-tight">NextHunt</h1>
            {tenant && (
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{tenant.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto nh-scrollbar">
        {isPlatformAdmin && (
          <div className="mb-4">
            <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Platform</p>
            <Link to={createPageUrl("PlatformAdmin")} className={navLinkClass("PlatformAdmin")}>
              <Shield className="w-4 h-4" />
              Administration
            </Link>
          </div>
        )}

        <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Navigation</p>

        <Link to={createPageUrl("Dashboard")} className={navLinkClass("Dashboard")}>
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>

        <Link to={createPageUrl("Reviere")} className={navLinkClass("Reviere")}>
          <Map className="w-4 h-4" />
          Reviere
        </Link>

        <>
          <p className="px-3 mt-6 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Verwaltung</p>
          <Link to={createPageUrl("TenantMembers")} className={navLinkClass("TenantMembers")}>
            <Users className="w-4 h-4" />
            Mitglieder
          </Link>
          <Link to={createPageUrl("Persons")} className={navLinkClass("Persons")}>
            <Users className="w-4 h-4" />
            Adressbuch
          </Link>
          <Link to={createPageUrl("TenantSettings")} className={navLinkClass("TenantSettings")}>
            <Settings className="w-4 h-4" />
            Einstellungen
          </Link>
        </>
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-[#0F2F23] flex items-center justify-center text-white text-xs font-bold">
            {user?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name || "User"}</p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => base44.auth.logout()}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}