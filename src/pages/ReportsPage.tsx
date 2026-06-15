import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Heart, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

const COLORS = ["hsl(262,80%,55%)", "hsl(330,80%,55%)", "hsl(200,80%,55%)", "hsl(142,76%,36%)", "hsl(38,92%,50%)", "hsl(0,84%,60%)"];

const ReportsPage = () => {
  const { data: donors = [] } = useQuery({
    queryKey: ["donors"],
    queryFn: async () => { const { data } = await supabase.from("donors").select("*"); return data || []; },
  });

  const { data: donations = [] } = useQuery({
    queryKey: ["donations"],
    queryFn: async () => { const { data } = await supabase.from("donations").select("*, donors(name)"); return data || []; },
  });

  const { data: volunteers = [] } = useQuery({
    queryKey: ["volunteers"],
    queryFn: async () => { const { data } = await supabase.from("volunteers").select("*"); return data || []; },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => { const { data } = await supabase.from("events").select("*"); return data || []; },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => { const { data } = await supabase.from("assignments").select("*, volunteers(name), events(name)"); return data || []; },
  });

  const totalDonations = donations.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);

  // Donations by month
  const monthlyData = donations.reduce((acc: any[], d: any) => {
    const month = new Date(d.donation_date).toLocaleDateString("en", { month: "short", year: "2-digit" });
    const existing = acc.find((item) => item.month === month);
    if (existing) { existing.amount += Number(d.amount || 0); existing.count += 1; }
    else acc.push({ month, amount: Number(d.amount || 0), count: 1 });
    return acc;
  }, []);

  // Donations by purpose
  const purposeData = donations.reduce((acc: Record<string, number>, d: any) => {
    const purpose = d.purpose || "General";
    acc[purpose] = (acc[purpose] || 0) + Number(d.amount || 0);
    return acc;
  }, {});
  const pieData = Object.entries(purposeData).map(([name, value]) => ({ name, value }));

  // Top donors
  const donorTotals = donations.reduce((acc: Record<string, { name: string; total: number }>, d: any) => {
    const name = (d as any).donors?.name || "Anonymous";
    if (!acc[name]) acc[name] = { name, total: 0 };
    acc[name].total += Number(d.amount || 0);
    return acc;
  }, {});
  const topDonors = Object.values(donorTotals).sort((a, b) => b.total - a.total).slice(0, 5);

  // Volunteer skills distribution
  const skillsData = volunteers.reduce((acc: Record<string, number>, v: any) => {
    const skills = v.skills?.split(",").map((s: string) => s.trim()) || ["Unspecified"];
    skills.forEach((skill: string) => { acc[skill] = (acc[skill] || 0) + 1; });
    return acc;
  }, {});
  const skillsPie = Object.entries(skillsData).map(([name, value]) => ({ name, value }));

  const summaryStats = [
    { label: "Total Donors", value: donors.length, icon: Heart, color: "text-primary" },
    { label: "Total Donations", value: `₹${totalDonations.toLocaleString()}`, icon: DollarSign, color: "text-success" },
    { label: "Total Volunteers", value: volunteers.length, icon: Users, color: "text-info" },
    { label: "Total Events", value: events.length, icon: Calendar, color: "text-warning" },
    { label: "Assignments", value: assignments.length, icon: TrendingUp, color: "text-primary" },
    { label: "Avg Donation", value: donations.length ? `₹${Math.round(totalDonations / donations.length).toLocaleString()}` : "₹0", icon: BarChart3, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" /> Reports & Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Comprehensive overview of all operations</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4 text-center"
          >
            <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
            <p className="text-xl font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Monthly Donations Trend</h3>
          <div className="h-72">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="hsl(262,80%,55%)" strokeWidth={2} dot={{ r: 4 }} name="Amount (₹)" />
                  <Line type="monotone" dataKey="count" stroke="hsl(330,80%,55%)" strokeWidth={2} dot={{ r: 4 }} name="Count" />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Donations by Purpose</h3>
          <div className="h-72">
            {pieData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-xl p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Top Donors</h3>
          <div className="h-72">
            {topDonors.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={topDonors} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="total" fill="hsl(262,80%,55%)" radius={[0, 6, 6, 0]} name="Total (₹)" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="glass-card rounded-xl p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Volunteer Skills Distribution</h3>
          <div className="h-72">
            {skillsPie.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={skillsPie} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {skillsPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>}
          </div>
        </motion.div>
      </div>

      {/* Data Flow Diagram */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-card rounded-xl p-6">
        <h3 className="font-display font-semibold text-foreground mb-6">System Data Flow Diagram (DFD Level 1)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { title: "Fund Management", items: ["Add Donors", "Record Donations", "Track Amounts"], color: "border-primary bg-primary/5" },
            { title: "Volunteer Mgmt", items: ["Register Volunteers", "Manage Skills", "Update Profiles"], color: "border-info bg-info/5" },
            { title: "Event Planning", items: ["Create Events", "Set Dates & Locations", "Assign Volunteers"], color: "border-warning bg-warning/5" },
            { title: "Reports", items: ["Donation Analytics", "Volunteer Stats", "Event Reports"], color: "border-success bg-success/5" },
          ].map((module, i) => (
            <div key={i} className={`border-2 rounded-xl p-4 ${module.color}`}>
              <h4 className="font-display font-semibold text-foreground text-sm mb-2">{module.title}</h4>
              <ul className="space-y-1">
                {module.items.map((item, j) => (
                  <li key={j} className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-muted rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">All modules connected to centralized cloud database</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportsPage;
