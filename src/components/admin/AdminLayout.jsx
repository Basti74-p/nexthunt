import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Building2, LifeBuoy, LogOut, TreePine, ShieldCheck, ChevronRight
} from "lucide-react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";

const ADMIN_NAV = [
  { label: "Dashboard", page: "SystemAdmin", icon: LayoutDashboard },
  { label: "Kunden", page: "SystemAdminTenants", icon: Building2 },
  { label: "Support", page: "SystemAdminSupport", icon: LifeBuoy },
];

export default function AdminLayout({ children, currentPage }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-slate-900 flex flex-col fixed left-0 top-0 h-screen z-40 border-r border-slate-800">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">NextHunt</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">System Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {ADMIN_NAV.map((item) => {
            const isActive = currentPage === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to App + User */}
        <div className="px-3 py-4 border-t border-slate-800 space-y-2">
          <Link
            to={createPageUrl("Dashboard")}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
          >
            <TreePine className="w-4 h-4 shrink-0" />
            Zur Anwendung
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </Link>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.full_name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => base44.auth.logout()}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 p-8 text-white">
        {children}
      </main>
    </div>
  );
}