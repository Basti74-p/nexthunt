import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import PageHeader from "@/components/ui/PageHeader";
import { AlertCircle, Building2, Users, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function SystemAdminDashboard() {
  const { user, isPlatformAdmin } = useAuth();

  // Fetch all tenants
  const { data: tenants = [] } = useQuery({
    queryKey: ["allTenants"],
    queryFn: () => base44.entities.Tenant.list(),
    enabled: isPlatformAdmin,
  });

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

  const StatCard = ({ icon: Icon, title, value, color = "blue" }) => {
    const colorMap = {
      blue: { icon: "text-blue-400", bg: "bg-blue-900/20" },
      green: { icon: "text-[#22c55e]", bg: "bg-green-900/20" },
      red: { icon: "text-red-400", bg: "bg-red-900/20" },
      yellow: { icon: "text-yellow-400", bg: "bg-yellow-900/20" },
    };

    return (
      <div className={`p-6 ${colorMap[color].bg} rounded-lg border border-[#555]`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-2">{title}</p>
            <p className="text-4xl font-bold text-gray-100">{value}</p>
          </div>
          <Icon className={`w-8 h-8 ${colorMap[color].icon}`} />
        </div>
      </div>
    );
  };

  const planCounts = {
    starter: tenants.filter(t => t.plan === "starter").length,
    pro: tenants.filter(t => t.plan === "pro").length,
    enterprise: tenants.filter(t => t.plan === "enterprise").length,
  };

  const recentTenants = tenants.slice(0, 10);

  return (
    <div className="space-y-8">
      <PageHeader
        title="System-Dashboard"
        subtitle="Plattform-Übersicht NextHunt"
      />

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          title="Kunden gesamt"
          value={tenants.length}
          color="blue"
        />
        <StatCard
          icon={Users}
          title="Aktiv"
          value={tenants.filter(t => t.status === "active").length}
          color="green"
        />
        <StatCard
          icon={AlertCircle}
          title="Gesperrt"
          value={tenants.filter(t => t.status === "suspended").length}
          color="red"
        />
        <StatCard
          icon={BarChart3}
          title="Offene Tickets"
          value="0"
          color="yellow"
        />
      </div>

      {/* Packages & Support Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pakete */}
        <div className="p-6 bg-[#3a3a3a] rounded-lg border border-[#555]">
          <h3 className="font-semibold text-gray-100 mb-6">Pakete</h3>
          <div className="space-y-5">
            {[
              { name: "Starter", count: planCounts.starter },
              { name: "Pro", count: planCounts.pro },
              { name: "Enterprise", count: planCounts.enterprise },
            ].map((pkg) => (
              <div key={pkg.name}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">{pkg.name}</span>
                  <span className="text-sm font-semibold text-gray-100">{pkg.count}</span>
                </div>
                <div className="w-full h-2 bg-[#2d2d2d] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#22c55e] rounded-full transition-all"
                    style={{ width: `${pkg.count > 0 ? Math.min(100, (pkg.count / Math.max(tenants.length, 1)) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support-Tickets */}
        <div className="p-6 bg-[#3a3a3a] rounded-lg border border-[#555]">
          <h3 className="font-semibold text-gray-100 mb-6">Support-Tickets</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center px-4 py-3 bg-[#2d2d2d] rounded">
              <span className="text-sm text-gray-300">Offen</span>
              <span className="text-sm font-semibold text-gray-100">0</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-[#2d2d2d] rounded">
              <span className="text-sm text-gray-300">In Bearbeitung</span>
              <span className="text-sm font-semibold text-yellow-400">0</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-[#2d2d2d] rounded">
              <span className="text-sm text-gray-300">Gelöst / Geschlossen</span>
              <span className="text-sm font-semibold text-[#22c55e]">1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zuletzt angelegte Kunden */}
      <div className="p-6 bg-[#3a3a3a] rounded-lg border border-[#555]">
        <h3 className="font-semibold text-gray-100 mb-6">Zuletzt angelegte Kunden</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recentTenants.map((tenant) => (
            <div key={tenant.id} className="flex items-center justify-between p-4 bg-[#2d2d2d] rounded border border-[#444] hover:border-[#555] transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-black">{tenant.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-100 truncate">{tenant.name}</p>
                  <p className="text-xs text-gray-500 truncate">{tenant.contact_email}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold ml-3 flex-shrink-0 ${
                tenant.status === 'active' ? 'text-[#22c55e]' :
                tenant.status === 'trial' ? 'text-yellow-400' :
                tenant.status === 'suspended' ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {tenant.status === 'active' ? 'Aktiv' :
                 tenant.status === 'trial' ? 'Trial' :
                 tenant.status === 'suspended' ? 'Gesperrt' :
                 'Inaktiv'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}