import { useState, useEffect, createContext, useContext } from "react";
import { base44 } from "@/api/base44Client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [tenantMember, setTenantMember] = useState(null);
  const [tenantFeatures, setTenantFeatures] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);

      if (me.role === "platform_admin") {
        setLoading(false);
        return;
      }

      if (me.tenant_id) {
        const tenants = await base44.entities.Tenant.filter({ id: me.tenant_id });
        if (tenants.length > 0) {
          const t = tenants[0];
          setTenant(t);
          setTenantFeatures({
            feature_map: t.feature_map !== false,
            feature_sightings: t.feature_sightings !== false,
            feature_strecke: t.feature_strecke !== false,
            feature_wildkammer: t.feature_wildkammer === true,
            feature_tasks: t.feature_tasks !== false,
            feature_driven_hunt: t.feature_driven_hunt === true,
            feature_public_portal: t.feature_public_portal === true,
            feature_wildmarken: t.feature_wildmarken === true,
          });
        }

        const members = await base44.entities.TenantMember.filter({
          tenant_id: me.tenant_id,
          user_email: me.email,
        });
        if (members.length > 0) {
          setTenantMember(members[0]);
        }
      }
    } catch (e) {
      console.error("Auth error", e);
    } finally {
      setLoading(false);
    }
  };

  const isPlatformAdmin = user?.role === "platform_admin";
  const isTenantOwner = tenantMember?.role === "tenant_owner" || user?.tenant_role === "tenant_owner";
  const isTenantMember = !!tenantMember || !!user?.tenant_id;

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        tenantMember,
        tenantFeatures,
        loading,
        isPlatformAdmin,
        isTenantOwner,
        isTenantMember,
        reload: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}