import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Mail, Phone, Trash2, Loader2 } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";

export default function RevierMembersManager({ revierId }) {
  const { tenant } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [form, setForm] = useState({ user_email: "", role: "tenant_member" });
  const [inviteLoading, setInviteLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: members = [] } = useQuery({
    queryKey: ["revier-members", revierId],
    queryFn: async () => {
      const allMembers = await base44.entities.TenantMember.filter({ tenant_id: tenant?.id });
      return allMembers.filter(m => !m.allowed_reviere?.length || m.allowed_reviere.includes(revierId));
    },
    enabled: !!tenant?.id && !!revierId,
  });

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      setInviteLoading(true);
      try {
        await base44.users.inviteUser(data.email, data.role);
        // Create TenantMember record
        await base44.entities.TenantMember.create({
          tenant_id: tenant?.id,
          user_email: data.email,
          first_name: data.email.split("@")[0],
          last_name: "",
          role: data.role === "admin" ? "tenant_owner" : "tenant_member",
          status: "active",
          allowed_reviere: [revierId],
        });
        return { success: true };
      } finally {
        setInviteLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revier-members", revierId] });
      setDialogOpen(false);
      setForm({ user_email: "", role: "tenant_member" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.TenantMember.update(data.id, { allowed_reviere: data.reviers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revier-members", revierId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.TenantMember.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revier-members", revierId] });
    },
  });

  const permissionsMutation = useMutation({
    mutationFn: (data) => base44.entities.TenantMember.update(data.id, {
      perm_wildmanagement: data.perm_wildmanagement,
      perm_strecke: data.perm_strecke,
      perm_wildkammer: data.perm_wildkammer,
      perm_kalender: data.perm_kalender,
      perm_aufgaben: data.perm_aufgaben,
      perm_einrichtungen: data.perm_einrichtungen,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revier-members", revierId] });
      setPermDialogOpen(false);
      setSelectedMember(null);
    },
  });

  const handleInvite = () => {
    if (!form.user_email) return;
    // Convert tenant role to app role for invitation
    const appRole = form.role === "tenant_owner" ? "admin" : "user";
    inviteMutation.mutate({ email: form.user_email, role: appRole });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Reviermitglieder</h3>
        <Button onClick={() => setDialogOpen(true)} variant="outline" className="gap-2 border-[#0F2F23] text-[#0F2F23]">
          <Plus className="w-4 h-4" /> Mitglied einladen
        </Button>
      </div>

      <div className="space-y-2">
        {members.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">Keine Mitglieder für dieses Revier</p>
          </div>
        ) : (
          members.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#0F2F23]/10 flex items-center justify-center text-[#0F2F23] font-bold text-sm">
                {m.first_name?.[0]}{m.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{m.first_name} {m.last_name}</h4>
                  <StatusBadge status={m.status} />
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{m.user_email}</span>
                  {m.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{m.phone}</span>}
                </div>
              </div>
              <Button
                onClick={() => removeMutation.mutate(m.id)}
                disabled={removeMutation.isPending}
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                {removeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </Button>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reviermitglied einladen</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>E-Mail *</Label>
              <Input
                type="email"
                value={form.user_email}
                onChange={(e) => setForm({ ...form, user_email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label>Rolle</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant_member">Mitglied</SelectItem>
                  <SelectItem value="tenant_owner">Eigentümer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleInvite}
              disabled={!form.user_email || inviteLoading || inviteMutation.isPending}
              className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] rounded-xl"
            >
              {inviteLoading || inviteMutation.isPending ? "Lädt ein..." : "Einladen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}