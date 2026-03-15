import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Users, Mail, Phone, Ban } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

export default function TenantMembers() {
  const { tenant, isTenantOwner, isPlatformAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", user_email: "", phone: "", callsign: "", role: "tenant_member" });
  const queryClient = useQueryClient();

  const { data: members = [] } = useQuery({
    queryKey: ["members", tenant?.id],
    queryFn: () => base44.entities.TenantMember.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
    staleTime: 0,
    gcTime: 0,
  });

  // Live sync: subscribe to TenantMember changes
  useEffect(() => {
    if (!tenant?.id) return;
    
    const unsubscribe = base44.entities.TenantMember.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    });
    
    return unsubscribe;
  }, [tenant?.id, queryClient]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TenantMember.create({ ...data, tenant_id: tenant.id, status: "active" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setDialogOpen(false);
      setForm({ first_name: "", last_name: "", user_email: "", phone: "", callsign: "", role: "tenant_member" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (member) => base44.entities.TenantMember.update(member.id, { status: member.status === "active" ? "inactive" : "active" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });

  const canManage = isTenantOwner || isPlatformAdmin;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Mitglieder"
        subtitle={`${members.length} Mitglied${members.length !== 1 ? "er" : ""}`}
        actions={
          canManage && (
            <Button onClick={() => setDialogOpen(true)} className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Mitglied hinzufügen
            </Button>
          )
        }
      />

      <div className="space-y-3">
        {members.map((m) => (
          <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-[#0F2F23] flex items-center justify-center text-white font-bold text-sm">
              {m.first_name?.[0]}{m.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">{m.first_name} {m.last_name}</h3>
                <StatusBadge status={m.role === "tenant_owner" ? "active" : "assigned"} />
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{m.user_email}</span>
                {m.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{m.phone}</span>}
                {m.callsign && <span>Rufzeichen: {m.callsign}</span>}
              </div>
            </div>
            <span className="text-xs text-gray-400 capitalize">{m.role?.replace("_", " ")}</span>
            {canManage && (
              <Button
                onClick={() => toggleStatusMutation.mutate(m)}
                disabled={toggleStatusMutation.isPending}
                variant="ghost"
                size="sm"
                className={m.status === "active" ? "text-gray-400 hover:text-red-600" : "text-red-600 hover:text-red-700"}
              >
                <Ban className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mitglied hinzufügen</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Vorname *</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
              <div><Label>Nachname *</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            </div>
            <div><Label>E-Mail *</Label><Input type="email" value={form.user_email} onChange={(e) => setForm({ ...form, user_email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Rufzeichen</Label><Input value={form.callsign} onChange={(e) => setForm({ ...form, callsign: e.target.value })} /></div>
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
              onClick={() => createMutation.mutate(form)}
              disabled={!form.first_name || !form.last_name || !form.user_email || createMutation.isPending}
              className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] rounded-xl"
            >
              {createMutation.isPending ? "Speichern..." : "Hinzufügen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}