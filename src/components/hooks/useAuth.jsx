import { useState, useEffect, createContext, useContext } from "react";
import { base44 } from "@/api/base44Client";

const AuthContext = createContext(null);

// Persist selected tenant for platform admins across navigation
const ADMIN_TENANT_KEY = "nh_admin_selected_tenant";

const USER_TENANT_KEY = "nh_user_selected_tenant";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [availableTenants, setAvailableTenants] = useState([]);
  const [adminSelectedTenant, setAdminSelectedTenant] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ADMIN_TENANT_KEY)) || null; } catch { return null; }
  });
  const [userSelectedTenantId, setUserSelectedTenantId] = useState(() => {
    try { return localStorage.getItem(USER_TENANT_KEY) || null; } catch { return null; }
  });
  const [tenantMember, setTenantMember] = useState(null);
  const [tenantFeatures, setTenantFeatures] = useState({});
  const [userPermissions, setUserPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
    // Reload tenant data every 60 seconds so admin feature changes take effect without full page reload
    const interval = setInterval(loadUser, 60_000);
    return () => clearInterval(interval);
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

      // Collect all tenants this user belongs to
      const [memberRecords, ownerTenants] = await Promise.all([
        base44.entities.TenantMember.filter({ user_email: me.email }),
        base44.entities.Tenant.filter({ contact_email: me.email }),
      ]);

      // Build list of all tenant IDs
      const memberTenantIds = memberRecords.map(m => m.tenant_id);
      const ownerTenantIds = ownerTenants.map(t => t.id).filter(id => !memberTenantIds.includes(id));
      const allTenantIds = [...new Set([
        ...(me.tenant_id ? [me.tenant_id] : []),
        ...memberTenantIds,
        ...ownerTenantIds,
      ])];

      if (allTenantIds.length === 0) {
        setLoading(false);
        return;
      }

      // Load all tenant objects
      const allTenantObjects = await Promise.all(
        allTenantIds.map(id => base44.entities.Tenant.filter({ id }))
      );
      const allTenants = allTenantObjects.flat().filter(Boolean);
      setAvailableTenants(allTenants);

      // Pick active tenant: user-selected > first in list
      let activeTid = userSelectedTenantId && allTenantIds.includes(userSelectedTenantId)
        ? userSelectedTenantId
        : allTenantIds[0];

      const applyTenant = (tid) => {
        const t = allTenants.find(t => t.id === tid);
        if (!t) return;
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

        const m = memberRecords.find(m => m.tenant_id === tid);
        const isOwner = !m || m.role === "tenant_owner" || ownerTenantIds.includes(tid);

        if (m) {
          setTenantMember(m);
          setUserPermissions({
            perm_wildmanagement: isOwner || m.perm_wildmanagement !== false,
            perm_strecke: isOwner || m.perm_strecke !== false,
            perm_wildkammer: isOwner || m.perm_wildkammer === true,
            perm_kalender: isOwner || m.perm_kalender !== false,
            perm_aufgaben: isOwner || m.perm_aufgaben !== false,
            perm_personen: isOwner || m.perm_personen === true,
            perm_oeffentlichkeit: isOwner || m.perm_oeffentlichkeit === true,
            perm_einrichtungen: isOwner || m.perm_einrichtungen !== false,
            allowed_reviere: isOwner ? [] : (m.allowed_reviere || []),
          });
        } else {
          // Owner via contact_email without TenantMember record
          setTenantMember({ role: "tenant_owner" });
          setUserPermissions({
            perm_wildmanagement: true, perm_strecke: true, perm_wildkammer: true,
            perm_kalender: true, perm_aufgaben: true, perm_personen: true,
            perm_oeffentlichkeit: true, perm_einrichtungen: true, allowed_reviere: [],
          });
        }
      };

      applyTenant(activeTid);
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

  // For regular users: switch between their available tenants
  const switchUserTenant = (tenantObj) => {
    try { localStorage.setItem(USER_TENANT_KEY, tenantObj.id); } catch {}
    setUserSelectedTenantId(tenantObj.id);
    loadUser();
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
   * Combined check: nav_* flag on Tenant (direct per-menu control).
   * nav_* flags are boolean fields on the Tenant entity.
   * If the flag doesn't exist yet (old tenants), default to true.
   * Platform admins always have full access.
   */
  const canAccess = (module) => {
    if (isPlatformAdmin) return true;
    // nav_* flags: direct per-menu-item control
    if (module.startsWith("nav_")) {
      const t = activeTenant || tenant;
      if (!t) return false;
      const val = t[module];
      return val !== false; // default true if not set
    }
    // Legacy feature_* fallback for any old code still using old module names
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
        switchUserTenant,
        adminSelectedTenant,
        availableTenants,
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