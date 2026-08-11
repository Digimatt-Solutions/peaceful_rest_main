import { useEffect, useMemo, useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search, User as UserIcon, ShieldAlert } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";


type Log = {
  id: string;
  user_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  metadata: any;
  created_at: string;
};

const actionColor = (a: string) => {
  if (a.includes("delete")) return "bg-red-500/15 text-red-600 border-red-500/30";
  if (a.includes("create")) return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
  if (a.includes("update") || a.includes("role")) return "bg-amber-500/15 text-amber-600 border-amber-500/30";
  if (a.includes("login") || a.includes("logout") || a.includes("signup")) return "bg-blue-500/15 text-blue-600 border-blue-500/30";
  if (a.startsWith("visited")) return "bg-violet-500/15 text-violet-600 border-violet-500/30";
  return "bg-slate-500/15 text-slate-600 border-slate-500/30";
};

const formatAction = (l: Log) => {
  if (l.action?.startsWith("visited") || l.action === "page_view") {
    const page = l?.metadata?.page || l.action.replace(/^visited_/, "").replace(/_/g, " ");
    return `visited: ${page}`;
  }
  return l.action.replace(/_/g, " ");
};

const PAGE_SIZE = 25;

const ActivityLogs = () => {
  const { isSuperAdmin } = useUserRole();
  const [logs, setLogs] = useState<Log[]>([]);
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setPage(1); }, [q, actionFilter, dateFilter]);


  useEffect(() => {
    document.title = "Activity Logs · Makiwa";
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (!cancelled) { setLogs((data as Log[]) || []); setLoading(false); }
    };
    load();
    const channel = supabase
      .channel("activity_logs_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs" }, (payload) => {
        setLogs(prev => [payload.new as Log, ...prev].slice(0, 1000));
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);

  const actionTypes = useMemo(() => {
    const set = new Set(logs.map(l => (l.action || "").split(":")[0]).filter(Boolean));
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const cutoff =
      dateFilter === "today" ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
      : dateFilter === "7d" ? Date.now() - 7 * 864e5
      : dateFilter === "30d" ? Date.now() - 30 * 864e5
      : 0;
    return logs.filter(l => {
      if (cutoff && new Date(l.created_at).getTime() < cutoff) return false;
      if (actionFilter !== "all" && !(l.action || "").startsWith(actionFilter)) return false;
      if (!t) return true;
      return (
        (l.actor_name || "").toLowerCase().includes(t) ||
        (l.actor_email || "").toLowerCase().includes(t) ||
        (l.action || "").toLowerCase().includes(t) ||
        (l.description || "").toLowerCase().includes(t) ||
        (l.entity_type || "").toLowerCase().includes(t)
      );
    });
  }, [logs, q, actionFilter, dateFilter]);

  const chartData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toLocaleDateString("en-US", { month: "short", day: "numeric" })] = 0;
    }
    logs.forEach(l => {
      const key = new Date(l.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (days[key] !== undefined) days[key]++;
    });
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [logs]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (!isSuperAdmin) {
    return (
      <>
        <PageHeader title="Activity Logs" subtitle="Audit trail of system actions." />
        <EmptyState icon={ShieldAlert} title="Restricted" description="Only super admins can view system activity logs." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Activity Logs"
        subtitle="Real-time audit trail - every action across the system with timestamps."
      />

      <div className="mb-5 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <p className="mb-3 text-sm font-medium">Activity over the last 7 days</p>
        <div className="h-48 -mx-6 sm:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} width={28} />
              <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="hsl(var(--brand-orange, 24 95% 53%))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by user, action, entity…"
            className="pl-9 rounded-xl"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-52 rounded-xl"><SelectValue placeholder="All actions" /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">All actions</SelectItem>
            {actionTypes.map(a => <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-40 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">

        <div className="px-5 py-3 border-b border-border bg-muted/30 text-sm font-medium text-muted-foreground flex items-center justify-between">
          <span>Showing {paginated.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{(currentPage - 1) * PAGE_SIZE + paginated.length} of {filtered.length}</span>
          <span className="inline-flex items-center gap-1.5 text-xs"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> live</span>
        </div>
        {loading ? (
          <div className="divide-y divide-border">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-start gap-4">
                <div className="h-9 w-9 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-2/3 rounded bg-muted/70 animate-pulse" />
                </div>
                <div className="h-3 w-16 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>

        ) : filtered.length === 0 ? (
          <div className="p-12 text-center"><Activity className="h-8 w-8 mx-auto mb-3 text-muted-foreground" /><p className="text-sm text-muted-foreground">No activity recorded yet.</p></div>
        ) : (
          <div className="divide-y divide-border">
            {paginated.map(l => (
              <div key={l.id} className="px-5 py-3.5 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                <div className="h-9 w-9 rounded-full bg-brand-orange/15 text-brand-orange flex items-center justify-center shrink-0">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">{l.actor_name || "Unknown"}</span>
                    <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${actionColor(l.action)}`}>{formatAction(l)}</Badge>
                    {l.entity_type && l.entity_type !== "page" && <span className="text-xs text-muted-foreground">on <span className="font-medium">{l.entity_type}</span></span>}
                  </div>
                  {l.description && <p className="text-sm text-muted-foreground mt-0.5">{l.description}</p>}
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{l.actor_email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium">{formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</p>
                  <p className="text-[11px] text-muted-foreground">{format(new Date(l.created_at), "MMM d, HH:mm:ss")}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length > PAGE_SIZE && (
          <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 text-xs rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >First</button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >Previous</button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >Next</button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 text-xs rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >Last</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};


export default ActivityLogs;
