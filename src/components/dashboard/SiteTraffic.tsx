import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Download, Globe, Smartphone, Chrome, Activity } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

const PERIODS = [
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
  { key: "365", label: "Last 12 months" },
] as const;

const COLORS = ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#c2410c", "#9a3412", "#ea580c", "#7c2d12"];

const Card = ({ title, icon: Icon, children, className = "" }: any) => (
  <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
    <div className="flex items-center gap-2.5 mb-4">
      <div className="h-8 w-8 rounded-lg bg-brand-orange/15 text-brand-orange flex items-center justify-center"><Icon className="h-4 w-4" /></div>
      <h3 className="font-serif text-lg">{title}</h3>
    </div>
    {children}
  </div>
);

const ChartSkeleton = ({ h = 240 }: { h?: number }) => (
  <div className="w-full rounded-xl bg-muted/40 animate-pulse" style={{ height: h }} />
);

type Visit = {
  id: string;
  path: string;
  country: string | null;
  country_code: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  created_at: string;
};

export const SiteTraffic = () => {
  const [period, setPeriod] = useState<typeof PERIODS[number]["key"]>("30");
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - Number(period));
    supabase
      .from("site_visits")
      .select("id,path,country,country_code,device,browser,os,referrer,created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(error.message);
        setVisits((data as Visit[]) || []);
        setLoading(false);
      });
    return () => { active = false; };
  }, [period]);

  const timeline = useMemo(() => {
    const days = Number(period);
    const bucketByDay = days <= 90;
    if (bucketByDay) {
      const arr = Array.from({ length: days }, (_, i) => startOfDay(subDays(new Date(), days - 1 - i)));
      return arr.map(d => {
        const start = d.getTime();
        const end = start + 86400000;
        const visitsCount = visits.filter(v => {
          const t = new Date(v.created_at).getTime();
          return t >= start && t < end;
        }).length;
        return { date: format(d, days <= 14 ? "MMM d" : "MMM d"), visits: visitsCount };
      });
    }
    // monthly buckets
    const months = 12;
    const arr = Array.from({ length: months }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (months - 1 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });
    return arr.map((d, idx) => {
      const next = idx + 1 < arr.length ? arr[idx + 1] : new Date();
      const visitsCount = visits.filter(v => {
        const t = new Date(v.created_at).getTime();
        return t >= d.getTime() && t < next.getTime();
      }).length;
      return { date: format(d, "MMM yy"), visits: visitsCount };
    });
  }, [visits, period]);

  const tally = (key: keyof Visit) => {
    const m: Record<string, number> = {};
    visits.forEach(v => {
      const k = (v[key] as string) || "Unknown";
      m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  };

  const countries = useMemo(() => tally("country").slice(0, 10), [visits]);
  const devices = useMemo(() => tally("device"), [visits]);
  const browsers = useMemo(() => tally("browser"), [visits]);
  const topPages = useMemo(() => tally("path").slice(0, 5), [visits]);

  const totalVisits = visits.length;
  const uniqueCountries = new Set(visits.map(v => v.country).filter(Boolean)).size;
  const mobileShare = visits.length
    ? Math.round((visits.filter(v => v.device === "Mobile").length / visits.length) * 100)
    : 0;

  const downloadCSV = () => {
    const rows = [
      ["Date", "Path", "Country", "Country Code", "Device", "Browser", "OS", "Referrer"],
      ...visits.map(v => [
        new Date(v.created_at).toISOString(),
        v.path || "",
        v.country || "",
        v.country_code || "",
        v.device || "",
        v.browser || "",
        v.os || "",
        v.referrer || "",
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `site-traffic-${period}d-${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        Unable to load traffic data. {error}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-7 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl">Site traffic</h3>
          <p className="text-sm text-muted-foreground">Visitor analytics across devices, browsers and locations.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl border border-brand-orange/30 overflow-hidden">
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${period === p.key ? "bg-brand-orange text-white" : "hover:bg-muted"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button onClick={downloadCSV} variant="outline" className="rounded-xl gap-2 h-9">
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total visits", value: totalVisits.toLocaleString() },
          { label: "Countries", value: uniqueCountries },
          { label: "Mobile share", value: `${mobileShare}%` },
          { label: "Top page", value: (topPages[0]?.name || "—").slice(0, 18) },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-brand-orange/20 bg-gradient-to-br from-brand-orange/10 to-transparent p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{s.label}</p>
            <p className="mt-1.5 font-serif text-2xl">{s.value}</p>
          </div>
        ))}
      </div>

      <Card title="Visits over time" icon={Activity}>
        {loading ? <ChartSkeleton /> : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timeline} margin={{ left: -10, right: 10, top: 5 }}>
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Area type="monotone" dataKey="visits" stroke="#f97316" fill="url(#tg)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Top countries" icon={Globe}>
          {loading ? <ChartSkeleton h={260} /> : countries.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={countries} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="value" fill="#f97316" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">No country data yet.</p>}
        </Card>

        <Card title="Devices" icon={Smartphone}>
          {loading ? <ChartSkeleton h={260} /> : devices.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={devices} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">No device data yet.</p>}
        </Card>

        <Card title="Browsers" icon={Chrome}>
          {loading ? <ChartSkeleton h={240} /> : browsers.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={browsers} margin={{ left: -10, right: 10, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="value" fill="#fb923c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">No browser data yet.</p>}
        </Card>

        <Card title="Top pages" icon={Activity}>
          {loading ? <ChartSkeleton h={240} /> : topPages.length ? (
            <ul className="space-y-2">
              {topPages.map((p, i) => {
                const max = topPages[0].value || 1;
                const pct = Math.round((p.value / max) * 100);
                return (
                  <li key={p.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate font-medium">{p.name || "/"}</span>
                      <span className="text-muted-foreground">{p.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/60" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No page data yet.</p>}
        </Card>
      </div>
    </section>
  );
};
