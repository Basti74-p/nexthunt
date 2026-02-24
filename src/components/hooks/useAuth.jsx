import { useState, useEffect, createContext, useContext } from "react";
import { base44 } from "@/api/base44Client";

const AuthContext = createContext(null);

// Persist selected tenant for platform admins across navigation
const ADMIN_TENANT_KEY = "nh_admin_selected_tenant";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [adminSelectedTenant, setAdminSelectedTenant] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ADMIN_TENANT_KEY)) || null; } catch { return null; }
  });
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

      const SYSTEM_ADMIN_EMAILS_CHECK = ["sebastianpedde2@gmail.com"];
      if (me.role === "platform_admin" || me.role === "admin" || SYSTEM_ADMIN_EMAILS_CHECK.includes(me.email)) {
        setLoading(false);
        return;
      }

      // Primary: tenant_id on user object
      // Fallback 1: look up tenant via TenantMember email match
      // Fallback 2: look up tenant where user is the contact_email (owner)
      let tid = me.tenant_id;
      let isContactEmailOwner = false;
      
      if (!tid) {
        const memberRecords = await base44.entities.TenantMember.filter({ user_email: me.email });
        if (memberRecords.length > 0) {
          tid = memberRecords[0].tenant_id;
        } else {
          // Check if user email matches a tenant's contact_email (owner scenario)
          const ownerTenants = await base44.entities.Tenant.filter({ contact_email: me.email });
          if (ownerTenants.length > 0) {
            tid = ownerTenants[0].id;
            isContactEmailOwner = true;
          }
        }
      }

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
                } else if (isContactEmailOwner) {
                  // User is tenant owner via contact_email but no TenantMember exists yet
                  // Create a virtual tenant_member object to indicate ownership
                  setTenantMember({
                    role: "tenant_owner",
                    perm_wildmanagement: true,
                    perm_strecke: true,
                    perm_wildkammer: true,
                    perm_kalender: true,
                    perm_aufgaben: true,
                    perm_personen: true,
                    perm_oeffentlichkeit: true,
                    perm_einrichtungen: true,
                  });
                  setUserPermissions({
                    perm_wildmanagement: true,
                    perm_strecke: true,
                    perm_wildkammer: true,
                    perm_kalender: true,
                    perm_aufgaben: true,
                    perm_personen: true,
                    perm_oeffentlichkeit: true,
                    perm_einrichtungen: true,
                    allowed_reviere: [],
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

  // For platform admins: the "active" tenant is the manually selected one
  const activeTenant = isPlatformAdmin ? (adminSelectedTenant || tenant) : tenant;

  const switchTenant = async (tenantObj) => {
    setAdminSelectedTenant(tenantObj);
    try { localStorage.setItem(ADMIN_TENANT_KEY, JSON.stringify(tenantObj)); } catch {}
  };

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
   * If no tenantMember record found but tenant is loaded, default to allowing access
   * (owner scenario where TenantMember record may not have been created yet).
   */
  const hasPermission = (perm) => {
    if (isPlatformAdmin || isTenantOwner) return true;
    // If tenant is loaded but no member record exists yet, allow access (owner fallback)
    if (tenant && !tenantMember) return true;
    return userPermissions[perm] === true;
  };

  /**
   * Combined check: license enabled (from Tenant feature flags) AND user has permission.
   * Important: undefined feature flags default to true (opt-out model) except
   * for features that are explicitly opt-in (wildkammer, driven_hunt, public_portal, wildmarken).
   */
  const canAccess = (module) => {
    if (isPlatformAdmin) return true;
    const tf = tenantFeatures;
    const licenseMap = {
      dashboard: tf.feature_dashboard !== false,
      reviere: tf.feature_reviere !== false,
      wildmanagement: tf.feature_sightings !== false,
      strecke: tf.feature_strecke !== false,
      wildkammer: tf.feature_wildkammer === true,
      kalender: tf.feature_kalender !== false,
      aufgaben: tf.feature_tasks !== false,
      personen: tf.feature_personen !== false,
      oeffentlichkeit: tf.feature_public_portal === true,
      einrichtungen: tf.feature_einrichtungen !== false,
      map: tf.feature_map !== false,
    };
    const licensed = licenseMap[module] !== false;
    return licensed && hasPermission(`perm_${module}`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant: activeTenant,
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
        switchTenant,
        adminSelectedTenant,
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