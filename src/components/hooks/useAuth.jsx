import { useState, useEffect, createContext, useContext } from "react";
import { base44 } from "@/api/base44Client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [tenantMember, setTenantMember] = useState(null);
  const [tenantFeatures, setTenantFeatures] = useState({});
  const [userPermissions, setUserPermissions] = useState({});
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

      const tid = me.tenant_id;
      if (tid) {
        const [tenants, members] = await Promise.all([
          base44.entities.Tenant.filter({ id: tid }),
          base44.entities.TenantMember.filter({ tenant_id: tid, user_email: me.email }),
        ]);

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

        if (members.length > 0) {
          const m = members[0];
          setTenantMember(m);
          // tenant_owner gets all permissions by default
          const isOwner = m.role === "tenant_owner";
          setUserPermissions({
            perm_wildmanagement: isOwner || m.perm_wildmanagement !== false,
            perm_strecke: isOwner || m.perm_strecke !== false,
            perm_wildkammer: isOwner || m.perm_wildkammer === true,
            perm_kalender: isOwner || m.perm_kalender !== false,
            perm_aufgaben: isOwner || m.perm_aufgaben !== false,
            perm_personen: isOwner || m.perm_personen === true,
            perm_oeffentlichkeit: isOwner || m.perm_oeffentlichkeit === true,
            perm_einrichtungen: isOwner || m.perm_einrichtungen !== false,
            allowed_reviere: isOwner ? [] : (m.allowed_reviere || []), // empty = all
          });
        }
      }
    } catch (e) {
      console.error("Auth error", e);
    } finally {
      setLoading(false);
    }
  };

  const SYSTEM_ADMIN_EMAILS = ["sebastianpedde2@gmail.com"];
  const isPlatformAdmin = user?.role === "platform_admin" || user?.role === "admin" || SYSTEM_ADMIN_EMAILS.includes(user?.email);
  const isTenantOwner = tenantMember?.role === "tenant_owner";
  const isTenantMember = !!tenantMember || !!user?.tenant_id;

  /**
   * Check if the current user can access a specific revier.
   * tenant_owner and platform_admin can always access all.
   */
  const canAccessRevier = (revierId) => {
    if (isPlatformAdmin || isTenantOwner) return true;
    const allowed = userPermissions.allowed_reviere || [];
    if (allowed.length === 0) return true; // no restriction = all
    return allowed.includes(revierId);
  };

  /**
   * Check if the user has a specific module permission.
   * tenant_owner and platform_admin always have full access.
   * Also checks license-level feature flags from tenant.
   */
  const hasPermission = (perm) => {
    if (isPlatformAdmin || isTenantOwner) return true;
    return userPermissions[perm] === true;
  };

  /**
   * Combined check: license enabled AND user has permission.
   */
  const canAccess = (module) => {
    const licenseMap = {
      wildmanagement: tenantFeatures.feature_sightings,
      strecke: tenantFeatures.feature_strecke,
      wildkammer: tenantFeatures.feature_wildkammer,
      kalender: true,
      aufgaben: tenantFeatures.feature_tasks,
      personen: true,
      oeffentlichkeit: tenantFeatures.feature_public_portal,
      einrichtungen: true,
      map: tenantFeatures.feature_map,
    };
    const licensed = licenseMap[module] !== false;
    return licensed && hasPermission(`perm_${module}`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        tenantMember,
        tenantFeatures,
        userPermissions,
        loading,
        isPlatformAdmin,
        isTenantOwner,
        isTenantMember,
        canAccess,
        canAccessRevier,
        hasPermission,
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