import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, TreePine, Shield,
  LogOut, ChevronDown, ChevronRight, Users,
  Crosshair, Calendar, ListTodo, Globe, Eye,
  Truck, Archive, Radio, UserCheck, UserCog, LifeBuoy, Tag, ChevronsUpDown, Map, Building, Settings, PawPrint } from
"lucide-react";
import { useAuth } from "../hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";



// Navigation config uses translation keys instead of hardcoded labels
const NAV_CONFIG = [
{ key: "nav_dashboard", page: "Dashboard", icon: LayoutDashboard },
{
  key: "nav_map", page: "Karte", icon: Map, module: "einrichtungen",
  children: [
    { key: "nav_reviere", page: "Reviere", icon: TreePine },
    { key: "nav_jagdeinrichtungen", page: "Jagdeinrichtungen", icon: Building, module: "einrichtungen" }
  ]
},
{
  key: "nav_wildmanagement", page: "Wildmanagement", icon: Eye, module: "wildmanagement",
  children: [
    { key: "nav_rotwild", page: "WildRotwild", icon: TreePine, module: "wildmanagement" },
    { key: "nav_schwarzwild", page: "WildSchwarzwild", icon: TreePine, module: "wildmanagement" },
    { key: "nav_rehwild", page: "WildRehwild", icon: TreePine, module: "wildmanagement" },
    { key: "nav_wolf", page: "WildWolf", icon: TreePine, module: "wildmanagement" }
  ]
},
{
  key: "nav_strecke", page: "Strecke", icon: Crosshair, module: "strecke",
  children: [
    { key: "nav_abschussplan", page: "StreckeAbschussplan", icon: Crosshair, module: "strecke" },
    { key: "nav_wildkammer", page: "StreckeWildkammer", icon: Archive, module: "wildkammer" },
    { key: "nav_lager", page: "WildProdukte", icon: Archive, module: "wildkammer" },
    { key: "nav_wildverkauf", page: "Wildverkauf", icon: Truck, module: "strecke" },
    { key: "nav_archiv", page: "StreckeArchiv", icon: Archive, module: "strecke" }
  ]
},
{
  key: "nav_jagdkalender", page: "JagdkalenderKalender", icon: Calendar, module: "kalender",
  children: [
    { key: "nav_alle_jagden", page: "JagdkalenderMain", icon: Calendar, module: "kalender" },
    { key: "nav_live_monitor", page: "Jagdkalender", icon: Radio, module: "kalender" },
    { key: "nav_jagdgaeste", page: "Jagdgaeste", icon: UserCheck, module: "kalender" },
    { key: "nav_personal", page: "Personal", icon: UserCog, module: "kalender" }
  ]
},
{ key: "nav_aufgaben", page: "Aufgaben", icon: ListTodo, module: "aufgaben" },
{
  key: "nav_personen", page: "Personen", icon: Users, module: "personen",
  children: [
    { key: "nav_berechtigungen", page: "TenantMembers", icon: Shield, module: "personen" }
  ]
},
{ key: "nav_oeffentlichkeit", page: "Oeffentlichkeit", icon: Globe, module: "oeffentlichkeit" },
{ key: "nav_wolftrack", page: "WolfTrack", icon: PawPrint, label: "🐺 WolfTrack" },
{ key: "nav_support", page: "SupportTickets", icon: LifeBuoy },
{ key: "nav_einstellungen", page: "TenantSettings", icon: Settings },
];


function NavItem({ item, currentPage, depth = 0 }) {
  const { canAccess, isPlatformAdmin } = useAuth();
  const { t } = useI18n();
  const label = item.label || (item.key ? t(item.key) : item.page);
  const isActive = item.page && currentPage === item.page;
  const hasChildren = item.children && item.children.length > 0;
  const childIsActive = hasChildren && item.children.some((c) => c.page === currentPage);
  const [open, setOpen] = useState(childIsActive);

  // Permission check (platform admin always sees everything)
  const allowed = isPlatformAdmin || !item.module || canAccess(item.module);
  if (!allowed) return null;

  if (!hasChildren) {
    return (
      <Link
        to={createPageUrl(item.page)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
        depth > 0 ? "pl-8" : ""} ${

        isActive ?
        "bg-[#22c55e] text-[#1a1f2e] shadow-sm" :
        "text-gray-300 hover:bg-[#2d2d2d] hover:text-gray-100"}`
        }>

        <item.icon className="w-4 h-4 shrink-0" />
        {label}
      </Link>);

  }

  return (
    <div>
      <div className={`flex items-center rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive ? "bg-[#22c55e] text-[#1e1e1e]" : "text-gray-300 hover:bg-[#2d2d2d]"}`
      }>
        {item.page ?
        <Link to={createPageUrl(item.page)} className="flex items-center gap-3 px-3 py-2.5 flex-1">
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </Link> :

        <span className="flex items-center gap-3 px-3 py-2.5 flex-1">
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </span>
        }
        <button onClick={() => setOpen(!open)} className="px-2 py-2.5">
          {open ?
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> :
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          }
        </button>
      </div>
      {open &&
      <div className="mt-0.5 ml-3 space-y-0.5 border-l-2 border-[#2d2d2d] pl-2">
          {item.children.map((child) =>
        <NavItem key={child.page} item={child} currentPage={currentPage} depth={depth + 1} />
        )}
        </div>
      }
    </div>);

}

function TenantSwitcher() {
  const { tenant, switchTenant } = useAuth();
  const { t } = useI18n();
  const [tenants, setTenants] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    base44.entities.Tenant.list().then(setTenants).catch(() => {});
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#2d2d2d] hover:bg-[#3a3a3a] text-xs text-gray-300 transition-colors">

        <span className="flex-1 text-left truncate">{tenant?.name || t("nav_tenant_waehlen")}</span>
        <ChevronsUpDown className="w-3 h-3 text-gray-500 shrink-0" />
      </button>
      {open &&
      <div className="absolute left-0 right-0 top-full mt-1 bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
          {tenants.map((t) =>
        <button
          key={t.id}
          onClick={() => {switchTenant(t);setOpen(false);}}
          className={`w-full text-left px-3 py-2 text-xs hover:bg-[#2d2d2d] transition-colors ${tenant?.id === t.id ? "text-[#22c55e] font-semibold" : "text-gray-300"}`}>

              {t.name}
            </button>
        )}
        </div>
      }
    </div>);

}



export default function DesktopSidebar({ currentPage }) {
  const { user, tenant, isPlatformAdmin } = useAuth();
  const { t } = useI18n();

  return (
    <aside className="w-64 h-screen bg-[#1e1e1e] border-r border-[#2d2d2d] flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c370741b119950032ab62/7a1f75278_NextHunt_logo_transparent.png"
            alt="NextHunt Logo"
            className="w-full h-auto object-contain" />

          


        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto nh-scrollbar">
        {isPlatformAdmin &&
        <div className="mb-3">
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Platform</p>
            <Link
            to={createPageUrl("SystemAdmin")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            ["SystemAdmin", "SystemAdminTenants", "SystemAdminSupport"].includes(currentPage) ?
            "bg-[#22c55e] text-[#1e1e1e]" :
            "text-gray-400 hover:bg-[#2d2d2d]"}`
            }>

              <Shield className="w-4 h-4" />
              {t("nav_system_admin")}
            </Link>
            <div className="mt-3 px-0">
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{t("nav_aktiver_tenant")}</p>
              <TenantSwitcher />
            </div>
            <div className="my-3 border-t border-[#2d3a4f]" />
          </div>
        }

        {NAV_CONFIG.map((item) =>
        <NavItem key={item.key} item={item} currentPage={currentPage} />
        )}
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
            className="p-1.5 rounded-lg hover:bg-[#2d2d2d] text-gray-500 hover:text-gray-300 transition-colors">

            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>);

}