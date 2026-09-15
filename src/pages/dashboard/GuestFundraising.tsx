import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DonateDialog, DonateTarget } from "@/components/dashboard/DonateDialog";
import { HeartHandshake, Receipt, Search, Printer, Download, Wallet, Users } from "lucide-react";
import { format } from "date-fns";

const ksh = (n: number) => `KSh ${Number(n || 0).toLocaleString()}`;

const GuestFundraising = () => {
  const { user } = useAuth();
  const [funds, setFunds] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [myDonations, setMyDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [donateTarget, setDonateTarget] = useState<DonateTarget | null>(null);
  const [viewing, setViewing] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: fs } = await supabase
      .from("fundraisers")
      .select("*")
      .eq("status", "approved")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    const list = fs || [];
    const memorialIds = Array.from(new Set(list.map(f => f.memorial_id).filter(Boolean)));
    let names = new Map<string, any>();
    if (memorialIds.length) {
      const { data: ms } = await supabase
        .from("memorials").select("id,full_name,profile_photo_url").in("id", memorialIds);
      names = new Map((ms || []).map(m => [m.id, m]));
    }
    setFunds(list.map(f => ({ ...f, memorial: names.get(f.memorial_id) })));

    if (user) {
      const [{ data: rs }, { data: ds }] = await Promise.all([
        supabase.from("donation_receipts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("donations").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setReceipts(rs || []);
      setMyDonations(ds || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    document.title = "Fundraising · Makiwa";
    load();
  }, [load]);

  const totalGiven = useMemo(
    () => myDonations.filter(d => d.status === "paid" || d.status === "completed" || !d.status).reduce((s, d) => s + Number(d.amount || 0), 0),
    [myDonations]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return funds;
    return funds.filter(f =>
      f.title?.toLowerCase().includes(q) || f.memorial?.full_name?.toLowerCase().includes(q)
    );
  }, [funds, query]);

  const printReceipt = (html: string) => {
    const w = window.open("", "_blank", "width=420,height=720");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  const downloadReceipt = (r: any) => {
    const blob = new Blob([r.html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${r.receipt_no}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <PageHeader
        title="Fundraising"
        subtitle="Support families raising funds, and keep every receipt in one place."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {[
          { label: "Your contributions", value: ksh(totalGiven), icon: Wallet },
          { label: "Receipts saved", value: receipts.length, icon: Receipt },
          { label: "Open fundraisers", value: funds.length, icon: Users },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-brand-orange/20 bg-card p-4 shadow-sm">
            <s.icon className="h-4 w-4 text-brand-orange" />
            <p className="mt-2 font-serif text-lg sm:text-xl">{s.value}</p>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-xl">Ongoing fundraisers</h2>
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name…" className="pl-9 rounded-xl" />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map(i => <div key={i} className="h-52 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={HeartHandshake} title="No open fundraisers" description="Approved fundraisers will appear here." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(f => {
              const pct = f.goal_amount ? Math.min(100, (Number(f.raised_amount || 0) / Number(f.goal_amount)) * 100) : 0;
              return (
                <article key={f.id} className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start gap-3">
                    {f.memorial?.profile_photo_url ? (
                      <img src={f.memorial.profile_photo_url} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-brand-orange/20" />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-orange/10 text-brand-orange">
                        <HeartHandshake className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate font-medium leading-tight">{f.title}</h3>
                      <p className="truncate text-xs text-muted-foreground">
                        In memory of {f.memorial?.full_name || "a loved one"}
                      </p>
                    </div>
                  </div>

                  {f.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{f.description}</p>}

                  <div className="mt-4">
                    <Progress value={pct} className="h-2" />
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-medium">{ksh(f.raised_amount)} raised</span>
                      <span className="text-muted-foreground">of {ksh(f.goal_amount)}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      onClick={() => setDonateTarget({ id: f.id, title: f.title, memorial_name: f.memorial?.full_name })}
                      className="flex-1 rounded-xl bg-brand-orange text-white hover:bg-brand-orange/90"
                    >
                      Contribute
                    </Button>
                    {f.memorial_id && (
                      <Button asChild variant="outline" className="rounded-xl border-brand-orange/40 text-brand-orange">
                        <Link to={`/memorial/${f.memorial_id}`}>View</Link>
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-serif text-xl">Your receipts</h2>
        {receipts.length === 0 ? (
          <EmptyState icon={Receipt} title="No receipts yet" description="Receipts appear here after a successful contribution." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {receipts.map(r => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-0">
                <Receipt className="h-4 w-4 shrink-0 text-brand-orange" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.fundraiser_title || "Contribution"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.receipt_no} · {format(new Date(r.created_at), "d MMM yyyy")}
                    {r.memorial_name ? ` · ${r.memorial_name}` : ""}
                  </p>
                </div>
                <Badge variant="outline" className="border-brand-orange/30 text-brand-orange">{ksh(r.amount)}</Badge>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setViewing(r)}>View</Button>
                  <Button size="sm" variant="outline" className="rounded-lg" onClick={() => printReceipt(r.html)}>
                    <Printer className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg" onClick={() => downloadReceipt(r)}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <DonateDialog
        fundraiser={donateTarget}
        onOpenChange={(o) => !o && setDonateTarget(null)}
        onCompleted={load}
      />

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-serif text-xl">Receipt {viewing?.receipt_no}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <iframe title="Receipt" srcDoc={viewing.html} className="h-[70vh] w-full rounded-b-2xl border-0" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GuestFundraising;
