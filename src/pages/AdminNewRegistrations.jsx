import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/hooks/useAuth";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function AdminNewRegistrations() {
  const { user, tenant, isPlatformAdmin } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [role, setRole] = useState("tenant_member");

  // Fetch all users
  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
    enabled: isPlatformAdmin,
  });

  // Fetch all tenants (for admin to assign)
  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => base44.entities.Tenant.list(),
    enabled: isPlatformAdmin,
  });

  // Fetch all tenant members to check who's already assigned
  const { data: allMembers = [] } = useQuery({
    queryKey: ["allMembers"],
    queryFn: () => base44.entities.TenantMember.list(),
    enabled: isPlatformAdmin,
  });

  // Find users not yet assigned to any tenant
  useEffect(() => {
    if (allUsers.length > 0 && allMembers.length > 0) {
      const assignedEmails = new Set(allMembers.map(m => m.user_email));
      const newUsers = allUsers.filter(u => !assignedEmails.has(u.email) && u.role !== "platform_admin");
      setPendingUsers(newUsers);
    }
  }, [allUsers, allMembers]);

  const handleApprove = async () => {
    if (!selectedUser || !selectedTenant) return;

    try {
      const [first, ...rest] = selectedUser.full_name.split(" ");
      await base44.entities.TenantMember.create({
        tenant_id: selectedTenant,
        user_email: selectedUser.email,
        first_name: first,
        last_name: rest.join(" ") || "User",
        role: role,
        status: "active",
        perm_wildmanagement: true,
        perm_strecke: true,
        perm_wildkammer: role === "tenant_owner",
        perm_kalender: true,
        perm_aufgaben: true,
        perm_personen: role === "tenant_owner",
        perm_oeffentlichkeit: role === "tenant_owner",
        perm_einrichtungen: true,
      });

      setPendingUsers(pendingUsers.filter(u => u.id !== selectedUser.id));
      setDialogOpen(false);
      setSelectedUser(null);
      setSelectedTenant("");
      setRole("tenant_member");
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  if (!isPlatformAdmin) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 p-4 bg-red-950 border border-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-200">Nur Administratoren können neue Registrierungen verwalten.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Neue Registrierungen"
        subtitle={`${pendingUsers.length} ${pendingUsers.length === 1 ? "Benutzer" : "Benutzer"} warten auf Freigabe`}
      />

      {pendingUsers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Keine ausstehenden Registrierungen</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between p-4 bg-[#3a3a3a] rounded-lg border border-[#555]">
              <div>
                <p className="font-medium text-gray-100">{user.full_name}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedUser(user);
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Freigeben
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benutzer freigeben</DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name} zu einem Tenant hinzufügen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">Tenant</label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie einen Tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">Rolle</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant_owner">Tenant Owner (Admin)</SelectItem>
                  <SelectItem value="tenant_member">Tenant Member (Standard)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleApprove} disabled={!selectedTenant}>
              Freigeben
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}