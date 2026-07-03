import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import {
  BookHeart, MessageCircle, HeartHandshake, Eye, CalendarHeart, Plus,
  Users, Activity, TrendingUp, Megaphone, Shield, Camera
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const Stat = ({
  label, value, icon: Icon, trend, accent = "primary",
}: { label: string; value: string | number; icon: any; trend?: string; accent?: "primary" | "secondary" | "tertiary" | "quaternary" | "quinary" }) => {
  // Unified orange-variant palette for every dashboard card.
  const accentMap: Record<string, { grad: string; icon: string; ring: string }> = {
    primary:    { grad: "from-[#f97316]/25 to-[#f97316]/5",  icon: "text-[#c2410c]", ring: "ring-[#f97316]/30" },
    secondary:  { grad: "from-[#fb923c]/25 to-[#fb923c]/5",  icon: "text-[#9a3412]", ring: "ring-[#fb923c]/30" },
    tertiary:   { grad: "from-[#fdba74]/30 to-[#fdba74]/5",  icon: "text-[#7c2d12]", ring: "ring-[#fdba74]/40" },
    quaternary: { grad: "from-[#ea580c]/25 to-[#ea580c]/5",  icon: "text-[#7c2d12]", ring: "ring-[#ea580c]/30" },
    quinary:    { grad: "from-[#fed7aa]/40 to-[#fed7aa]/5",  icon: "text-[#9a3412]", ring: "ring-[#fed7aa]/50" },
  };
  const a = accentMap[accent];
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-brand-orange/20 bg-card p-5 hover:shadow-elegant hover:-translate-y-0.5 hover:border-brand-orange/40 transition-all ring-1 ${a.ring}`}>
      <div className={`absolute inset-0 bg-gradient-to-br opacity-60 ${a.grad}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="mt-2 font-serif text-2xl sm:text-[26px]">{value}</p>
          {trend && <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {trend}</p>}
        </div>
        <div className={`h-11 w-11 rounded-xl bg-background/90 backdrop-blur flex items-center justify-center shadow-soft ${a.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, icon: Icon, children, className = "" }: any) => (
  <div className={`rounded-2xl border border-border bg-card p-6 ${className}`}>
    <div className="flex items-center gap-2.5 mb-5">
      <div className="h-8 w-8 rounded-lg bg-brand-orange/15 text-brand-orange flex items-center justify-center"><Icon className="h-4 w-4" /></div>
      <h3 className="font-serif text-lg">{title}</h3>
    </div>
    {children}
  </div>
);

const COLORS = ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#c2410c", "#9a3412", "#ea580c", "#7c2d12"];

const ChartSkeleton = ({ h = 260 }: { h?: number }) => (
  <div className="w-full rounded-xl bg-muted/40 animate-pulse" style={{ height: h }} />
);

const Overview = () => {
  const { user } = useAuth();
  const { role, isSuperAdmin, isMemorialAdmin, isMourner, loading: roleLoading } = useUserRole();

  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState({
    memorials: 0, condolences: 0, donations: 0, visitors: 0,
    users: 0, fundraisers: 0, moments: 0, announcements: 0,
  });
  const [series, setSeries] = useState<{ date: string; condolences: number; donations: number; visitors: number }[]>([]);
  const [roleBreakdown, setRoleBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [topMemorials, setTopMemorials] = useState<{ name: string; visitors: number; condolences: number }[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [anniversaries, setAnniversaries] = useState<any[]>([]);

  useEffect(() => {
    document.title = "Dashboard · Makiwa";
    if (!user || roleLoading) return;
    setDataLoading(true);



    const load = async () => {
      // memorials scoped by role
      let mq = supabase.from("memorials").select("id,full_name,visitor_count,created_at,profile_photo_url");
      if (!isSuperAdmin) mq = mq.eq("created_by", user.id);
      const { data: mems } = await mq;
      const memIds = (mems || []).map(m => m.id);
      const visitors = (mems || []).reduce((s, m) => s + (m.visitor_count || 0), 0);

      // condolences
      let condQ = supabase.from("condolences").select("id,memorial_id,created_at,message,name");
      if (memIds.length && !isMourner) condQ = condQ.in("memorial_id", memIds);
      if (isMourner) condQ = condQ.eq("user_id", user.id);
      const { data: conds } = await condQ;

      // donations (joined via fundraisers -> memorial_id)
      let fundIdsForScope: string[] = [];
      if (memIds.length) {
        const { data: fs } = await supabase.from("fundraisers").select("id").in("memorial_id", memIds);
        fundIdsForScope = (fs || []).map(f => f.id);
      }
      let donQ = supabase.from("donations").select("amount,fundraiser_id,created_at,user_id");
      if (!isMourner && fundIdsForScope.length) donQ = donQ.in("fundraiser_id", fundIdsForScope);
      if (!isMourner && !fundIdsForScope.length) donQ = donQ.eq("fundraiser_id", "00000000-0000-0000-0000-000000000000");
      if (isMourner) donQ = donQ.eq("user_id", user.id);
      const { data: dons } = await donQ;
      const donTotal = (dons || []).reduce((s: number, d: any) => s + Number(d.amount || 0), 0);

      // role-extra fetches
      let users = 0;
      let roleData: { name: string; value: number }[] = [];
      let fundraisers = 0, moments = 0, anns = 0;

      if (isSuperAdmin) {
        const { count: ucount } = await supabase.from("profiles").select("id", { count: "exact", head: true });
        users = ucount || 0;
        const { data: rs } = await supabase.from("user_roles").select("role");
        const tally: Record<string, number> = {};
        (rs || []).forEach((r: any) => { tally[r.role] = (tally[r.role] || 0) + 1; });
        roleData = Object.entries(tally).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
      }

      if (memIds.length) {
        const { count: fc } = await supabase.from("fundraisers").select("id", { count: "exact", head: true }).in("memorial_id", memIds);
        fundraisers = fc || 0;
        const { count: mc } = await supabase.from("memories").select("id", { count: "exact", head: true }).in("memorial_id", memIds);
        moments = mc || 0;
        const { count: ac } = await supabase.from("announcements").select("id", { count: "exact", head: true }).in("memorial_id", memIds);
        anns = ac || 0;
      }

      setStats({
        memorials: mems?.length || 0,
        condolences: conds?.length || 0,
        donations: donTotal,
        visitors,
        users,
        fundraisers,
        moments,
        announcements: anns,
      });
      setRoleBreakdown(roleData);

      // 14-day trend
      const days = Array.from({ length: 14 }, (_, i) => startOfDay(subDays(new Date(), 13 - i)));
      const seriesData = days.map(d => {
        const key = format(d, "MMM d");
        const dayStart = d.getTime();
        const dayEnd = dayStart + 86400000;
        const c = (conds || []).filter(x => {
          const t = new Date(x.created_at).getTime(); return t >= dayStart && t < dayEnd;
        }).length;
        const dn = (dons || []).filter((x: any) => {
          const t = new Date(x.created_at).getTime(); return t >= dayStart && t < dayEnd;
        }).reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
        const v = (mems || []).filter(x => {
          const t = new Date(x.created_at).getTime(); return t >= dayStart && t < dayEnd;
        }).length;
        return { date: key, condolences: c, donations: dn, visitors: v };
      });
      setSeries(seriesData);

      // top memorials
      const tops = (mems || [])
        .map(m => ({
          name: m.full_name,
          visitors: m.visitor_count || 0,
          condolences: (conds || []).filter(c => c.memorial_id === m.id).length,
        }))
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 5);
      setTopMemorials(tops);

      // recent condolences (cap at 3 latest)
      if (memIds.length || isMourner) {
        let rq = supabase.from("condolences").select("id,message,name,created_at,memorial_id").order("created_at", { ascending: false }).limit(3);
        if (!isMourner && memIds.length) rq = rq.in("memorial_id", memIds);
        if (isMourner) rq = rq.eq("user_id", user.id);
        const { data: r } = await rq;
        setRecent(r || []);
      }

      // upcoming anniversaries
      if (memIds.length) {
        const { data: a } = await supabase
          .from("anniversaries").select("id,title,event_date,memorial_id")
          .in("memorial_id", memIds)
          .gte("event_date", new Date().toISOString().slice(0, 10))
          .order("event_date").limit(5);
        setAnniversaries(a || []);
      }
      setDataLoading(false);
    };
    load();
  }, [user, isSuperAdmin, isMourner, isMemorialAdmin, roleLoading]);

  const roleHeader = useMemo(() => {
    if (isSuperAdmin) return { title: "Dashboard", subtitle: "Complete oversight of every memorial, user, and activity across the platform." };
    if (isMemorialAdmin) return { title: "Dashboard", subtitle: "Manage your memorials, track tributes and fundraising in one place." };
    return { title: "Dashboard", subtitle: "Your tributes, contributions, and memorials you follow." };
  }, [isSuperAdmin, isMemorialAdmin]);

  // Pre-compute chart data once outside the render tree to avoid per-frame work.
  const pieData = useMemo(() => {
    if (isSuperAdmin && roleBreakdown.length) return roleBreakdown;
    return [
      { name: "Condolences", value: stats.condolences },
      { name: "Donations", value: stats.donations > 0 ? Math.min(stats.donations, 100) : 0 },
      { name: "Visitors", value: stats.visitors },
    ].filter(x => x.value > 0);
  }, [isSuperAdmin, roleBreakdown, stats.condolences, stats.donations, stats.visitors]);

  if (roleLoading || !role) {
    return (
      <div className="space-y-5">
        <div className="h-20 rounded-2xl bg-muted/40 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted/40 animate-pulse" />)}
        </div>
      </div>
    );
  }


  return (
    <>
      <PageHeader
        title={roleHeader.title}
        subtitle={roleHeader.subtitle}
        action={(isSuperAdmin || isMemorialAdmin) && (
          <Button asChild className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
            <Link to="/dashboard/obituary"><Plus className="h-4 w-4 mr-1" /> Create Memorial</Link>
          </Button>
        )}
      />

      {/* Stats grid - role aware, unified orange-variant palette */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isSuperAdmin && <Stat label="Total Users" value={stats.users} icon={Users} accent="quaternary" />}
        <Stat label={isMourner ? "Memorials Followed" : "Memorials"} value={stats.memorials} icon={BookHeart} accent="primary" />
        <Stat label="Visitors" value={stats.visitors.toLocaleString()} icon={Eye} accent="secondary" />
        <Stat label={isMourner ? "My Condolences" : "Condolences"} value={stats.condolences} icon={MessageCircle} accent="tertiary" />
        {!isSuperAdmin && <Stat label={isMourner ? "My Donations" : "Donations Raised"} value={`KSh ${stats.donations.toLocaleString()}`} icon={HeartHandshake} accent="quinary" />}
        {isSuperAdmin && <Stat label="Donations Raised" value={`KSh ${stats.donations.toLocaleString()}`} icon={HeartHandshake} accent="quinary" />}
      </div>

      {/* Charts */}
      <div className="mt-6 grid lg:grid-cols-3 gap-5">
        <Card title="14-day activity trend" icon={Activity} className="lg:col-span-2">
          {dataLoading ? <ChartSkeleton h={260} /> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={series} margin={{ left: -10, right: 10, top: 5 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fdba74" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#fdba74" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Area type="monotone" dataKey="condolences" stroke="#f97316" fill="url(#g1)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="visitors" stroke="#c2410c" fill="url(#g2)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title={isSuperAdmin ? "User roles" : "Engagement mix"} icon={Shield}>
          {dataLoading ? <ChartSkeleton h={260} /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>


      {/* Bottom row */}
      <div className="mt-5 grid lg:grid-cols-3 gap-5">
        {!isMourner && (
          <Card title="Top memorials" icon={BookHeart} className="lg:col-span-2">
            {dataLoading ? <ChartSkeleton h={220} /> : topMemorials.length ? (

              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topMemorials} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  <Bar dataKey="visitors" fill="#f97316" radius={[0, 6, 6, 0]} />
                  <Bar dataKey="condolences" fill="#fdba74" radius={[0, 6, 6, 0]} />

                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground">No memorial data yet.</p>}
          </Card>
        )}

        <Card title="Upcoming anniversaries" icon={CalendarHeart} className={isMourner ? "lg:col-span-2" : ""}>
          {anniversaries.length ? (
            <ul className="space-y-3">
              {anniversaries.map(a => (
                <li key={a.id} className="flex items-center justify-between text-sm border-b border-border/60 pb-2 last:border-0">
                  <span className="font-medium truncate">{a.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{format(new Date(a.event_date), "MMM d, yyyy")}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No upcoming anniversaries.</p>}
        </Card>

        <Card title="Recent tributes" icon={MessageCircle} className="lg:col-span-3">
          {recent.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((r: any) => (
                <div key={r.id} className="rounded-xl border border-border p-4 bg-background/50">
                  <p className="text-sm line-clamp-3">"{r.message}"</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>- {r.name || "Anonymous"}</span>
                    <span>{format(new Date(r.created_at), "MMM d")}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No recent tributes yet.</p>}
        </Card>
      </div>
    </>
  );
};

export default Overview;
