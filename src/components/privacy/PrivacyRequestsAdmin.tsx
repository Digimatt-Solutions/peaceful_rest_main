import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
export const PrivacyRequestsAdmin = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const load = async () => {
    const { data, error } = await supabase.from("privacy_requests").select("*").order("created_at", { ascending: false });
    if (error) return toast.error("Privacy requests could not be loaded");
    setRequests(data || []);
  };
  useEffect(() => { void load(); }, []);
  const status = async (id: string, next: string) => {
    setBusy(id);
    const { data, error } = await supabase.from("privacy_requests").update({ status: next, closed_at: next === "closed" ? new Date().toISOString() : null }).eq("id", id).select("id").maybeSingle();
    setBusy(null);
    if (error || !data) return toast.error("Request status was not saved");
    void load();
  };
  return <section className="mb-10 space-y-4"><h2 className="font-serif text-2xl">Privacy requests</h2>{requests.length === 0 ? <p className="text-sm text-muted-foreground">No privacy requests received.</p> : requests.map(r => <article key={r.id} className="rounded-lg border border-border bg-card p-4 space-y-3"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{r.requester_name} · {r.request_type}</h3><span className="text-xs text-muted-foreground">{r.status.replace("_", " ")} · {new Date(r.created_at).toLocaleDateString()}</span></div><a href={`mailto:${r.email}`} className="text-sm text-brand-orange underline break-all">{r.email}</a><p className="text-sm whitespace-pre-wrap break-words">{r.details}</p>{r.memorial_id && <Link to={`/dashboard/obituary?id=${r.memorial_id}`} className="text-sm underline text-brand-orange">Review memorial</Link>}<div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={busy === r.id || r.status === "in_review"} onClick={() => status(r.id,"in_review")}>Mark in review</Button><Button variant="outline" size="sm" disabled={busy === r.id || r.status === "closed"} onClick={() => status(r.id,"closed")}>Close request</Button></div></article>)}</section>;
};