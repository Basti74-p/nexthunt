import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, Shield, ArrowRight, Phone, BookUser, MapPin } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import RevierMembersManager from "@/components/personen/RevierMembersManager";
import { useI18n } from "@/lib/i18n";

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
  useEffect(() => {
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
          className="bg-[#3a3a3a] rounded-2xl border border-[#4a4a4a] shadow-sm p-6 hover:border-[#22c55e]/30 hover:shadow-md transition-all group flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-900/30 flex items-center justify-center">
              <BookUser className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-100 group-hover:text-[#22c55e]">Adressbuch</h3>
              <p className="text-sm text-gray-400">{persons.length} Personen</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-[#22c55e]" />
        </Link>

        <Link to={createPageUrl("TenantMembers")}
          className="bg-[#3a3a3a] rounded-2xl border border-[#4a4a4a] shadow-sm p-6 hover:border-[#22c55e]/30 hover:shadow-md transition-all group flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-900/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-100 group-hover:text-[#22c55e]">Berechtigungen</h3>
              <p className="text-sm text-gray-400">{members.length} Mitglieder</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-[#22c55e]" />
        </Link>
      </div>

      {/* Revier Members Management */}
      {reviere.length > 0 && (
        <div className="bg-[#3a3a3a] rounded-2xl border border-[#4a4a4a] shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#22c55e]" /> Reviermitglieder verwalten
          </h2>
          <div className="space-y-2 mb-6">
            <p className="text-sm text-gray-400">Wählen Sie ein Revier aus, um Mitglieder zu verwalten:</p>
            <div className="flex flex-wrap gap-2">
              {reviere.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRevier(r.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedRevier === r.id
                      ? "bg-[#22c55e] text-black"
                      : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
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
        <div className="bg-[#3a3a3a] rounded-2xl border border-[#4a4a4a] shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Letzte Personen</h2>
          <div className="space-y-3">
            {persons.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#2a2a2a]">
                <div className="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center text-sm font-bold text-green-400">
                  {p.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-100">{p.name}</p>
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