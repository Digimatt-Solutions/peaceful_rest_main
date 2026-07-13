import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { HeartHandshake, Plus, Users, TrendingUp, Target, Wallet, Crown, Calendar, Download, Receipt, Banknote, AlertTriangle, CheckCircle2 } from "lucide-react";
import { DonationReceipt } from "@/components/dashboard/DonationReceipt";
import { BankAccountDialog } from "@/components/fundraising/BankAccountDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart,
} from "recharts";

const CATEGORIES = [
  { value: "funeral_expenses", label: "Funeral Expenses" },
  { value: "family_support", label: "Family Support" },
  { value: "education_trust", label: "Education Trust" },
  { value: "other", label: "Other" },
];

// Orange palette variants
const ORANGE = ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#c2410c", "#9a3412", "#ea580c", "#7c2d12"];

const Fundraising = () => {
  const { user } = useAuth();
  const { isSuperAdmin } = useUserRole();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [memorialId, setMemorialId] = useState("");
  const [funds, setFunds] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", description: "", category: "funeral_expenses", goal_amount: 0 });
  const [openCreate, setOpenCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptDonation, setReceiptDonation] = useState<any>(null);
  const [openAddContrib, setOpenAddContrib] = useState(false);
  const [savingContrib, setSavingContrib] = useState(false);
  const [contribForm, setContribForm] = useState({ fundraiser_id: "", donor_name: "", donor_phone: "", amount: "", is_anonymous: false });
  const [openDonate, setOpenDonate] = useState(false);
  const [donatingFund, setDonatingFund] = useState<any>(null);
  const [donateForm, setDonateForm] = useState({ email: "", donor_name: "", donor_phone: "", amount: "", message: "", is_anonymous: false });
  const [donating, setDonating] = useState(false);
  const [bankAccount, setBankAccount] = useState<any>(null);
  const [bankOpen, setBankOpen] = useState(false);
  const [platformFeePct, setPlatformFeePct] = useState<number>(5);

  const openReceipt = (d: any) => {
    const fund = funds.find(f => f.id === d.fundraiser_id);
    setReceiptDonation({
      ...d,
      fundraiser_title: fund?.title,
      memorial_name: selectedMemorialRef(),
    });
    setReceiptOpen(true);
  };

  const selectedMemorialRef = () => memorials.find(m => m.id === memorialId)?.full_name;

  const downloadContributorsCSV = () => {
    if (!donations.length) return;
    const rows = [
      ["Reference", "Donor", "Phone", "Fundraiser", "Amount (KSh)", "Status", "Date"],
      ...donations.map(d => {
        const fund = funds.find(f => f.id === d.fundraiser_id);
        const name = d.is_anonymous ? "Anonymous" : (d.donor_name || d.donor_phone || "Anonymous");
        return [
          `MKW-${d.id.slice(0,8).toUpperCase()}`,
          name,
          d.is_anonymous ? "" : (d.donor_phone || ""),
          fund?.title || "",
          Number(d.amount).toString(),
          d.status || "",
          format(new Date(d.created_at), "yyyy-MM-dd HH:mm"),
        ];
      }),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contributors-${selectedMemorialRef() || "memorial"}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Contributors list downloaded");
  };

  useEffect(() => {
    document.title = "Fundraising · Makiwa";
    if (!user) return;
    let q = supabase.from("memorials").select("id,full_name,profile_photo_url");
    if (!isSuperAdmin) q = q.eq("created_by", user.id);
    q.then(({ data }) => {
      setMemorials(data || []);
      if (data?.[0]) setMemorialId(data[0].id);
      setLoading(false);
    });
  }, [user, isSuperAdmin]);

  // Handle Paystack callback (?reference=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) return;
    (async () => {
      const { data, error } = await supabase.functions.invoke("paystack-verify", { body: { reference } });
      if (error) { toast.error("Could not verify payment"); return; }
      if (data?.paid) toast.success("Payment received. Thank you!");
      else toast.error("Payment was not completed");
      const url = new URL(window.location.href);
      url.searchParams.delete("reference"); url.searchParams.delete("trxref");
      window.history.replaceState({}, "", url.toString());
      if (memorialId) {
        const { data: fs } = await supabase.from("fundraisers").select("*").eq("memorial_id", memorialId).order("created_at", { ascending: false });
        setFunds(fs || []);
        const ids = (fs || []).map(f => f.id);
        if (ids.length) {
          const { data: ds } = await supabase.from("donations").select("*").in("fundraiser_id", ids).order("created_at", { ascending: false });
          setDonations((ds || []).filter((d: any) => d.status !== "pending" || !d.stripe_session_id));
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memorialId]);

  const startPaystackDonation = async () => {
    if (!donatingFund) return;
    const amt = Number(donateForm.amount);
    if (!donateForm.email) return toast.error("Enter your email");
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!donateForm.is_anonymous && !donateForm.donor_name.trim()) return toast.error("Enter your name");
    setDonating(true);
    const callback_url = `${window.location.origin}${window.location.pathname}`;
    const { data, error } = await supabase.functions.invoke("paystack-initialize", {
      body: {
        fundraiser_id: donatingFund.id,
        amount: amt,
        email: donateForm.email.trim(),
        donor_name: donateForm.donor_name,
        donor_phone: donateForm.donor_phone,
        message: donateForm.message,
        is_anonymous: donateForm.is_anonymous,
        callback_url,
      },
    });
    setDonating(false);
    if (error || !data?.authorization_url) {
      toast.error(data?.error || error?.message || "Could not start payment");
      return;
    }
    window.location.href = data.authorization_url;
  };


  useEffect(() => {
    supabase.from("platform_settings").select("platform_fee_percent").limit(1).maybeSingle()
      .then(({ data }) => { if (data?.platform_fee_percent != null) setPlatformFeePct(Number(data.platform_fee_percent)); });
  }, []);

  useEffect(() => {
    if (!memorialId) { setFunds([]); setDonations([]); setBankAccount(null); return; }
    (async () => {
      const { data: ba } = await supabase
        .from("memorial_bank_accounts")
        .select("*")
        .eq("memorial_id", memorialId)
        .eq("is_active", true)
        .maybeSingle();
      setBankAccount(ba);
      const { data: fs } = await supabase.from("fundraisers").select("*").eq("memorial_id", memorialId).order("created_at", { ascending: false });
      setFunds(fs || []);
      const ids = (fs || []).map(f => f.id);
      if (ids.length) {
        const { data: ds } = await supabase.from("donations").select("*").in("fundraiser_id", ids).order("created_at", { ascending: false });
        setDonations((ds || []).filter((d: any) => d.status !== "pending" || !d.stripe_session_id));
      } else setDonations([]);
    })();
  }, [memorialId]);

  const create = async () => {
    if (!form.title || !memorialId) return;
    if (!bankAccount) {
      toast.error("Add a payout bank account first");
      setOpenCreate(false);
      setBankOpen(true);
      return;
    }
    const { data, error } = await supabase.from("fundraisers").insert({
      ...form,
      memorial_id: memorialId,
      goal_amount: Number(form.goal_amount),
      bank_account_id: bankAccount.id,
      status: "active",
    }).select().maybeSingle();
    if (error) return toast.error(error.message);
    setFunds([data, ...funds]);
    setForm({ title: "", description: "", category: "funeral_expenses", goal_amount: 0 });
    setOpenCreate(false);
    toast.success("Fundraiser created");
  };

  const addManualContribution = async () => {
    const amt = Number(contribForm.amount);
    if (!contribForm.fundraiser_id) return toast.error("Select a fundraiser");
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!contribForm.is_anonymous && !contribForm.donor_name.trim()) return toast.error("Enter donor name");
    setSavingContrib(true);
    const { data: ins, error } = await supabase.from("donations").insert({
      fundraiser_id: contribForm.fundraiser_id,
      amount: amt,
      donor_name: contribForm.is_anonymous ? null : contribForm.donor_name,
      donor_phone: contribForm.is_anonymous ? null : (contribForm.donor_phone || null),
      is_anonymous: contribForm.is_anonymous,
      status: "paid",
    }).select().maybeSingle();
    if (error || !ins) { setSavingContrib(false); return toast.error(error?.message || "Failed"); }
    const fund = funds.find(f => f.id === contribForm.fundraiser_id);
    if (fund) {
      const newRaised = Number(fund.raised_amount || 0) + amt;
      await supabase.from("fundraisers").update({ raised_amount: newRaised }).eq("id", fund.id);
      setFunds(funds.map(f => f.id === fund.id ? { ...f, raised_amount: newRaised } : f));
    }
    setDonations([ins, ...donations]);
    setSavingContrib(false);
    setOpenAddContrib(false);
    setContribForm({ fundraiser_id: "", donor_name: "", donor_phone: "", amount: "", is_anonymous: false });
    toast.success("Contribution recorded");
  };

  const selectedMemorial = memorials.find(m => m.id === memorialId);

  // Aggregates
  const totals = useMemo(() => {
    const raised = donations.reduce((s, d) => s + Number(d.amount || 0), 0);
    const goal = funds.reduce((s, f) => s + Number(f.goal_amount || 0), 0);
    const uniqueDonors = new Set(donations.map(d => d.is_anonymous ? `anon-${d.id}` : (d.donor_phone || d.donor_name || `id-${d.id}`))).size;
    const avg = donations.length ? raised / donations.length : 0;
    return { raised, goal, uniqueDonors, avg, count: donations.length };
  }, [donations, funds]);

  const perFundraiser = useMemo(() => funds.map(f => ({
    name: f.title.length > 18 ? f.title.slice(0, 16) + "…" : f.title,
    raised: Number(f.raised_amount || 0),
    goal: Number(f.goal_amount || 0),
  })), [funds]);

  const trend = useMemo(() => {
    const days: Record<string, number> = {};
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      days[format(d, "MMM d")] = 0;
    }
    donations.forEach(d => {
      const k = format(new Date(d.created_at), "MMM d");
      if (k in days) days[k] += Number(d.amount || 0);
    });
    return Object.entries(days).map(([date, amount]) => ({ date, amount }));
  }, [donations]);

  const topDonors = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    donations.forEach(d => {
      const key = d.is_anonymous ? `__anon_${d.id}` : (d.donor_phone || d.donor_name || "Anonymous");
      const display = d.is_anonymous ? "Anonymous" : (d.donor_name || d.donor_phone || "Anonymous");
      if (!map[key]) map[key] = { name: display, total: 0, count: 0 };
      map[key].total += Number(d.amount || 0);
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [donations]);

  return (
    <>
      <PageHeader
        title="Fundraising"
        subtitle="Track contributions, donors, and goals across every memorial."
        action={memorials.length > 0 && (
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
                <Plus className="h-4 w-4 mr-1.5" /> New fundraiser
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-serif text-2xl">New fundraiser</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Goal (KSh)</Label><Input type="number" value={form.goal_amount} onChange={(e) => setForm({ ...form, goal_amount: Number(e.target.value) })} /></div>
                </div>
                <Button onClick={create} className="w-full rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">Create fundraiser</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      />

      {loading ? (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse" />)}
          </div>
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="h-64 rounded-2xl bg-muted/40 animate-pulse lg:col-span-2" />
            <div className="h-64 rounded-2xl bg-muted/40 animate-pulse" />
          </div>
          <div className="h-72 rounded-2xl bg-muted/40 animate-pulse" />
        </div>
      ) : memorials.length === 0 ? <EmptyState icon={HeartHandshake} title="Create a memorial first" description="Fundraisers belong to a memorial. Create one to get started." />
        : (

        <>
          {/* Memorial selector */}
          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground">Viewing memorial:</span>
            <Select value={memorialId} onValueChange={setMemorialId}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>{memorials.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
            </Select>
            {selectedMemorial?.profile_photo_url && (
              <img src={selectedMemorial.profile_photo_url} alt="" className="h-9 w-9 rounded-full object-cover border border-border" />
            )}
          </div>

          {/* Payout bank account panel */}
          <div className={`mb-6 rounded-2xl border p-5 flex items-start gap-4 flex-wrap ${bankAccount ? "border-border bg-card" : "border-amber-300 bg-amber-50"}`}>
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${bankAccount ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {bankAccount ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-[240px]">
              {bankAccount ? (
                <>
                  <p className="font-serif text-lg">Payouts go to {bankAccount.resolved_account_name || bankAccount.account_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {bankAccount.bank_name} · •••• {String(bankAccount.account_number).slice(-4)} · Platform fee {platformFeePct}% per donation
                  </p>
                </>
              ) : (
                <>
                  <p className="font-serif text-lg text-amber-900">Add a payout bank account to publish fundraisers</p>
                  <p className="text-sm text-amber-800/80">
                    All contributions for {selectedMemorial?.full_name || "this memorial"} settle directly to the bank account you register with Paystack. A {platformFeePct}% platform fee is deducted per donation.
                  </p>
                </>
              )}
            </div>
            <Button
              onClick={() => setBankOpen(true)}
              variant={bankAccount ? "outline" : "default"}
              className={bankAccount ? "rounded-full" : "rounded-full bg-brand-orange text-white hover:bg-brand-orange/90"}
            >
              <Banknote className="h-4 w-4 mr-1.5" />
              {bankAccount ? "Change account" : "Add bank account"}
            </Button>
          </div>



          {/* Summary cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Wallet} label="Total raised" value={`KSh ${totals.raised.toLocaleString()}`} tint={ORANGE[0]} />
            <StatCard icon={Target} label="Combined goal" value={`KSh ${totals.goal.toLocaleString()}`} tint={ORANGE[1]} />
            <StatCard icon={Users} label="Unique donors" value={totals.uniqueDonors} tint={ORANGE[4]} />
            <StatCard icon={TrendingUp} label="Avg donation" value={`KSh ${Math.round(totals.avg).toLocaleString()}`} tint={ORANGE[6]} />
          </div>

          {funds.length === 0 ? <EmptyState icon={HeartHandshake} title="No fundraisers yet" description="Click New fundraiser to start collecting contributions." />
            : (
            <>
              {/* Charts grid */}
              <div className="grid lg:grid-cols-3 gap-5 mb-6">
                <Card title="14-day donation trend" icon={TrendingUp} className="lg:col-span-2">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={trend} margin={{ left: -10, right: 10, top: 5 }}>
                      <defs>
                        <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ORANGE[0]} stopOpacity={0.6} />
                          <stop offset="100%" stopColor={ORANGE[0]} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} formatter={(v: any) => `KSh ${Number(v).toLocaleString()}`} />
                      <Area type="monotone" dataKey="amount" stroke={ORANGE[0]} fill="url(#orangeGrad)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <Card title="Top donors" icon={Crown}>
                  {topDonors.length ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={topDonors} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3}>
                          {topDonors.map((_, i) => <Cell key={i} fill={ORANGE[i % ORANGE.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} formatter={(v: any) => `KSh ${Number(v).toLocaleString()}`} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-sm text-muted-foreground py-10 text-center">No donations yet.</p>}
                </Card>

                <Card title="Raised vs goal per fundraiser" icon={Target} className="lg:col-span-3">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={perFundraiser} margin={{ left: -10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} formatter={(v: any) => `KSh ${Number(v).toLocaleString()}`} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="raised" fill={ORANGE[0]} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="goal" fill={ORANGE[2]} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Fundraiser cards */}
              <h3 className="font-serif text-xl mb-3">Fundraisers</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {funds.map(f => {
                  const pct = f.goal_amount > 0 ? Math.min(100, (Number(f.raised_amount) / Number(f.goal_amount)) * 100) : 0;
                  return (
                    <div key={f.id} className="rounded-2xl border border-border bg-card p-5 hover:shadow-elegant transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider" style={{ borderColor: ORANGE[0], color: ORANGE[5] }}>
                              {CATEGORIES.find(c => c.value === f.category)?.label || f.category}
                            </Badge>
                            {f.status !== "active" && (
                              <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-amber-300 text-amber-700 bg-amber-50">
                                {f.status || "draft"}
                              </Badge>
                            )}
                          </div>
                          <h4 className="mt-2 font-serif text-lg">{f.title}</h4>
                        </div>
                      </div>
                      {f.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{f.description}</p>}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-semibold" style={{ color: ORANGE[5] }}>KSh {Number(f.raised_amount).toLocaleString()}</span>
                          <span className="text-muted-foreground text-xs">of KSh {Number(f.goal_amount).toLocaleString()} · {pct.toFixed(0)}%</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                      {f.status === "active" && f.bank_account_id ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setDonatingFund(f);
                            setDonateForm({ email: user?.email || "", donor_name: "", donor_phone: "", amount: "", message: "", is_anonymous: false });
                            setOpenDonate(true);
                          }}
                          className="mt-4 w-full rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90"
                        >
                          <HeartHandshake className="h-4 w-4 mr-1.5" /> Donate via Paystack
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setBankOpen(true)}
                          variant="outline"
                          className="mt-4 w-full rounded-lg border-amber-300 text-amber-800 hover:bg-amber-50"
                        >
                          <Banknote className="h-4 w-4 mr-1.5" /> Add payout account to activate
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>


              {/* Donor list */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-brand-orange/15 text-brand-orange flex items-center justify-center"><Users className="h-4 w-4" /></div>
                    <h3 className="font-serif text-lg">Contributors</h3>
                    <Badge variant="outline" className="ml-1 border-brand-orange/30 text-brand-orange">{donations.length}</Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" onClick={() => { setContribForm({ ...contribForm, fundraiser_id: funds[0]?.id || "" }); setOpenAddContrib(true); }} disabled={!funds.length} className="rounded-full bg-brand-orange text-white hover:bg-brand-orange/90">
                      <Plus className="h-4 w-4 mr-1.5" /> Add contributor
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadContributorsCSV} disabled={!donations.length}>
                      <Download className="h-4 w-4 mr-1.5" /> Download CSV
                    </Button>
                  </div>
                </div>
                {donations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">No contributions yet for {selectedMemorial?.full_name}.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                          <th className="py-2.5 pl-1">Donor</th>
                          <th className="py-2.5">Fundraiser</th>
                          <th className="py-2.5 text-right">Amount</th>
                          <th className="py-2.5">When</th>
                          <th className="py-2.5 text-right pr-1">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donations.map(d => {
                          const fund = funds.find(f => f.id === d.fundraiser_id);
                          const name = d.is_anonymous ? "Anonymous" : (d.donor_name || d.donor_phone || "Anonymous");
                          const isPending = d.status === "pending";
                          return (
                            <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="py-3 pl-1">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: ORANGE[d.id.charCodeAt(0) % ORANGE.length] }}>
                                    {name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium">{name}</p>
                                    {d.donor_phone && !d.is_anonymous && <p className="text-xs text-muted-foreground">{d.donor_phone}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 text-muted-foreground">{fund?.title || "-"}</td>
                              <td className="py-3 text-right font-semibold" style={{ color: ORANGE[5] }}>KSh {Number(d.amount).toLocaleString()}</td>
                              <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                                <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(d.created_at), "MMM d, yyyy")}</span>
                                {isPending && <span className="ml-2 text-amber-600">· pending</span>}
                              </td>
                              <td className="py-3 text-right pr-1">
                                <Button size="sm" variant="outline" className="h-8" onClick={() => openReceipt(d)}>
                                  <Receipt className="h-3.5 w-3.5 mr-1" /> View
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      <DonationReceipt open={receiptOpen} onOpenChange={setReceiptOpen} donation={receiptDonation} />

      <Dialog open={openAddContrib} onOpenChange={setOpenAddContrib}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Add contributor</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Fundraiser</Label>
              <Select value={contribForm.fundraiser_id} onValueChange={(v) => setContribForm({ ...contribForm, fundraiser_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select fundraiser" /></SelectTrigger>
                <SelectContent>{funds.map(f => <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Donor name</Label><Input value={contribForm.donor_name} onChange={(e) => setContribForm({ ...contribForm, donor_name: e.target.value })} disabled={contribForm.is_anonymous} /></div>
              <div className="space-y-2"><Label>Phone <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label><Input type="tel" value={contribForm.donor_phone} onChange={(e) => setContribForm({ ...contribForm, donor_phone: e.target.value })} disabled={contribForm.is_anonymous} /></div>
            </div>
            <div className="space-y-2"><Label>Amount (KSh)</Label><Input type="number" min="1" value={contribForm.amount} onChange={(e) => setContribForm({ ...contribForm, amount: e.target.value })} /></div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={contribForm.is_anonymous} onChange={(e) => setContribForm({ ...contribForm, is_anonymous: e.target.checked })} />
              Record as anonymous
            </label>
            <Button onClick={addManualContribution} disabled={savingContrib} className="w-full rounded-full bg-brand-orange text-white hover:bg-brand-orange/90">
              {savingContrib ? "Saving…" : "Record contribution"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openDonate} onOpenChange={setOpenDonate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Donate via Paystack</DialogTitle>
          </DialogHeader>
          {donatingFund && (
            <div className="space-y-4 mt-2">
              <div className="rounded-xl bg-brand-orange/5 border border-brand-orange/20 p-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Contributing to</p>
                <p className="font-serif text-lg">{donatingFund.title}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Your name</Label><Input value={donateForm.donor_name} onChange={(e) => setDonateForm({ ...donateForm, donor_name: e.target.value })} disabled={donateForm.is_anonymous} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={donateForm.email} onChange={(e) => setDonateForm({ ...donateForm, email: e.target.value })} required /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Phone <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label><Input type="tel" value={donateForm.donor_phone} onChange={(e) => setDonateForm({ ...donateForm, donor_phone: e.target.value })} disabled={donateForm.is_anonymous} /></div>
                <div className="space-y-2"><Label>Amount (KSh)</Label><Input type="number" min="1" value={donateForm.amount} onChange={(e) => setDonateForm({ ...donateForm, amount: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Message <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label><Textarea rows={2} value={donateForm.message} onChange={(e) => setDonateForm({ ...donateForm, message: e.target.value })} /></div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={donateForm.is_anonymous} onChange={(e) => setDonateForm({ ...donateForm, is_anonymous: e.target.checked })} />
                Donate anonymously
              </label>
              <Button onClick={startPaystackDonation} disabled={donating} className="w-full rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 h-11">
                {donating ? "Redirecting to Paystack…" : `Pay KSh ${Number(donateForm.amount || 0).toLocaleString()} securely`}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">Payments are processed securely by Paystack. You'll be redirected to complete checkout.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const StatCard = ({ icon: Icon, label, value, tint }: any) => (
  <div className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden">
    <div className="absolute inset-0 opacity-[0.07]" style={{ background: `linear-gradient(135deg, ${tint}, transparent)` }} />
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-2 font-serif text-2xl">{value}</p>
      </div>
      <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${tint}20`, color: tint }}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const Card = ({ title, icon: Icon, children, className = "" }: any) => (
  <div className={`rounded-2xl border border-border bg-card p-6 ${className}`}>
    <div className="flex items-center gap-2.5 mb-5">
      <div className="h-8 w-8 rounded-lg bg-brand-orange/15 text-brand-orange flex items-center justify-center"><Icon className="h-4 w-4" /></div>
      <h3 className="font-serif text-lg">{title}</h3>
    </div>
    {children}
  </div>
);

export default Fundraising;
