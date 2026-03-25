import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import PageHeader from "@/components/ui/PageHeader";
import { AlertCircle, Users, Building2, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

export default function SystemAdminDashboard() {
  const { user, isPlatformAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    trialTenants: 0,
    totalRevenue: 0,
  });

  // Fetch all tenants
  const { data: tenants = [] } = useQuery({
    queryKey: ["allTenants"],
    queryFn: () => base44.entities.Tenant.list(),
    enabled: isPlatformAdmin,
  });

  // Fetch all users
  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
    enabled: isPlatformAdmin,
  });

  // Calculate stats
  useEffect(() => {
    const activeTenants = tenants.filter(t => t.status === "active").length;
    const trialTenants = tenants.filter(t => t.status === "trial").length;
    
    setStats({
      totalTenants: tenants.length,
      activeTenants,
      totalUsers: allUsers.filter(u => u.role !== "platform_admin").length,
      trialTenants,
      totalRevenue: 0, // Would be calculated from invoices
    });
  }, [tenants, allUsers]);

  if (!isPlatformAdmin) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 p-4 bg-red-950 border border-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-200">Nur Administratoren können auf dieses Dashboard zugreifen.</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "green" }) => {
    const colorClasses = {
      green: "text-[#22c55e]",
      blue: "text-blue-400",
      yellow: "text-yellow-400",
      red: "text-red-400",
    };

    return (
      <div className="p-6 bg-[#3a3a3a] rounded-lg border border-[#555]">
        <div className="flex items-start justify-between mb-3">
          <Icon className={`w-8 h-8 ${colorClasses[color]}`} />
        </div>
        <p className="text-sm text-gray-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-100">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="System Administrator Dashboard"
        subtitle="Verwaltung aller Tenants, Benutzer und Abrechnung"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Building2}
          title="Gesamt Tenants"
          value={stats.totalTenants}
          subtitle={`${stats.activeTenants} aktiv, ${stats.trialTenants} Trial`}
          color="blue"
        />
        <StatCard
          icon={Users}
          title="Benutzer"
          value={stats.totalUsers}
          color="green"
        />
        <StatCard
          icon={Calendar}
          title="Trial Tenants"
          value={stats.trialTenants}
          color="yellow"
        />
        <StatCard
          icon={TrendingUp}
          title="Aktive Tenants"
          value={stats.activeTenants}
          color="green"
        />
        <StatCard
          icon={DollarSign}
          title="Geschätzter Umsatz"
          value={`€${stats.totalRevenue}`}
          color="green"
        />
      </div>

      {/* Admin Functions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tenants Management */}
        <Link to="/SystemAdminTenants" className="group">
          <div className="p-6 bg-[#3a3a3a] rounded-lg border border-[#555] hover:border-[#22c55e] transition-all cursor-pointer group-hover:bg-[#404040]">
            <Building2 className="w-8 h-8 text-[#22c55e] mb-3" />
            <h3 className="font-semibold text-gray-100 mb-2">Tenant Verwaltung</h3>
            <p className="text-sm text-gray-400">Alle Tenants verwalten, Status ändern, Features konfigurieren</p>
            <p className="text-xs text-gray-500 mt-4 group-hover:text-[#22c55e]">Zur Verwaltung →</p>
          </div>
        </Link>

        {/* Registrations */}
        <Link to="/AdminNewRegistrations" className="group">
          <div className="p-6 bg-[#3a3a3a] rounded-lg border border-[#555] hover:border-[#22c55e] transition-all cursor-pointer group-hover:bg-[#404040]">
            <Users className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="font-semibold text-gray-100 mb-2">Neue Registrierungen</h3>
            <p className="text-sm text-gray-400">Benutzer freigeben und zu Tenants hinzufügen</p>
            <p className="text-xs text-gray-500 mt-4 group-hover:text-blue-400">Zu Registrierungen →</p>
          </div>
        </Link>

        {/* Billing */}
        <Link to="/SystemAdminBilling" className="group">
          <div className="p-6 bg-[#3a3a3a] rounded-lg border border-[#555] hover:border-[#22c55e] transition-all cursor-pointer group-hover:bg-[#404040]">
            <DollarSign className="w-8 h-8 text-yellow-400 mb-3" />
            <h3 className="font-semibold text-gray-100 mb-2">Abrechnung</h3>
            <p className="text-sm text-gray-400">Rechnungen, Zahlungen und Abonnements verwalten</p>
            <p className="text-xs text-gray-500 mt-4 group-hover:text-yellow-400">Zur Abrechnung →</p>
          </div>
        </Link>

        {/* Person Tracking */}
        <Link to="/AdminPersonTracking" className="group">
          <div className="p-6 bg-[#3a3a3a] rounded-lg border border-[#555] hover:border-[#22c55e] transition-all cursor-pointer group-hover:bg-[#404040]">
            <TrendingUp className="w-8 h-8 text-[#22c55e] mb-3" />
            <h3 className="font-semibold text-gray-100 mb-2">Person Tracking</h3>
            <p className="text-sm text-gray-400">GPS-Positionen von Personen auf der Karte verfolgen</p>
            <p className="text-xs text-gray-500 mt-4 group-hover:text-[#22c55e]">Zur Karte →</p>
          </div>
        </Link>
      </div>

      {/* Recent Tenants */}
      <div className="p-6 bg-[#3a3a3a] rounded-lg border border-[#555]">
        <h3 className="font-semibold text-gray-100 mb-4">Kürzlich erstellte Tenants</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {tenants.slice(0, 5).map(tenant => (
            <div key={tenant.id} className="flex items-center justify-between p-3 bg-[#2d2d2d] rounded border border-[#444]">
              <div>
                <p className="font-medium text-gray-100">{tenant.name}</p>
                <p className="text-xs text-gray-500">{tenant.contact_email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  tenant.status === 'active' ? 'bg-green-900 text-green-200' :
                  tenant.status === 'trial' ? 'bg-yellow-900 text-yellow-200' :
                  'bg-gray-700 text-gray-300'
                }`}>
                  {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                </span>
                <span className="text-xs text-gray-400 px-2 py-1 bg-[#3a3a3a] rounded">
                  {tenant.plan}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}