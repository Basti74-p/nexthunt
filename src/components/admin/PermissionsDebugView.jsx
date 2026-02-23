import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  User, Building2, Shield, Eye, EyeOff, CheckCircle2, XCircle, 
  AlertCircle, ChevronRight, Search, Loader2, Map, Target, Calendar,
  Users as UsersIcon, Layers, FileText, Globe, Home, Edit2, Save, RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: Home, module: null },
  { id: "reviere", label: "Reviere", icon: Map, module: null },
  { id: "wildmanagement", label: "Wildmanagement", icon: Target, module: "wildmanagement" },
  { id: "strecke", label: "Strecke", icon: Layers, module: "strecke" },
  { id: "wildkammer", label: "Wildkammer", icon: Layers, module: "wildkammer" },
  { id: "kalender", label: "Jagdkalender", icon: Calendar, module: "kalender" },
  { id: "aufgaben", label: "Aufgaben", icon: FileText, module: "aufgaben" },
  { id: "personen", label: "Personen", icon: UsersIcon, module: "personen" },
  { id: "oeffentlichkeit", label: "Öffentlichkeitsportal", icon: Globe, module: "oeffentlichkeit" },
  { id: "einrichtungen", label: "Jagdeinrichtungen", icon: Layers, module: "einrichtungen" },
];

function DebugBadge({ status, label }) {
  const styles = {
    visible: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    hidden: "bg-red-500/20 text-red-300 border-red-500/30",
    warning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status]}`}>
      {label}
    </span>
  );
}

function ReasonChip({ reason, type = "error" }) {
  const styles = {
    error: "bg-red-900/30 text-red-300 border-red-700",
    info: "bg-blue-900/30 text-blue-300 border-blue-700",
    success: "bg-emerald-900/30 text-emerald-300 border-emerald-700",
  };
  return (
    <div className={`text-xs px-2 py-1 rounded border ${styles[type]} flex items-center gap-1.5`}>
      <AlertCircle className="w-3 h-3" />
      <span>{reason}</span>
    </div>
  );
}

function UserDebugCard({ userEmail }) {
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedTenantFeatures, setEditedTenantFeatures] = useState({});
  const [editedUserPermissions, setEditedUserPermissions] = useState({});

  useEffect(() => {
    loadDebugData();
  }, [userEmail]);

  const loadDebugData = async () => {
    setLoading(true);
    try {
      // Find user
      const users = await base44.entities.User.filter({ email: userEmail });
      if (users.length === 0) {
        setDebugData({ error: "User nicht gefunden" });
        setLoading(false);
        return;
      }
      const user = users[0];

      // Find tenant via multiple fallbacks
      let tenant = null;
      let tenantMember = null;
      let tenantSource = null;

      // 1. user.tenant_id
      if (user.tenant_id) {
        const tenants = await base44.entities.Tenant.filter({ id: user.tenant_id });
        if (tenants.length > 0) {
          tenant = tenants[0];
          tenantSource = "user.tenant_id";
        }
      }

      // 2. TenantMember lookup
      if (!tenant) {
        const members = await base44.entities.TenantMember.filter({ user_email: user.email });
        if (members.length > 0) {
          tenantMember = members[0];
          const tenants = await base44.entities.Tenant.filter({ id: members[0].tenant_id });
          if (tenants.length > 0) {
            tenant = tenants[0];
            tenantSource = "TenantMember.tenant_id";
          }
        }
      }

      // 3. contact_email lookup
      if (!tenant) {
        const ownerTenants = await base44.entities.Tenant.filter({ contact_email: user.email });
        if (ownerTenants.length > 0) {
          tenant = ownerTenants[0];
          tenantSource = "Tenant.contact_email (Owner)";
        }
      }

      // Get TenantMember if we have tenant
      if (tenant && !tenantMember) {
        const members = await base44.entities.TenantMember.filter({ 
          tenant_id: tenant.id, 
          user_email: user.email 
        });
        if (members.length > 0) {
          tenantMember = members[0];
        }
      }

      // Calculate effective permissions
      const isPlatformAdmin = user.role === "platform_admin" || user.role === "admin";
      const isTenantOwner = tenantMember?.role === "tenant_owner";
      const isContactEmailOwner = tenant?.contact_email === user.email && !tenantMember;

      const tenantFeatures = tenant ? {
        feature_map: tenant.feature_map !== false,
        feature_sightings: tenant.feature_sightings !== false,
        feature_strecke: tenant.feature_strecke !== false,
        feature_wildkammer: tenant.feature_wildkammer === true,
        feature_tasks: tenant.feature_tasks !== false,
        feature_driven_hunt: tenant.feature_driven_hunt === true,
        feature_public_portal: tenant.feature_public_portal === true,
        feature_wildmarken: tenant.feature_wildmarken === true,
      } : {};

      const userPermissions = tenantMember ? {
        perm_wildmanagement: isTenantOwner || tenantMember.perm_wildmanagement !== false,
        perm_strecke: isTenantOwner || tenantMember.perm_strecke !== false,
        perm_wildkammer: isTenantOwner || tenantMember.perm_wildkammer === true,
        perm_kalender: isTenantOwner || tenantMember.perm_kalender !== false,
        perm_aufgaben: isTenantOwner || tenantMember.perm_aufgaben !== false,
        perm_personen: isTenantOwner || tenantMember.perm_personen === true,
        perm_oeffentlichkeit: isTenantOwner || tenantMember.perm_oeffentlichkeit === true,
        perm_einrichtungen: isTenantOwner || tenantMember.perm_einrichtungen !== false,
      } : (isContactEmailOwner ? {
        perm_wildmanagement: true,
        perm_strecke: true,
        perm_wildkammer: true,
        perm_kalender: true,
        perm_aufgaben: true,
        perm_personen: true,
        perm_oeffentlichkeit: true,
        perm_einrichtungen: true,
      } : {});

      setDebugData({
        user,
        tenant,
        tenantMember,
        tenantSource,
        isPlatformAdmin,
        isTenantOwner,
        isContactEmailOwner,
        tenantFeatures,
        userPermissions,
      });
      setEditedTenantFeatures(tenantFeatures);
      setEditedUserPermissions(userPermissions);
    } catch (error) {
      setDebugData({ error: error.message });
    }
    setLoading(false);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const updates = [];

      // Update Tenant features if changed
      if (tenant && JSON.stringify(editedTenantFeatures) !== JSON.stringify(debugData.tenantFeatures)) {
        await base44.entities.Tenant.update(tenant.id, {
          feature_map: editedTenantFeatures.feature_map,
          feature_sightings: editedTenantFeatures.feature_sightings,
          feature_strecke: editedTenantFeatures.feature_strecke,
          feature_wildkammer: editedTenantFeatures.feature_wildkammer,
          feature_tasks: editedTenantFeatures.feature_tasks,
          feature_driven_hunt: editedTenantFeatures.feature_driven_hunt,
          feature_public_portal: editedTenantFeatures.feature_public_portal,
          feature_wildmarken: editedTenantFeatures.feature_wildmarken,
        });
        updates.push("Tenant Features");
      }

      // Update TenantMember permissions if changed
      if (tenantMember && JSON.stringify(editedUserPermissions) !== JSON.stringify(debugData.userPermissions)) {
        await base44.entities.TenantMember.update(tenantMember.id, {
          perm_wildmanagement: editedUserPermissions.perm_wildmanagement,
          perm_strecke: editedUserPermissions.perm_strecke,
          perm_wildkammer: editedUserPermissions.perm_wildkammer,
          perm_kalender: editedUserPermissions.perm_kalender,
          perm_aufgaben: editedUserPermissions.perm_aufgaben,
          perm_personen: editedUserPermissions.perm_personen,
          perm_oeffentlichkeit: editedUserPermissions.perm_oeffentlichkeit,
          perm_einrichtungen: editedUserPermissions.perm_einrichtungen,
        });
        updates.push("User Permissions");
      }

      if (updates.length > 0) {
        toast.success(`Gespeichert: ${updates.join(", ")}`);
        await loadDebugData(); // Reload to show updated data
        setEditMode(false);
      } else {
        toast.info("Keine Änderungen zum Speichern");
      }
    } catch (error) {
      toast.error(`Fehler beim Speichern: ${error.message}`);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!debugData || debugData.error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 text-center">
        <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-300 text-sm">{debugData?.error || "Fehler beim Laden"}</p>
      </div>
    );
  }

  const { user, tenant, tenantMember, tenantSource, isPlatformAdmin, isTenantOwner, isContactEmailOwner, tenantFeatures, userPermissions } = debugData;

  // Use edited values for real-time preview
  const displayFeatures = editMode ? editedTenantFeatures : tenantFeatures;
  const displayPermissions = editMode ? editedUserPermissions : userPermissions;

  // Calculate menu visibility
  const menuAnalysis = MENU_ITEMS.map(item => {
    if (isPlatformAdmin) {
      return { ...item, visible: true, reason: "Platform Admin - voller Zugriff" };
    }

    if (!item.module) {
      return { ...item, visible: true, reason: "Basis-Menü (keine Module-Prüfung)" };
    }

    // Check license (use display values for real-time preview)
    const licenseMap = {
      wildmanagement: displayFeatures.feature_sightings !== false,
      strecke: displayFeatures.feature_strecke !== false,
      wildkammer: displayFeatures.feature_wildkammer === true,
      kalender: true,
      aufgaben: displayFeatures.feature_tasks !== false,
      personen: true,
      oeffentlichkeit: displayFeatures.feature_public_portal === true,
      einrichtungen: true,
    };

    const licensed = licenseMap[item.module];
    const hasPermission = displayPermissions[`perm_${item.module}`] === true;

    if (!tenant) {
      return { ...item, visible: false, reason: "Kein Tenant gefunden" };
    }

    if (!licensed) {
      return { ...item, visible: false, reason: `Feature "${item.module}" nicht im Tenant freigeschaltet` };
    }

    if (!hasPermission) {
      return { ...item, visible: false, reason: `User-Permission "perm_${item.module}" fehlt oder false` };
    }

    return { ...item, visible: true, reason: "Lizenz ✓ + Permission ✓" };
  });

  const visibleCount = menuAnalysis.filter(m => m.visible).length;
  const hiddenCount = menuAnalysis.filter(m => !m.visible).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">User Context</span>
          </div>
          <p className="text-sm font-semibold text-white">{user.full_name || user.email}</p>
          <p className="text-xs text-slate-500 mt-1">Role: {user.role}</p>
          {isPlatformAdmin && <DebugBadge status="visible" label="Platform Admin" />}
        </div>

        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Tenant</span>
          </div>
          {tenant ? (
            <>
              <p className="text-sm font-semibold text-white">{tenant.name}</p>
              <p className="text-xs text-slate-500 mt-1">Plan: {tenant.plan}</p>
              <p className="text-xs text-blue-300 mt-1">Via: {tenantSource}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-red-400">Nicht zugeordnet</p>
              <ReasonChip reason="Tenant fehlt komplett" type="error" />
            </>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">Member Status</span>
          </div>
          {tenantMember ? (
            <>
              <p className="text-sm font-semibold text-white">{tenantMember.first_name} {tenantMember.last_name}</p>
              <p className="text-xs text-slate-500 mt-1">Role: {tenantMember.role}</p>
              {isTenantOwner && <DebugBadge status="visible" label="Tenant Owner" />}
            </>
          ) : isContactEmailOwner ? (
            <>
              <p className="text-sm font-semibold text-amber-400">Owner (kein Member-Eintrag)</p>
              <ReasonChip reason="Fallback: contact_email match" type="warning" />
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-red-400">Kein Member-Eintrag</p>
              <ReasonChip reason="TenantMember fehlt" type="error" />
            </>
          )}
        </div>
      </div>

      {/* Menu Visibility Analysis */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white">Menü-Sichtbarkeit (Effective)</h3>
            {editMode && <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Live-Vorschau</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">{visibleCount} sichtbar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <EyeOff className="w-4 h-4 text-red-400" />
              <span className="text-xs text-slate-400">{hiddenCount} versteckt</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {menuAnalysis.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  item.visible
                    ? "bg-emerald-900/10 border-emerald-700/30"
                    : "bg-red-900/10 border-red-700/30"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  item.visible ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    {item.visible ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${item.visible ? "text-emerald-300" : "text-red-300"}`}>
                    {item.reason}
                  </p>
                </div>
                <DebugBadge status={item.visible ? "visible" : "hidden"} label={item.visible ? "Sichtbar" : "Versteckt"} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <Button
          onClick={() => loadDebugData()}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-800"
          disabled={saving}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Neu laden
        </Button>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button
                onClick={() => {
                  setEditMode(false);
                  setEditedTenantFeatures(tenantFeatures);
                  setEditedUserPermissions(userPermissions);
                }}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                disabled={saving}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSaveChanges}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Speichern
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setEditMode(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Bearbeiten
            </Button>
          )}
        </div>
      </div>

      {/* Feature Flags */}
      {tenant && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-3">Tenant Feature Flags</h3>
            <div className="space-y-2">
              {Object.entries(displayFeatures).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                  <span className="text-xs text-slate-400">{key}</span>
                  {editMode ? (
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => 
                        setEditedTenantFeatures(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                  ) : (
                    <span className={`text-xs font-semibold ${value ? "text-emerald-400" : "text-red-400"}`}>
                      {value ? "✓ Enabled" : "✗ Disabled"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-3">User Permissions</h3>
            <div className="space-y-2">
              {Object.keys(displayPermissions).length > 0 ? (
                Object.entries(displayPermissions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                    <span className="text-xs text-slate-400">{key}</span>
                    {editMode && tenantMember ? (
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => 
                          setEditedUserPermissions(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                    ) : (
                      <span className={`text-xs font-semibold ${value ? "text-emerald-400" : "text-red-400"}`}>
                        {value ? "✓ Granted" : "✗ Denied"}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">Keine User-Permissions gefunden</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PermissionsDebugView() {
  const [searchEmail, setSearchEmail] = useState("");
  const [activeEmail, setActiveEmail] = useState("");

  const handleSearch = () => {
    if (searchEmail.trim()) {
      setActiveEmail(searchEmail.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">🔍 Developer / Debug View</h2>
        <p className="text-sm text-slate-400">Live-Visualisierung der Berechtigungslogik</p>
      </div>

      {/* Search */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <label className="text-xs font-medium text-slate-300 mb-2 block">User Email eingeben</label>
        <div className="flex gap-3">
          <Input
            placeholder="z.B. sebastian.pedde@outlook.com"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 bg-slate-900 border-slate-700 text-white"
          />
          <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700">
            <Search className="w-4 h-4 mr-2" />
            Analysieren
          </Button>
        </div>
      </div>

      {/* Results */}
      {activeEmail && <UserDebugCard userEmail={activeEmail} />}
    </div>
  );
}