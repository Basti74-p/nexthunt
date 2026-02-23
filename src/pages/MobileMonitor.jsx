import React from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Radio, MapPin, Eye, Crosshair, Truck, Search } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";

export default function MobileMonitor() {
  const { tenant, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assignments = [] } = useQuery({
    queryKey: ["my-assignments", user?.email],
    queryFn: async () => {
      const all = await base44.entities.JagdEventAssignment.filter({ user_email: user.email, tenant_id: tenant.id });
      return all;
    },
    enabled: !!user?.email && !!tenant?.id,
  });

  const { data: activeEvents = [] } = useQuery({
    queryKey: ["active-events", tenant?.id],
    queryFn: () => base44.entities.JagdEvent.filter({ tenant_id: tenant.id, status: "active" }),
    enabled: !!tenant?.id,
  });

  // Find assignment for active event
  const activeAssignment = assignments.find(a =>
    activeEvents.some(e => e.id === a.jagd_event_id)
  );
  const activeEvent = activeEvents.find(e => e.id === activeAssignment?.jagd_event_id);

  const updateStatusMutation = useMutation({
    mutationFn: (status) => base44.entities.JagdEventAssignment.update(activeAssignment.id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-assignments"] }),
  });

  if (!activeAssignment || !activeEvent) {
    return (
      <div className="pt-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Jagdmonitor</h2>
        <EmptyState
          icon={Radio}
          title="Kein aktives Event"
          description="Sie sind aktuell keiner aktiven Gesellschaftsjagd zugewiesen."
        />
      </div>
    );
  }

  const ROLE_LABELS = {
    schuetze: "Schütze",
    ansteller: "Ansteller",
    bergetrupp: "Bergetrupp",
    nachsuchetrupp: "Nachsuchetrupp",
  };

  const actions = [
    { label: "Stand bezogen", icon: MapPin, status: "stand_bezogen", color: "bg-blue-600 hover:bg-blue-700" },
    { label: "Sichtung melden", icon: Eye, color: "bg-emerald-600 hover:bg-emerald-700" },
    { label: "Schuss melden", icon: Crosshair, color: "bg-amber-600 hover:bg-amber-700" },
    { label: "Bergung anfordern", icon: Truck, color: "bg-orange-600 hover:bg-orange-700" },
    { label: "Nachsuche anfordern", icon: Search, color: "bg-red-600 hover:bg-red-700" },
  ];

  return (
    <div className="pt-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Jagdmonitor</h2>

      {/* Event Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">{activeEvent.title}</h3>
          <StatusBadge status="aktiv" />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Ihre Rolle</p>
            <p className="font-medium text-gray-900">{ROLE_LABELS[activeAssignment.role] || activeAssignment.role}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Stand</p>
            <p className="font-medium text-gray-900">{activeAssignment.stand_label || "—"}</p>
          </div>
        </div>
        <div className="mt-3">
          <StatusBadge status={activeAssignment.status} />
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {actions.map(({ label, icon: Icon, status, color }) => (
          <Button
            key={label}
            onClick={() => status ? updateStatusMutation.mutate(status) : null}
            className={`w-full h-14 rounded-xl text-white font-medium gap-3 text-base ${color || "bg-[#0F2F23] hover:bg-[#1a4a36]"}`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Button>
        ))}
      </div>

      {/* Live feed placeholder */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-2">Live-Feed</h3>
        <p className="text-sm text-gray-500">Echtzeit-Meldungen werden hier angezeigt...</p>
      </div>
    </div>
  );
}