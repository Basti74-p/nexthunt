import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Map, TreePine, Settings, Shield,
  LogOut, ChevronDown, ChevronRight, Building, Users,
  Crosshair, Calendar, ListTodo, Globe, BookUser, Eye,
  Layers, Truck, Archive, Radio, UserCheck, UserCog, LifeBuoy, Tag, ChevronsUpDown
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { base44 } from "@/api/base44Client";

const REVIER_TABS = [
  { key: "overview", label: "Übersicht", icon: LayoutDashboard, feature: null },
  { key: "map", label: "Karte", icon: Map, feature: "feature_map" },
  { key: "einrichtungen", label: "Jagdeinrichtungen", icon: Building, feature: null },
  { key: "wildmanagement", label: "Wildmanagement", icon: Eye, feature: "feature_sightings" },
  { key: "strecke", label: "Strecke", icon: Crosshair, feature: "feature_strecke" },
  { key: "wildmarken", label: "Wildmarken", icon: Tag, feature: "feature_wildmarken" },
  { key: "kalender", label: "Jagdkalender", icon: Calendar, feature: null },
  { key: "aufgaben", label: "Aufgaben", icon: ListTodo, feature: "feature_tasks" },
  { key: "gesellschaftsjagd", label: "Gesellschaftsjagd", icon: Users, feature: "feature_driven_hunt" },
  { key: "public", label: "Öffentlich", icon: Globe, feature: "feature_public_portal" },
];

// module key maps to canAccess() key. undefined = always visible
const NAV = [
  {
    label: "Dashboard",
    page: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Reviere",
    page: "Reviere",
    icon: TreePine,
  },
  {
    label: "Wildmanagement",
    page: "Wildmanagement",
    icon: Eye,
    module: "wildmanagement",
    children: [
      { label: "Rotwild", page: "WildRotwild", icon: TreePine, module: "wildmanagement" },
      { label: "Schwarzwild", page: "WildSchwarzwild", icon: TreePine, module: "wildmanagement" },
      { label: "Rehwild", page: "WildRehwild", icon: TreePine, module: "wildmanagement" },
      { label: "Wolf", page: "WildWolf", icon: TreePine, module: "wildmanagement" },
    ],
  },
  {
    label: "Strecke",
    page: "Strecke",
    icon: Crosshair,
    module: "strecke",
    children: [
      { label: "Abschussplan", page: "StreckeAbschussplan", icon: Crosshair, module: "strecke" },
      { label: "Wildkammer", page: "StreckeWildkammer", icon: Archive, module: "wildkammer" },
      { label: "Wildverkauf", page: "StreckeWildverkauf", icon: Truck, module: "strecke" },
      { label: "Archiv", page: "StreckeArchiv", icon: Archive, module: "strecke" },
    ],
  },
  {
    label: "Jagdkalender",
    page: "JagdkalenderMain",
    icon: Calendar,
    module: "kalender",
    children: [
      { label: "Jagdmonitor", page: "Jagdkalender", icon: Radio, module: "kalender" },
      { label: "Jagdgäste", page: "Jagdgaeste", icon: UserCheck, module: "kalender" },
      { label: "Personal", page: "Personal", icon: UserCog, module: "kalender" },
    ],
  },
  {
    label: "Personen",
    page: "Personen",
    icon: Users,
    module: "personen",
    children: [
      { label: "Berechtigungen", page: "TenantMembers", icon: Shield, module: "personen" },
    ],
  },
  {
   label: "Aufgaben",
   page: "Aufgaben",
   icon: ListTodo,
   module: "aufgaben",
  },
  {
   label: "Wildmarken",
   page: "Wildmarken",
   icon: Tag,
  },
  {
   label: "Öffentlichkeit",
   page: "Oeffentlichkeit",
   icon: Globe,
   module: "oeffentlichkeit",
  },
  {
   label: "Support",
   page: "SupportTickets",
   icon: LifeBuoy,
  },
  ];

function NavItem({ item, currentPage, depth = 0 }) {
  const { canAccess, isPlatformAdmin } = useAuth();
  const isActive = item.page && currentPage === item.page;
  const hasChildren = item.children && item.children.length > 0;
  const childIsActive = hasChildren && item.children.some(c => c.page === currentPage);
  const [open, setOpen] = useState(childIsActive);

  // Permission check (platform admin always sees everything)
  const allowed = isPlatformAdmin || !item.module || canAccess(item.module);
  if (!allowed) return null;

  if (!hasChildren) {
    return (
      <Link
        to={createPageUrl(item.page)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          depth > 0 ? "pl-8" : ""
        } ${
          isActive
            ? "bg-[#22c55e] text-[#1a1f2e] shadow-sm"
            : "text-gray-400 hover:bg-[#2d3a4f] hover:text-gray-200"
        }`}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <div className={`flex items-center rounded-xl text-sm font-medium transition-all duration-150 ${
        isActive ? "bg-[#22c55e] text-[#1e1e1e]" : childIsActive ? "text-[#22c55e] bg-[#22c55e]/10" : "text-gray-300 hover:bg-[#2d2d2d]"
      }`}>
        {item.page ? (
          <Link to={createPageUrl(item.page)} className="flex items-center gap-3 px-3 py-2.5 flex-1">
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        ) : (
          <span className="flex items-center gap-3 px-3 py-2.5 flex-1">
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </span>
        )}
        <button onClick={() => setOpen(!open)} className="px-2 py-2.5">
          {open
            ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          }
        </button>
      </div>
      {open && (
        <div className="mt-0.5 ml-3 space-y-0.5 border-l-2 border-[#2d2d2d] pl-2">
          {item.children.map(child => (
            <NavItem key={child.page} item={child} currentPage={currentPage} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function TenantSwitcher() {
  const { tenant, switchTenant } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    base44.entities.Tenant.list().then(setTenants).catch(() => {});
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#2d2d2d] hover:bg-[#3a3a3a] text-xs text-gray-300 transition-colors"
      >
        <span className="flex-1 text-left truncate">{tenant?.name || "Tenant wählen..."}</span>
        <ChevronsUpDown className="w-3 h-3 text-gray-500 shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
          {tenants.map(t => (
            <button
              key={t.id}
              onClick={() => { switchTenant(t); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-[#2d2d2d] transition-colors ${tenant?.id === t.id ? "text-[#22c55e] font-semibold" : "text-gray-300"}`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}



export default function DesktopSidebar({ currentPage }) {
  const { user, tenant, isPlatformAdmin } = useAuth();

  return (
    <aside className="w-64 h-screen bg-[#1e1e1e] border-r border-[#2d2d2d] flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#22c55e] rounded-xl flex items-center justify-center">
            <TreePine className="w-5 h-5 text-[#1a1f2e]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#22c55e] tracking-tight">NextHunt</h1>
            {tenant && (
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{tenant.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto nh-scrollbar">
        {isPlatformAdmin && (
          <div className="mb-3">
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Platform</p>
            <Link
              to={createPageUrl("SystemAdmin")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                ["SystemAdmin","SystemAdminTenants","SystemAdminSupport"].includes(currentPage)
                  ? "bg-[#22c55e] text-[#1e1e1e]"
                  : "text-gray-400 hover:bg-[#2d2d2d]"
              }`}
            >
              <Shield className="w-4 h-4" />
              System-Administration
            </Link>
            <div className="mt-3 px-0">
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Aktiver Tenant</p>
              <TenantSwitcher />
            </div>
            <div className="my-3 border-t border-[#2d3a4f]" />
          </div>
        )}

        {NAV.map(item => (
          <NavItem key={item.label} item={item} currentPage={currentPage} />
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-[#2d2d2d]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center text-[#1e1e1e] text-xs font-bold">
            {user?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-100 truncate">{user?.full_name || "User"}</p>
            <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => base44.auth.logout()}
            className="p-1.5 rounded-lg hover:bg-[#2d2d2d] text-gray-500 hover:text-gray-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}