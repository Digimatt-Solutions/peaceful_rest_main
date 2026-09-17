import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Search, Phone, Mail, CalendarDays, Wallet, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const ksh = (n: number) => `KSh ${Number(n || 0).toLocaleString()}`;

const STATUSES = ["new", "contacted", "in_progress", "completed", "cancelled"];

const statusStyle = (s: string) => {
  if (s === "completed") return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
  if (s === "cancelled") return "bg-red-500/15 text-red-600 border-red-500/30";
  if (s === "in_progress") return "bg-amber-500/15 text-amber-600 border-amber-500/30";
  if (s === "contacted") return "bg-blue-500/15 text-blue-600 border-blue-500/30";
  return "bg-brand-orange/15 text-brand-orange border-brand-orange/30";
};

const serviceLabel = (s: string) =>
  s === "hardcopy_eulogy" ? "Hardcopy Eulogy" : s.replace(/_/g, " ");

const Bookings = () => {
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewing, setViewing] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("service_bookings").select("*").order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    document.title = "Bookings · Makiwa";
    load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("service_bookings").update({ status }).eq("id", id);
    if (error) return toast.error("Could not update this booking");
    setRows(rs => rs.map(r => (r.id === id ? { ...r, status } : r)));
    setViewing((v: any) => (v && v.id === id ? { ...v, status } : v));
    toast.success("Booking updated");
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter(r => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!term) return true;
      return [r.customer_name, r.phone, r.email, r.memorial_name, r.design]
        .some((v: string) => (v || "").toLowerCase().includes(term));
    });
  }, [rows, q, statusFilter]);

  const totals = useMemo(() => ({
    all: rows.length,
    open: rows.filter(r => r.status !== "completed" && r.status !== "cancelled").length,
    value: rows.filter(r => r.status !== "cancelled").reduce((s, r) => s + Number(r.total_amount || 0), 0),
  }), [rows]);

  if (!roleLoading && !isSuperAdmin) {
    return <EmptyState icon={ShieldAlert} title="Not available" description="Only super admins can view service bookings." />;
  }

  return (
    <>
      <PageHeader title="Bookings" subtitle="Funeral program service requests sent in from the website." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {[
          { label: "Total bookings", value: totals.all, icon: ClipboardList },
          { label: "Awaiting action", value: totals.open, icon: CalendarDays },
          { label: "Estimated value", value: ksh(totals.value), icon: Wallet },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-brand-orange/20 bg-card p-4 shadow-sm">
            <s.icon className="h-4 w-4 text-brand-orange" />
            <p className="mt-2 font-serif text-lg sm:text-xl">{s.value}</p>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, design…" className="rounded-xl pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No bookings yet" description="Requests from the funeral program services page will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="rounded-2xl border border-brand-orange/20 bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{r.customer_name}</p>
                    <Badge variant="outline" className={statusStyle(r.status)}>{r.status.replace(/_/g, " ")}</Badge>
                    <Badge variant="outline">{serviceLabel(r.service)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.design} · {r.pages} pages · {r.quantity} copies
                    {r.memorial_name ? ` · in memory of ${r.memorial_name}` : ""}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span>
                    {r.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>}
                    {r.expected_date && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />needed {format(new Date(r.expected_date), "dd MMM yyyy")}</span>}
                    <span>sent {format(new Date(r.created_at), "dd MMM yyyy, HH:mm")}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-xl">{ksh(r.total_amount)}</p>
                  <Button size="sm" variant="outline" className="mt-2 rounded-full" onClick={() => setViewing(r)}>Manage</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Booking details</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <dl className="space-y-2">
                {[
                  ["Service", serviceLabel(viewing.service)],
                  ["Customer", viewing.customer_name],
                  ["Phone", viewing.phone],
                  ["Email", viewing.email || "—"],
                  ["In memory of", viewing.memorial_name || "—"],
                  ["Date needed", viewing.expected_date ? format(new Date(viewing.expected_date), "dd MMM yyyy") : "—"],
                  ["Design", viewing.design],
                  ["Pages", viewing.pages],
                  ["Copies", viewing.quantity],
                  ["Extras", (viewing.options?.extras || []).join(", ") || "None"],
                  ["Price per copy", ksh(viewing.unit_price)],
                  ["Total", ksh(viewing.total_amount)],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between gap-4 border-b border-border/60 pb-1">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium">{String(v)}</dd>
                  </div>
                ))}
              </dl>
              {viewing.notes && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap">{viewing.notes}</p>
                </div>
              )}
              <div>
                <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Status</p>
                <Select value={viewing.status} onValueChange={(v) => updateStatus(viewing.id, v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button asChild className="w-full rounded-full bg-brand-orange text-brand-black hover:bg-brand-orange/90">
                <a href={`tel:${viewing.phone}`}><Phone className="mr-2 h-4 w-4" /> Call {viewing.customer_name}</a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Bookings;
