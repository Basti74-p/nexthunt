import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, Shield, ArrowRight, Phone, BookUser, MapPin } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import RevierMembersManager from "@/components/personen/RevierMembersManager";

export default function Personen() {
  const { tenant } = useAuth();
  const [selectedRevier, setSelectedRevier] = useState(null);
  const [autoSelected, setAutoSelected] = useState(false);

  const { data: persons = [] } = useQuery({
    queryKey: ["persons-main", tenant?.id],
    queryFn: () => base44.entities.Person.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members-main", tenant?.id],
    queryFn: () => base44.entities.TenantMember.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const { data: reviere = [] } = useQuery({
    queryKey: ["reviere-members", tenant?.id],
    queryFn: () => base44.entities.Revier.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  // Auto-select first revier
  React.useEffect(() => {
    if (reviere.length > 0 && !autoSelected) {
      setSelectedRevier(reviere[0].id);
      setAutoSelected(true);
    }
  }, [reviere, autoSelected]);

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Personen" subtitle="Mitglieder, Gäste und Berechtigungen" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link to={createPageUrl("Persons")}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-[#0F2F23]/20 hover:shadow-md transition-all group flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <BookUser className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#0F2F23]">Adressbuch</h3>
              <p className="text-sm text-gray-500">{persons.length} Personen</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#0F2F23]" />
        </Link>

        <Link to={createPageUrl("TenantMembers")}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-[#0F2F23]/20 hover:shadow-md transition-all group flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0F2F23]/5 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#0F2F23]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#0F2F23]">Berechtigungen</h3>
              <p className="text-sm text-gray-500">{members.length} Mitglieder</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#0F2F23]" />
        </Link>
      </div>

      {/* Revier Members Management */}
      {reviere.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#0F2F23]" /> Reviermitglieder verwalten
          </h2>
          <div className="space-y-2 mb-6">
            <p className="text-sm text-gray-600">Wählen Sie ein Revier aus, um Mitglieder zu verwalten:</p>
            <div className="flex flex-wrap gap-2">
              {reviere.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRevier(r.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedRevier === r.id
                      ? "bg-[#0F2F23] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
          
          {selectedRevier && (
            <RevierMembersManager revierId={selectedRevier} />
          )}
        </div>
      )}

      {/* Recent persons */}
      {persons.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Letzte Personen</h2>
          <div className="space-y-3">
            {persons.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-[#0F2F23]/10 flex items-center justify-center text-sm font-bold text-[#0F2F23]">
                  {p.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{p.type}</p>
                </div>
                {p.phone && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}