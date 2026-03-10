import React, { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, BookUser, Phone, Mail } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

export default function Persons() {
  const { tenant } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", type: "other", notes: "" });
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  if (!tenant?.id) {
    return <div>Loading...</div>;
  }

  const { data: persons = [] } = useQuery({
    queryKey: ["persons", tenant?.id],
    queryFn: () => base44.entities.Person.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      if (!data.name?.trim()) {
        throw new Error("Name ist erforderlich");
      }
      return base44.entities.Person.create({ ...data, tenant_id: tenant?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persons"] });
      setDialogOpen(false);
      setError("");
      setForm({ name: "", email: "", phone: "", type: "other", notes: "" });
    },
    onError: (err) => {
      setError(err.message || "Fehler beim Speichern");
    },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Adressbuch"
        subtitle="Gäste, Dienstleister und externe Personen"
        actions={
          <Button onClick={() => setDialogOpen(true)} className="bg-[#0F2F23] hover:bg-[#1a4a36] text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Person hinzufügen
          </Button>
        }
      />

      <div className="space-y-3">
        {persons.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <BookUser className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">{p.name}</h3>
                <span className="text-xs text-gray-400 capitalize">{p.type}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                {p.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>}
                {p.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setError(""); }}>
         <DialogContent>
           <DialogHeader><DialogTitle>Neue Person</DialogTitle></DialogHeader>
           <div className="space-y-4 mt-4">
             {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
             <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
             <div><Label>E-Mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
             <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
             <div>
               <Label>Typ</Label>
               <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="guest">Gast</SelectItem>
                   <SelectItem value="service">Dienstleister</SelectItem>
                   <SelectItem value="member">Mitglied</SelectItem>
                   <SelectItem value="other">Sonstige</SelectItem>
                 </SelectContent>
               </Select>
             </div>
            <div><Label>Notizen</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || createMutation.isPending} className="w-full bg-[#0F2F23] hover:bg-[#1a4a36] rounded-xl">
              {createMutation.isPending ? "Speichern..." : "Speichern"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}