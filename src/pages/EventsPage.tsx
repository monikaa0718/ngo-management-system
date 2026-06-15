import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Trash2, Edit2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import VerticalStepForm from "@/components/VerticalStepForm";

const EventsPage = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (formData: Record<string, string>) => {
      const { error } = await supabase.from("events").insert({
        name: formData.name,
        event_date: formData.event_date,
        location: formData.location || null,
        description: formData.description || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Event created!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase.from("events").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setEditingId(null);
      toast({ title: "Event updated!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Event deleted!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filtered = events.filter((e: any) =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.location?.toLowerCase().includes(search.toLowerCase())
  );

  const steps = [
    {
      title: "Event Details",
      fields: [
        { name: "name", label: "Event Name", type: "text" as const, placeholder: "Enter event name", required: true },
        { name: "event_date", label: "Event Date", type: "date" as const, required: true },
      ],
    },
    {
      title: "Location & Description",
      fields: [
        { name: "location", label: "Location", type: "text" as const, placeholder: "Enter location" },
        { name: "description", label: "Description", type: "textarea" as const, placeholder: "Describe the event" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Calendar className="w-8 h-8 text-warning" /> Events
        </h1>
        <p className="text-muted-foreground mt-1">Plan and manage NGO events</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-xl p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Create Event</h3>
          <VerticalStepForm steps={steps} onSubmit={(data) => addMutation.mutateAsync(data)} submitLabel="Create Event" />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">All Events ({filtered.length})</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 text-sm" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No events yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Name</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Location</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e: any) => (
                    <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      {editingId === e.id ? (
                        <>
                          <td className="py-2 px-4"><Input value={editData.name} onChange={(ev) => setEditData({ ...editData, name: ev.target.value })} className="text-sm h-8" /></td>
                          <td className="py-2 px-4"><Input type="date" value={editData.event_date} onChange={(ev) => setEditData({ ...editData, event_date: ev.target.value })} className="text-sm h-8" /></td>
                          <td className="py-2 px-4"><Input value={editData.location || ""} onChange={(ev) => setEditData({ ...editData, location: ev.target.value })} className="text-sm h-8" /></td>
                          <td className="py-2 px-4 text-right space-x-1">
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => updateMutation.mutate({ id: e.id, name: editData.name, event_date: editData.event_date, location: editData.location, description: editData.description })}>Save</Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 text-sm font-medium text-foreground">{e.name}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{new Date(e.event_date).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{e.location || "—"}</td>
                          <td className="py-3 px-4 text-right space-x-1">
                            <Button size="sm" variant="ghost" onClick={() => { setEditingId(e.id); setEditData(e); }}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            {isAdmin && (
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(e.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </>
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

export default EventsPage;
