import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import VerticalStepForm from "@/components/VerticalStepForm";

const DonationsPage = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: donors = [] } = useQuery({
    queryKey: ["donors"],
    queryFn: async () => {
      const { data } = await supabase.from("donors").select("id, name");
      return data || [];
    },
  });

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ["donations"],
    queryFn: async () => {
      const { data } = await supabase.from("donations").select("*, donors(name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (formData: Record<string, string>) => {
      const { error } = await supabase.from("donations").insert({
        donor_id: formData.donor_id,
        amount: parseFloat(formData.amount),
        donation_date: formData.donation_date,
        purpose: formData.purpose || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      toast({ title: "Donation recorded!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("donations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      toast({ title: "Donation deleted!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filtered = donations.filter((d: any) =>
    (d as any).donors?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.purpose?.toLowerCase().includes(search.toLowerCase())
  );

  const steps = [
    {
      title: "Donor & Amount",
      fields: [
        { name: "donor_id", label: "Donor", type: "select" as const, required: true, options: donors.map((d: any) => ({ value: d.id, label: d.name })) },
        { name: "amount", label: "Amount (₹)", type: "number" as const, placeholder: "Enter amount", required: true },
      ],
    },
    {
      title: "Details",
      fields: [
        { name: "donation_date", label: "Date", type: "date" as const, required: true },
        { name: "purpose", label: "Purpose", type: "text" as const, placeholder: "e.g., Education, Health" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-success" /> Donations
        </h1>
        <p className="text-muted-foreground mt-1">Track all fund contributions</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-xl p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Record Donation</h3>
          {donors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Please add a donor first before recording donations.</p>
          ) : (
            <VerticalStepForm steps={steps} onSubmit={(data) => addMutation.mutateAsync(data)} submitLabel="Record Donation" />
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">All Donations ({filtered.length})</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 text-sm" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No donations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Donor</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Purpose</th>
                    {isAdmin && <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d: any) => (
                    <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{(d as any).donors?.name || "—"}</td>
                      <td className="py-3 px-4 text-sm font-display font-bold text-success">₹{Number(d.amount).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{new Date(d.donation_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{d.purpose || "—"}</td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(d.id)}>
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

export default DonationsPage;
