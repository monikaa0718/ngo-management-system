import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Heart, DollarSign, Users, Calendar,
  ClipboardList, BarChart3, LogOut, Shield, ChevronLeft, ChevronRight
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { title: "Donors", icon: Heart, path: "/donors" },
  { title: "Donations", icon: DollarSign, path: "/donations" },
  { title: "Volunteers", icon: Users, path: "/volunteers" },
  { title: "Events", icon: Calendar, path: "/events" },
  { title: "Assignments", icon: ClipboardList, path: "/assignments" },
  { title: "Reports", icon: BarChart3, path: "/reports" },
];

const AppSidebar = () => {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out", description: "You have been signed out successfully." });
  };

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0, width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-screen gradient-primary sidebar-glow z-50 flex flex-col overflow-hidden"
      style={{ width: collapsed ? 72 : 260 }}
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
          <Heart className="w-5 h-5 text-sidebar-foreground" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 className="font-display font-bold text-sidebar-foreground text-sm">NGO Manager</h2>
            <p className="text-[10px] text-sidebar-foreground/60">Management System</p>
          </motion.div>
        )}
      </div>

      {/* User info */}
      <div className="p-3 mx-2 mt-2 rounded-lg bg-white/10 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-sidebar-foreground">
            {user?.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.email}</p>
            <p className="text-[10px] text-sidebar-foreground/60 flex items-center gap-1">
              {isAdmin && <Shield className="w-3 h-3" />}
              {isAdmin ? "Admin" : "User"}
            </p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white/20 text-sidebar-foreground shadow-lg"
                  : "text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "drop-shadow-lg")} />
              {!collapsed && <span>{item.title}</span>}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="activeNav"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-foreground"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/10 space-y-1">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground transition-all w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-white/10 transition-all"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
};

export default AppSidebar;
