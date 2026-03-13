import React, { useState } from "react";
import {
  LayoutDashboard, TreePine, Shield, LogOut, ChevronDown, ChevronRight,
  Users, Crosshair, Calendar, ListTodo, Globe, Eye, Truck, Archive, Radio,
  UserCheck, UserCog, LifeBuoy, Settings, Menu, X, ChevronsUpDown, Map, Building
} from "lucide-react";

const NAV = [
  { label: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
  {
    label: "Karte",
    page: "Karte",
    icon: Map,
    children: [
      { label: "Reviere", page: "Reviere", icon: TreePine },
      { label: "Jagdeinrichtungen", page: "Jagdeinrichtungen", icon: Building }
    ]
  },
  {
    label: "Wildmanagement",
    page: "Wildmanagement",
    icon: Eye,
    children: [
      { label: "Rotwild", page: "WildRotwild", icon: TreePine },
      { label: "Schwarzwild", page: "WildSchwarzwild", icon: TreePine },
      { label: "Rehwild", page: "WildRehwild", icon: TreePine },
      { label: "Wolf", page: "WildWolf", icon: TreePine }
    ]
  },
  {
    label: "Strecke",
    page: "Strecke",
    icon: Crosshair,
    children: [
      { label: "Abschussplan", page: "StreckeAbschussplan", icon: Crosshair },
      { label: "Wildkammer", page: "StreckeWildkammer", icon: Archive },
      { label: "Lager", page: "WildProdukte", icon: Archive },
      { label: "Wildverkauf", page: "Wildverkauf", icon: Truck },
      { label: "Archiv", page: "StreckeArchiv", icon: Archive }
    ]
  },
  {
    label: "Jagdkalender",
    page: "JagdkalenderMain",
    icon: Calendar,
    children: [
      { label: "Alle Jagden", page: "JagdkalenderMain", icon: Calendar },
      { label: "Live-Monitor", page: "Jagdkalender", icon: Radio },
      { label: "Jagdgäste", page: "Jagdgaeste", icon: UserCheck },
      { label: "Personal", page: "Personal", icon: UserCog }
    ]
  },
  { label: "Aufgaben", page: "Aufgaben", icon: ListTodo },
  {
    label: "Personen",
    page: "Personen",
    icon: Users,
    children: [
      { label: "Berechtigungen", page: "TenantMembers", icon: Shield }
    ]
  },
  { label: "Öffentlichkeit", page: "Oeffentlichkeit", icon: Globe },
  { label: "Support", page: "SupportTickets", icon: LifeBuoy },
  { label: "Einstellungen", page: "TenantSettings", icon: Settings }
];

// Demo content pages
const PAGES = {
  Dashboard: () => (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Reviere", value: 3 },
          { label: "Offene Aufgaben", value: 5 },
          { label: "Strecke (2026)", value: 12 },
          { label: "Jagden geplant", value: 2 }
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#262626] border border-[#3a3a3a] rounded-xl p-4">
            <p className="text-3xl font-bold text-[#22c55e]">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  ),
  Reviere: () => <PageContent title="Reviere" icon={TreePine} />,
  Jagdeinrichtungen: () => <PageContent title="Jagdeinrichtungen" icon={Building} />,
  Karte: () => <PageContent title="Karte" icon={Map} />,
  Wildmanagement: () => <PageContent title="Wildmanagement" icon={Eye} />,
  WildRotwild: () => <PageContent title="Rotwild" icon={TreePine} />,
  WildSchwarzwild: () => <PageContent title="Schwarzwild" icon={TreePine} />,
  WildRehwild: () => <PageContent title="Rehwild" icon={TreePine} />,
  WildWolf: () => <PageContent title="Wolf" icon={TreePine} />,
  Strecke: () => <PageContent title="Strecke" icon={Crosshair} />,
  StreckeAbschussplan: () => <PageContent title="Abschussplan" icon={Crosshair} />,
  StreckeWildkammer: () => <PageContent title="Wildkammer" icon={Archive} />,
  WildProdukte: () => <PageContent title="Lager" icon={Archive} />,
  Wildverkauf: () => <PageContent title="Wildverkauf" icon={Truck} />,
  StreckeArchiv: () => <PageContent title="Archiv" icon={Archive} />,
  JagdkalenderMain: () => <PageContent title="Jagdkalender" icon={Calendar} />,
  Jagdkalender: () => <PageContent title="Live-Monitor" icon={Radio} />,
  Jagdgaeste: () => <PageContent title="Jagdgäste" icon={UserCheck} />,
  Personal: () => <PageContent title="Personal" icon={UserCog} />,
  Aufgaben: () => <PageContent title="Aufgaben" icon={ListTodo} />,
  Personen: () => <PageContent title="Personen" icon={Users} />,
  TenantMembers: () => <PageContent title="Berechtigungen" icon={Shield} />,
  Oeffentlichkeit: () => <PageContent title="Öffentlichkeit" icon={Globe} />,
  SupportTickets: () => <PageContent title="Support" icon={LifeBuoy} />,
  TenantSettings: () => <PageContent title="Einstellungen" icon={Settings} />
};

function PageContent({ title, icon: Icon }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-8">{title}</h1>
      <div className="bg-[#262626] border border-[#3a3a3a] rounded-xl p-12 text-center">
        <Icon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">{title}-Modul</p>
      </div>
    </div>
  );
}

function NavItem({ item, currentPage, onNavigate, depth = 0 }) {
  const hasChildren = item.children && item.children.length > 0;
  const isActive = currentPage === item.page;
  const childIsActive = hasChildren && item.children.some((c) => c.page === currentPage);
  const [open, setOpen] = useState(childIsActive);
  const Icon = item.icon;

  if (!hasChildren) {
    return (
      <button
        onClick={() => onNavigate(item.page)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${depth > 0 ? "pl-8" : ""} ${
          isActive
            ? "bg-[#22c55e] text-[#1e1e1e] shadow-sm"
            : "text-gray-300 hover:bg-[#2d2d2d] hover:text-gray-100"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {item.label}
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => {
          if (item.page) onNavigate(item.page);
          setOpen(!open);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive || childIsActive
            ? "bg-[#22c55e] text-[#1e1e1e]"
            : "text-gray-300 hover:bg-[#2d2d2d] hover:text-gray-100"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="mt-0.5 ml-3 space-y-0.5 border-l-2 border-[#2d2d2d] pl-2">
          {item.children.map((child) => (
            <NavItem
              key={child.page}
              item={child}
              currentPage={currentPage}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DemoSidebar({ currentPage, onNavigate, isMobileMenuOpen, onToggleMobileMenu }) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 w-64 h-screen bg-[#1e1e1e] border-r border-[#2d2d2d] flex-col z-40">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-[#2d2d2d]">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c370741b119950032ab62/7a1f75278_NextHunt_logo_transparent.png"
            alt="NextHunt Logo"
            className="w-40 h-auto"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              currentPage={currentPage}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        {/* User Footer */}
        <div className="px-3 py-4 border-t border-[#2d2d2d]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center text-[#1e1e1e] text-xs font-bold">
              D
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-100 truncate">Demo Benutzer</p>
              <p className="text-[10px] text-gray-500 truncate">demo@nexthunt.de</p>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-[#2d2d2d] text-gray-500 hover:text-gray-300 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Toggle */}
      <button
        onClick={onToggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#2d2d2d] rounded-lg text-gray-100"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => onToggleMobileMenu()}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <aside className="md:hidden fixed left-0 top-0 w-56 h-screen bg-[#1e1e1e] z-40 flex flex-col border-r border-[#2d2d2d]">
          <div className="px-6 py-5 border-b border-[#2d2d2d]">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c370741b119950032ab62/7a1f75278_NextHunt_logo_transparent.png"
              alt="NextHunt Logo"
              className="w-32 h-auto"
            />
          </div>
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {NAV.map((item) => (
              <NavItem
                key={item.label}
                item={item}
                currentPage={currentPage}
                onNavigate={(page) => {
                  onNavigate(page);
                  onToggleMobileMenu();
                }}
              />
            ))}
          </nav>
        </aside>
      )}
    </>
  );
}

export default function Demo() {
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const PageComponent = PAGES[currentPage] || (() => <PageContent title={currentPage} icon={LayoutDashboard} />);

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-gray-100">
      <DemoSidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <main className="md:ml-64 p-4 md:p-8">
        <PageComponent />
      </main>
    </div>
  );
}