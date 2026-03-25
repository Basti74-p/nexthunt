import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";

export default function DebugUserAccess() {
  const { user, tenant } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        if (!user?.email) {
          setError("Kein User eingeloggt");
          return;
        }
        const res = await base44.functions.invoke('debugUserAccess', { email: user.email });
        setData(res.data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  if (loading) return <div className="p-8">Lädt...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-100">Debug: User Access</h1>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-red-300">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <section className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-lg p-4">
            <h2 className="font-bold text-gray-100 mb-3">Nutzer</h2>
            <pre className="text-sm text-gray-300 bg-[#0a0a0a] p-3 rounded overflow-auto">
              {JSON.stringify(data.user, null, 2)}
            </pre>
          </section>

          <section className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-lg p-4">
            <h2 className="font-bold text-gray-100 mb-3">TenantMember</h2>
            <pre className="text-sm text-gray-300 bg-[#0a0a0a] p-3 rounded overflow-auto">
              {JSON.stringify(data.tenantMember, null, 2)}
            </pre>
          </section>

          <section className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-lg p-4">
            <h2 className="font-bold text-gray-100 mb-3">Reviere</h2>
            <pre className="text-sm text-gray-300 bg-[#0a0a0a] p-3 rounded overflow-auto">
              {JSON.stringify(data.reviere, null, 2)}
            </pre>
          </section>

          <section className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-lg p-4">
            <h2 className="font-bold text-gray-100 mb-3">Einrichtungen Pro Revier</h2>
            <pre className="text-sm text-gray-300 bg-[#0a0a0a] p-3 rounded overflow-auto">
              {JSON.stringify(data.einrichtungen_by_revier, null, 2)}
            </pre>
          </section>

          <section className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-lg p-4">
            <h2 className="font-bold text-gray-100 mb-3">Zusammenfassung</h2>
            <div className="text-gray-300 space-y-2 text-sm">
              <p><span className="text-gray-400">Gesamt Einrichtungen:</span> {data.einrichtungen_total}</p>
              <p><span className="text-gray-400">Sichtbare Einrichtungen:</span> {data.einrichtungen_visible}</p>
              <p><span className="text-gray-400">Allowed Reviere:</span> {data.tenantMember.allowed_reviere_count === 0 ? "Alle" : data.tenantMember.allowed_reviere_count}</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}