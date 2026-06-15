import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Trash2, Edit2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import VerticalStepForm from "@/components/VerticalStepForm";

const DonorsPage = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const { data: donors = [], isLoading } = useQuery({
    queryKey: ["donors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("donors").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (formData: Record<string, string>) => {
      const { error } = await supabase.from("donors").insert({
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donors"] });
      toast({ title: "Donor added!", description: "New donor has been registered successfully." });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase.from("donors").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donors"] });
      setEditingId(null);
      toast({ title: "Donor updated!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("donors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donors"] });
      toast({ title: "Donor deleted!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filtered = donors.filter((d: any) =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase())
  );

  const steps = [
    {
      title: "Personal Information",
      fields: [
        { name: "name", label: "Full Name", type: "text" as const, placeholder: "Enter donor name", required: true },
        { name: "email", label: "Email Address", type: "email" as const, placeholder: "donor@example.com" },
      ],
    },
    {
      title: "Contact Details",
      fields: [
        { name: "phone", label: "Phone Number", type: "tel" as const, placeholder: "+91 XXXXX XXXXX" },
        { name: "address", label: "Address", type: "textarea" as const, placeholder: "Enter full address" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Heart className="w-8 h-8 text-primary" /> Donors
        </h1>
        <p className="text-muted-foreground mt-1">Manage your donor database</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Donor Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-xl p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Add New Donor</h3>
          <VerticalStepForm steps={steps} onSubmit={(data) => addMutation.mutateAsync(data)} submitLabel="Add Donor" />
        </motion.div>

        {/* Donors List */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">All Donors ({filtered.length})</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search donors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 text-sm" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No donors found. Add your first donor!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Name</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Phone</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((donor: any) => (
                    <tr key={donor.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      {editingId === donor.id ? (
                        <>
                          <td className="py-2 px-4"><Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="text-sm h-8" /></td>
                          <td className="py-2 px-4"><Input value={editData.email || ""} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className="text-sm h-8" /></td>
                          <td className="py-2 px-4"><Input value={editData.phone || ""} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className="text-sm h-8" /></td>
                          <td className="py-2 px-4 text-right space-x-1">
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => updateMutation.mutate({ id: donor.id, ...editData })}>Save</Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 text-sm font-medium text-foreground">{donor.name}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{donor.email || "—"}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{donor.phone || "—"}</td>
                          <td className="py-3 px-4 text-right space-x-1">
                            <Button size="sm" variant="ghost" onClick={() => { setEditingId(donor.id); setEditData(donor); }}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            {isAdmin && (
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(donor.id)}>
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

export default DonorsPage;
