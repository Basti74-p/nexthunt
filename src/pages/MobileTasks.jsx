import React from "react";
import { useAuth } from "@/components/hooks/useAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ListTodo, Check } from "lucide-react";

export default function MobileTasks() {
  const { tenant, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: aufgaben = [] } = useQuery({
    queryKey: ["aufgaben-mobile", tenant?.id],
    queryFn: () => base44.entities.Aufgabe.filter({ tenant_id: tenant?.id }),
    enabled: !!tenant?.id,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Aufgabe.update(id, { status: status === "erledigt" ? "offen" : "erledigt" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["aufgaben-mobile"] }),
  });

  const open = aufgaben.filter(a => a.status !== "erledigt");
  const done = aufgaben.filter(a => a.status === "erledigt");

  return (
    <div className="pt-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Aufgaben</h2>

      <div className="space-y-2 mb-6">
        {open.map(a => (
          <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <button
              onClick={() => toggleMutation.mutate({ id: a.id, status: a.status })}
              className="w-6 h-6 rounded-full border-2 border-gray-300 shrink-0"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{a.title}</p>
              {a.due_date && <p className="text-xs text-gray-500">{a.due_date}</p>}
            </div>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Erledigt</h3>
          <div className="space-y-2">
            {done.map(a => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 opacity-50">
                <button
                  onClick={() => toggleMutation.mutate({ id: a.id, status: a.status })}
                  className="w-6 h-6 rounded-full bg-[#0F2F23] flex items-center justify-center shrink-0"
                >
                  <Check className="w-3.5 h-3.5 text-white" />
                </button>
                <p className="font-medium text-gray-500 text-sm line-through">{a.title}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}