import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Heart, DollarSign, Users, Calendar, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(262,80%,55%)", "hsl(330,80%,55%)", "hsl(200,80%,55%)", "hsl(142,76%,36%)", "hsl(38,92%,50%)"];

const DashboardPage = () => {
  const { user, isAdmin } = useAuth();

  const { data: donors = [] } = useQuery({
    queryKey: ["donors"],
    queryFn: async () => {
      const { data } = await supabase.from("donors").select("*");
      return data || [];
    },
  });

  const { data: donations = [] } = useQuery({
    queryKey: ["donations"],
    queryFn: async () => {
      const { data } = await supabase.from("donations").select("*, donors(name)");
      return data || [];
    },
  });

  const { data: volunteers = [] } = useQuery({
    queryKey: ["volunteers"],
    queryFn: async () => {
      const { data } = await supabase.from("volunteers").select("*");
      return data || [];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*");
      return data || [];
    },
  });

  const totalDonations = donations.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);

  const stats = [
    { title: "Total Donors", value: donors.length, icon: Heart, color: "from-primary to-primary/80", link: "/donors" },
    { title: "Total Donations", value: `₹${totalDonations.toLocaleString()}`, icon: DollarSign, color: "from-success to-success/80", link: "/donations" },
    { title: "Volunteers", value: volunteers.length, icon: Users, color: "from-info to-info/80", link: "/volunteers" },
    { title: "Events", value: events.length, icon: Calendar, color: "from-warning to-warning/80", link: "/events" },
  ];

  // Chart data
  const donationsByPurpose = donations.reduce((acc: Record<string, number>, d: any) => {
    const purpose = d.purpose || "General";
    acc[purpose] = (acc[purpose] || 0) + Number(d.amount || 0);
    return acc;
  }, {});

  const pieData = Object.entries(donationsByPurpose).map(([name, value]) => ({ name, value }));

  const recentDonations = donations
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const barData = donations.reduce((acc: any[], d: any) => {
    const month = new Date(d.donation_date).toLocaleDateString("en", { month: "short" });
    const existing = acc.find((item) => item.month === month);
    if (existing) existing.amount += Number(d.amount || 0);
    else acc.push({ month, amount: Number(d.amount || 0) });
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.email?.split("@")[0]}
          {isAdmin && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Admin</span>}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link to={stat.link} className="block glass-card rounded-xl p-5 hover:shadow-xl transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl p-6"
        >
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Monthly Donations
          </h3>
          <div className="h-64">
            {barData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="hsl(262,80%,55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No donation data yet</div>
            )}
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-xl p-6"
        >
          <h3 className="font-display font-semibold text-foreground mb-4">Donations by Purpose</h3>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data to display</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* System Flow Diagram */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card rounded-xl p-6"
      >
        <h3 className="font-display font-semibold text-foreground mb-4">System Architecture Flow</h3>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {[
            { label: "User Input", desc: "Forms & Data Entry", color: "bg-primary" },
            { label: "→", desc: "", color: "" },
            { label: "Validation", desc: "Client + Server", color: "bg-info" },
            { label: "→", desc: "", color: "" },
            { label: "Database", desc: "Cloud Storage", color: "bg-success" },
            { label: "→", desc: "", color: "" },
            { label: "Reports", desc: "Analytics & Charts", color: "bg-warning" },
          ].map((item, i) =>
            item.color ? (
              <div key={i} className="text-center">
                <div className={`${item.color} text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium`}>{item.label}</div>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ) : (
              <span key={i} className="text-xl text-muted-foreground">{item.label}</span>
            )
          )}
        </div>
      </motion.div>

      {/* Recent Donations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card rounded-xl p-6"
      >
        <h3 className="font-display font-semibold text-foreground mb-4">Recent Donations</h3>
        {recentDonations.length > 0 ? (
          <div className="space-y-3">
            {recentDonations.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm text-foreground">{(d as any).donors?.name || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">{d.purpose || "General"}</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-primary">₹{Number(d.amount).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{new Date(d.donation_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No donations recorded yet. Start by adding donors and donations.</p>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardPage;
