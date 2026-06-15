import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, BookHeart, FileText, Users, MessageCircle, HandHeart,
  Camera, CalendarHeart, Megaphone, CalendarDays, MessagesSquare, ShieldCheck,
  UserCircle, Settings, LogOut, Menu, Sun, Moon, Bell, Search, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/makiwa-logo.png";

type NavItem = { to: string; label: string; icon: any; end?: boolean; roles?: string[] };

const allNav: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/memorials", label: "My Memorials", icon: BookHeart, roles: ["super_admin", "memorial_admin"] },
  { to: "/dashboard/obituary", label: "Obituary Management", icon: FileText, roles: ["super_admin", "memorial_admin"] },
  { to: "/dashboard/family", label: "Family Tree", icon: Users, roles: ["super_admin", "memorial_admin"] },
  { to: "/dashboard/condolences", label: "Condolences", icon: MessageCircle },
  { to: "/dashboard/fundraising", label: "Fundraising", icon: HandHeart, roles: ["super_admin", "memorial_admin"] },
  { to: "/dashboard/moments", label: "Life Moments", icon: Camera },
  { to: "/dashboard/anniversary", label: "Anniversary", icon: CalendarHeart, roles: ["super_admin", "memorial_admin"] },
  { to: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { to: "/dashboard/events", label: "Events", icon: CalendarDays },
  { to: "/dashboard/community", label: "Community", icon: MessagesSquare },
  { to: "/dashboard/oversight", label: "Memorial Oversight", icon: Globe, roles: ["super_admin"] },
  { to: "/dashboard/access", label: "User Access Control", icon: ShieldCheck, roles: ["super_admin"] },
  { to: "/dashboard/profile", label: "Profile", icon: UserCircle },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Super Admin",
  memorial_admin: "Memorial Admin",
  mourner: "Mourner",
  user: "Mourner",
};

export const DashboardLayout = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { role } = useUserRole();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string; email?: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("pr-sidebar-collapsed") === "1";
  });

  useEffect(() => {
    localStorage.setItem("pr-sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name,avatar_url,email").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const handleSignOut = async () => { await signOut(); navigate("/"); };
  const initials = (profile?.full_name || user?.email || "U").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";

  const visibleNav = allNav.filter(item => !item.roles || (role && item.roles.includes(role)));

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 inset-y-0 left-0 z-40 bg-slate-700 text-slate-50 flex flex-col transition-all duration-300 h-screen border-r border-slate-600",
        collapsed ? "lg:w-20" : "lg:w-72",
        "w-72",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className={cn("h-16 px-4 border-b border-slate-600/70 flex items-center bg-slate-800/40", collapsed ? "lg:justify-center lg:px-2" : "")}>
          <Link to="/" className="flex items-center gap-2 min-w-0 bg-white/95 rounded-xl px-2.5 py-1.5 border border-brand-orange/30 w-full justify-center">
            <img src={logo} alt="Makiwa" className={cn("object-contain", collapsed ? "h-7 w-7" : "h-9 w-auto")} />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 rounded-lg text-sm transition-colors",
                  collapsed ? "lg:justify-center lg:px-0 px-3" : "px-3",
                  "py-2.5",
                  isActive
                    ? "bg-brand-orange text-white font-medium shadow-sm"
                    : "text-slate-200/85 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* role badge */}
        {!collapsed && role && (
          <div className="mx-4 mb-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-300/70">Signed in as</p>
            <p className="text-sm font-medium mt-0.5">{roleLabel[role] ?? role}</p>
          </div>
        )}

        {/* logout button */}
        <div className="p-3 border-t border-slate-600/70">
          <button
            onClick={handleSignOut}
            title="Sign out"
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors border",
              "bg-red-500/15 border-red-400/40 text-red-200 hover:bg-red-500/30 hover:text-white hover:border-red-400"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="lg:hidden fixed inset-0 bg-slate-900/60 z-30" />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navbar */}
        <header className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xl border-b border-slate-300/70 dark:border-slate-700 h-16 flex items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) setMobileOpen(o => !o);
              else setCollapsed(c => !c);
            }}
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-700/60 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search memorials, people…"
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg bg-white/70 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 focus:border-brand-orange/60 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 md:hidden font-serif text-lg font-semibold flex items-center">
            <img src={logo} alt="Makiwa" className="h-7 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={toggleTheme}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-brand-orange" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 h-9 pl-1 pr-3 rounded-full border border-border hover:bg-muted transition-colors">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-brand-orange text-brand-white text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium max-w-[140px] truncate">{displayName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="flex items-center gap-3 py-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-brand-orange text-brand-white">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate font-normal">{profile?.email || user?.email}</p>
                    {role && <p className="text-[10px] mt-1 uppercase tracking-wider text-brand-orange font-semibold">{roleLabel[role] ?? role}</p>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/profile" className="cursor-pointer">
                    <UserCircle className="h-4 w-4 mr-2" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                  {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
