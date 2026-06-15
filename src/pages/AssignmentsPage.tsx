import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import VerticalStepForm from "@/components/VerticalStepForm";

const AssignmentsPage = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: volunteers = [] } = useQuery({
    queryKey: ["volunteers"],
    queryFn: async () => {
      const { data } = await supabase.from("volunteers").select("id, name");
      return data || [];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("id, name");
      return data || [];
    },
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const { data } = await supabase.from("assignments").select("*, volunteers(name), events(name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (formData: Record<string, string>) => {
      const { error } = await supabase.from("assignments").insert({
        volunteer_id: formData.volunteer_id,
        event_id: formData.event_id,
        role: formData.role || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast({ title: "Volunteer assigned!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast({ title: "Assignment deleted!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filtered = assignments.filter((a: any) =>
    (a as any).volunteers?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (a as any).events?.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.role?.toLowerCase().includes(search.toLowerCase())
  );

  const steps = [
    {
      title: "Select Volunteer & Event",
      fields: [
        { name: "volunteer_id", label: "Volunteer", type: "select" as const, required: true, options: volunteers.map((v: any) => ({ value: v.id, label: v.name })) },
        { name: "event_id", label: "Event", type: "select" as const, required: true, options: events.map((e: any) => ({ value: e.id, label: e.name })) },
      ],
    },
    {
      title: "Role Assignment",
      fields: [
        { name: "role", label: "Role / Responsibility", type: "text" as const, placeholder: "e.g., Team Lead, Coordinator" },
      ],
    },
  ];

  const canAdd = volunteers.length > 0 && events.length > 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-primary" /> Assignments
        </h1>
        <p className="text-muted-foreground mt-1">Assign volunteers to events</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-xl p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Assign Volunteer</h3>
          {!canAdd ? (
            <p className="text-sm text-muted-foreground">Add at least one volunteer and one event first.</p>
          ) : (
            <VerticalStepForm steps={steps} onSubmit={(data) => addMutation.mutateAsync(data)} submitLabel="Assign" />
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">All Assignments ({filtered.length})</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 text-sm" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No assignments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Volunteer</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Event</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Assigned</th>
                    {isAdmin && <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a: any) => (
                    <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{(a as any).volunteers?.name || "—"}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{(a as any).events?.name || "—"}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{a.role || "—"}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(a.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AssignmentsPage;
