import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Map, TreePine, Settings, Shield,
  LogOut, ChevronDown, ChevronRight, Building, Users,
  Crosshair, Calendar, ListTodo, Globe, BookUser, Eye,
  Layers, Truck, Archive, Radio, UserCheck, UserCog
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { base44 } from "@/api/base44Client";

const NAV = [
  {
    label: "Dashboard",
    page: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Revier",
    icon: TreePine,
    children: [
      { label: "Karte", page: "Reviere", icon: Map },
      { label: "Jagdeinrichtungen", page: "Jagdeinrichtungen", icon: Building },
      { label: "Abteilungen", page: "Abteilungen", icon: Layers },
    ],
  },
  {
    label: "Wildmanagement",
    icon: Eye,
    children: [
      { label: "Rotwild", page: "WildRotwild", icon: TreePine },
      { label: "Schwarzwild", page: "WildSchwarzwild", icon: TreePine },
      { label: "Rehwild", page: "WildRehwild", icon: TreePine },
      { label: "Wolf", page: "WildWolf", icon: TreePine },
    ],
  },
  {
    label: "Strecke",
    icon: Crosshair,
    children: [
      { label: "Abschussplan", page: "StreckeAbschussplan", icon: Crosshair },
      { label: "Wildkammer", page: "StreckeWildkammer", icon: Archive },
      { label: "Wildverkauf", page: "StreckeWildverkauf", icon: Truck },
      { label: "Archiv", page: "StreckeArchiv", icon: Archive },
    ],
  },
  {
    label: "Jagdkalender",
    icon: Calendar,
    children: [
      { label: "Jagdmonitor", page: "Jagdkalender", icon: Radio },
      { label: "Jagdgäste", page: "Jagdgaeste", icon: UserCheck },
      { label: "Personal", page: "Personal", icon: UserCog },
    ],
  },
  {
    label: "Personen",
    icon: Users,
    children: [
      { label: "Berechtigungen", page: "TenantMembers", icon: Shield },
    ],
  },
  {
    label: "Aufgaben",
    page: "Aufgaben",
    icon: ListTodo,
  },
  {
    label: "Öffentlichkeit",
    page: "Oeffentlichkeit",
    icon: Globe,
  },
];

function NavItem({ item, currentPage, depth = 0 }) {
  const isActive = item.page && currentPage === item.page;
  const hasChildren = item.children && item.children.length > 0;
  const childIsActive = hasChildren && item.children.some(c => c.page === currentPage);
  const [open, setOpen] = useState(childIsActive);

  if (!hasChildren) {
    return (
      <Link
        to={createPageUrl(item.page)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          depth > 0 ? "pl-8" : ""
        } ${
          isActive
            ? "bg-[#0F2F23] text-white shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          childIsActive ? "text-[#0F2F23] bg-[#0F2F23]/5" : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        }
      </button>
      {open && (
        <div className="mt-0.5 ml-3 space-y-0.5 border-l-2 border-gray-100 pl-2">
          {item.children.map(child => (
            <NavItem key={child.page} item={child} currentPage={currentPage} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DesktopSidebar({ currentPage }) {
  const { user, tenant, isPlatformAdmin } = useAuth();

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
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto nh-scrollbar">
        {isPlatformAdmin && (
          <div className="mb-3">
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Platform</p>
            <Link
              to={createPageUrl("PlatformAdmin")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentPage === "PlatformAdmin"
                  ? "bg-[#0F2F23] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Shield className="w-4 h-4" />
              Administration
            </Link>
            <div className="my-3 border-t border-gray-100" />
          </div>
        )}

        {NAV.map(item => (
          <NavItem key={item.label} item={item} currentPage={currentPage} />
        ))}
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