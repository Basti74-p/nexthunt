import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Mail, Phone, Trash2, Loader2, Lock, Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import StatusBadge from "@/components/ui/StatusBadge";

export default function RevierMembersManager({ revierId }) {
  const { tenant } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [form, setForm] = useState({ user_email: "", role: "tenant_member" });
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", phone: "" });
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
        // Check if TenantMember already exists for this email+tenant
        const existing = await base44.entities.TenantMember.filter({ tenant_id: tenant?.id, user_email: data.email });

        if (existing.length > 0) {
          // Already a member — just ensure revierId is in allowed_reviere
          const member = existing[0];
          const currentReviere = member.allowed_reviere || [];
          if (!currentReviere.includes(revierId)) {
            await base44.entities.TenantMember.update(member.id, {
              allowed_reviere: [...currentReviere, revierId],
            });
          }
        } else {
          // Create TenantMember record first (works even if user has own account)
          await base44.entities.TenantMember.create({
            tenant_id: tenant?.id,
            user_email: data.email,
            first_name: data.email.split("@")[0],
            last_name: "",
            role: data.role === "admin" ? "tenant_owner" : "tenant_member",
            status: "active",
            allowed_reviere: [revierId],
          });

          // Try to invite — silently ignore if user already has an account
          try {
            await base44.users.inviteUser(data.email, data.role);
          } catch (e) {
            console.log("Invite email skipped (user may already have account):", e.message);
          }
        }

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

  const editMutation = useMutation({
    mutationFn: (data) => base44.entities.TenantMember.update(data.id, {
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revier-members", revierId] });
      setEditDialogOpen(false);
      setEditForm({ first_name: "", last_name: "", phone: "" });
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (member) => {
      const appRole = member.role === "tenant_owner" ? "admin" : "user";
      await base44.users.inviteUser(member.user_email, appRole);
    },
  });

  const handleInvite = () => {
    if (!form.user_email) return;
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
                onClick={() => resendInviteMutation.mutate(m)}
                disabled={resendInviteMutation.isPending}
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                {resendInviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              </Button>
              <Button
                onClick={() => {
                  setEditForm({ first_name: m.first_name, last_name: m.last_name, phone: m.phone });
                  setSelectedMember(m);
                  setEditDialogOpen(true);
                }}
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => {
                  setSelectedMember(m);
                  setPermDialogOpen(true);
                }}
                variant="ghost"
                size="icon"
                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
              >
                <Lock className="w-4 h-4" />
              </Button>
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-700">
              💡 Funktioniert auch wenn die Person bereits ein eigenes NextHunt-Konto hat. Sie können dann zwischen ihrem eigenen Revier und diesem hier wechseln.
            </div>
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

      <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Berechtigungen für {selectedMember?.first_name} {selectedMember?.last_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Karte */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Checkbox
                    checked={selectedMember?.perm_einrichtungen || false}
                    onCheckedChange={(checked) => {
                      setSelectedMember({
                        ...selectedMember,
                        perm_einrichtungen: checked,
                      });
                    }}
                  />
                  <label className="cursor-pointer">Karte</label>
                </div>
                <div className="ml-6 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedMember?.perm_einrichtungen || false}
                      onCheckedChange={(checked) => {
                        setSelectedMember({
                          ...selectedMember,
                          perm_einrichtungen: checked,
                        });
                      }}
                    />
                    <label className="cursor-pointer text-gray-600">Reviere</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedMember?.perm_einrichtungen || false}
                      onCheckedChange={(checked) => {
                        setSelectedMember({
                          ...selectedMember,
                          perm_einrichtungen: checked,
                        });
                      }}
                    />
                    <label className="cursor-pointer text-gray-600">Jagdeinrichtungen</label>
                  </div>
                </div>
              </div>

              {/* Wildmanagement */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Checkbox
                    checked={selectedMember?.perm_wildmanagement || false}
                    onCheckedChange={(checked) => {
                      setSelectedMember({
                        ...selectedMember,
                        perm_wildmanagement: checked,
                      });
                    }}
                  />
                  <label className="cursor-pointer">Wildmanagement</label>
                </div>
                <div className="ml-6 space-y-2 text-sm">
                  {["Rotwild", "Schwarzwild", "Rehwild", "Wolf"].map((wild) => (
                    <div key={wild} className="flex items-center gap-2">
                      <Checkbox checked={selectedMember?.perm_wildmanagement || false} />
                      <label className="cursor-pointer text-gray-600">{wild}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strecke */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Checkbox
                    checked={selectedMember?.perm_strecke || false}
                    onCheckedChange={(checked) => {
                      setSelectedMember({
                        ...selectedMember,
                        perm_strecke: checked,
                      });
                    }}
                  />
                  <label className="cursor-pointer">Strecke</label>
                </div>
                <div className="ml-6 space-y-2 text-sm">
                  {["Abschussplan", "Wildkammer", "Lager", "Wildverkauf", "Archiv"].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Checkbox checked={selectedMember?.perm_strecke || false} />
                      <label className="cursor-pointer text-gray-600">{item}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Jagdkalender */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Checkbox
                    checked={selectedMember?.perm_kalender || false}
                    onCheckedChange={(checked) => {
                      setSelectedMember({
                        ...selectedMember,
                        perm_kalender: checked,
                      });
                    }}
                  />
                  <label className="cursor-pointer">Jagdkalender</label>
                </div>
                <div className="ml-6 space-y-2 text-sm">
                  {["Jagdmonitor", "Jagdgäste", "Personal"].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Checkbox checked={selectedMember?.perm_kalender || false} />
                      <label className="cursor-pointer text-gray-600">{item}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weitere Module */}
              <div className="space-y-2">
                {[
                  { key: "perm_aufgaben", label: "Aufgaben" },
                  { key: "perm_wildkammer", label: "Wildkammer" },
                  { key: "perm_personen", label: "Personen" },
                  { key: "perm_oeffentlichkeit", label: "Öffentlichkeit" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                    <Checkbox
                      checked={selectedMember?.[key] || false}
                      onCheckedChange={(checked) => {
                        setSelectedMember({
                          ...selectedMember,
                          [key]: checked,
                        });
                      }}
                    />
                    <label className="text-sm font-medium cursor-pointer">{label}</label>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={() => permissionsMutation.mutate(selectedMember)}
              disabled={permissionsMutation.isPending}
              className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] rounded-xl"
            >
              {permissionsMutation.isPending ? "Speichert..." : "Speichern"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mitglied bearbeiten</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Vorname</Label>
              <Input
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                placeholder="Vorname"
              />
            </div>
            <div>
              <Label>Nachname</Label>
              <Input
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                placeholder="Nachname"
              />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="Telefon"
              />
            </div>
            <Button
              onClick={() => {
                editMutation.mutate({
                  id: selectedMember.id,
                  first_name: editForm.first_name,
                  last_name: editForm.last_name,
                  phone: editForm.phone,
                });
              }}
              disabled={editMutation.isPending}
              className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] rounded-xl"
            >
              {editMutation.isPending ? "Speichert..." : "Speichern"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}