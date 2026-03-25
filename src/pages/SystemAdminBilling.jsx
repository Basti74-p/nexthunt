import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import PageHeader from "@/components/ui/PageHeader";
import { AlertCircle, DollarSign, Download, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SystemAdminBilling() {
  const { user, isPlatformAdmin } = useAuth();
  const [searchTenant, setSearchTenant] = useState("");
  const [billingData, setBillingData] = useState([]);

  // Fetch all tenants
  const { data: tenants = [] } = useQuery({
    queryKey: ["allTenants"],
    queryFn: () => base44.entities.Tenant.list(),
    enabled: isPlatformAdmin,
  });

  // Calculate billing info per tenant
  useEffect(() => {
    const billing = tenants
      .filter(t => !searchTenant || t.name.toLowerCase().includes(searchTenant.toLowerCase()))
      .map(tenant => {
        const monthlyPrice = {
          starter: 29,
          pro: 79,
          enterprise: 299,
          free_trial: 0,
        }[tenant.plan] || 0;

        const daysActive = Math.floor((Date.now() - new Date(tenant.created_date).getTime()) / (1000 * 60 * 60 * 24));
        const monthsActive = Math.max(1, Math.floor(daysActive / 30));
        const estimatedRevenue = monthlyPrice * monthsActive;

        return {
          ...tenant,
          monthlyPrice,
          monthsActive,
          estimatedRevenue,
          nextBillingDate: new Date(new Date(tenant.created_date).getTime() + (monthsActive * 30 * 24 * 60 * 60 * 1000)),
        };
      });

    setBillingData(billing);
  }, [tenants, searchTenant]);

  const totalMonthlyRevenue = billingData.reduce((sum, t) => sum + t.monthlyPrice, 0);
  const totalEstimatedRevenue = billingData.reduce((sum, t) => sum + t.estimatedRevenue, 0);

  if (!isPlatformAdmin) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 p-4 bg-red-950 border border-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-200">Nur Administratoren können auf diese Seite zugreifen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Abrechnung & Rechnungen"
        subtitle="Alle Tenant-Abrechnungen verwalten"
      />

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-[#3a3a3a] rounded-lg border border-[#555]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Monatlich wiederkehrend</p>
              <p className="text-3xl font-bold text-gray-100">€{totalMonthlyRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-[#22c55e]" />
          </div>
        </div>

        <div className="p-6 bg-[#3a3a3a] rounded-lg border border-[#555]">
          <div>
            <p className="text-sm text-gray-400 mb-1">Geschätzter Gesamtumsatz</p>
            <p className="text-3xl font-bold text-gray-100">€{totalEstimatedRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="p-6 bg-[#3a3a3a] rounded-lg border border-[#555]">
          <div>
            <p className="text-sm text-gray-400 mb-1">Aktive zahlende Tenants</p>
            <p className="text-3xl font-bold text-gray-100">
              {billingData.filter(t => t.status === "active" && t.plan !== "free_trial").length}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div>
        <Input
          placeholder="Nach Tenant suchen..."
          value={searchTenant}
          onChange={(e) => setSearchTenant(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Billing Table */}
      <div className="overflow-x-auto bg-[#3a3a3a] rounded-lg border border-[#555]">
        <table className="w-full">
          <thead className="border-b border-[#555] bg-[#2d2d2d]">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-gray-300">Tenant</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-300">Plan</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-300">Status</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-300">Monatlich</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-300">Monate aktiv</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-300">Geschätzt</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-300">Nächste Abrechnung</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-300">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#555]">
            {billingData.map(tenant => (
              <tr key={tenant.id} className="hover:bg-[#404040] transition-colors">
                <td className="p-4">
                  <div>
                    <p className="font-medium text-gray-100">{tenant.name}</p>
                    <p className="text-xs text-gray-500">{tenant.contact_email}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-sm text-gray-300 capitalize">{tenant.plan}</span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    tenant.status === 'active' ? 'bg-green-900 text-green-200' :
                    tenant.status === 'trial' ? 'bg-yellow-900 text-yellow-200' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-300">€{tenant.monthlyPrice.toFixed(2)}</td>
                <td className="p-4 text-sm text-gray-300">{tenant.monthsActive}</td>
                <td className="p-4 text-sm text-gray-300">€{tenant.estimatedRevenue.toFixed(2)}</td>
                <td className="p-4 text-sm text-gray-400">{tenant.nextBillingDate.toLocaleDateString("de-DE")}</td>
                <td className="p-4">
                  <Button size="sm" variant="ghost" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Rechnung
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export */}
      <div className="flex gap-3">
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Als CSV exportieren
        </Button>
      </div>
    </div>
  );
}