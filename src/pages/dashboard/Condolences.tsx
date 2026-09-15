import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, Pin, EyeOff, Check, Plus, Heart, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { logActivity } from "@/lib/activity";

interface Condolence {
  id: string;
  name: string;
  message: string;
  relationship: string | null;
  country: string | null;
  status: string;
  is_pinned: boolean;
  user_id: string | null;
  created_at: string;
  memorial_id: string;
  avatar_url?: string | null;
  memorial_name?: string;
}

const Condolences = () => {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const isAdmin = role === "super_admin" || role === "memorial_admin";

  const [memorials, setMemorials] = useState<any[]>([]);       // memorials the admin cares for
  const [allMemorials, setAllMemorials] = useState<any[]>([]); // everything visible, for names + guest picker
  const [memorialId, setMemorialId] = useState("");
  const [items, setItems] = useState<Condolence[]>([]);
  const [pending, setPending] = useState<Condolence[]>([]);
  const [mine, setMine] = useState<Condolence[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ relationship: "", country: "", message: "", memorial_id: "" });

  const nameMap = useMemo(
    () => new Map(allMemorials.map(m => [m.id, m.full_name])),
    [allMemorials]
  );

  const withAvatars = async (rows: Condolence[]) => {
    const ids = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean))) as string[];
    if (!ids.length) return rows;
    const { data: profs } = await supabase.from("profiles").select("id,avatar_url").in("id", ids);
    const map = new Map((profs || []).map(p => [p.id, p.avatar_url]));
    return rows.map(r => ({ ...r, avatar_url: r.user_id ? map.get(r.user_id) || null : null }));
  };

  const load = useCallback(async () => {
    if (!user) return;
    const { data: all } = await supabase.from("memorials").select("id,full_name,created_by").order("full_name");
    setAllMemorials(all || []);

    if (isAdmin) {
      const owned = role === "super_admin" ? (all || []) : (all || []).filter(m => m.created_by === user.id);
      setMemorials(owned);
      setMemorialId(prev => prev || owned[0]?.id || "");

      const { data: pend } = await supabase
        .from("condolences").select("*").eq("status", "pending")
        .order("created_at", { ascending: false });
      setPending(await withAvatars((pend || []) as Condolence[]));
    } else {
      const { data: own } = await supabase
        .from("condolences").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setMine(await withAvatars((own || []) as Condolence[]));
      setForm(f => ({ ...f, memorial_id: f.memorial_id || all?.[0]?.id || "" }));
    }

    const { data: prof } = await supabase
      .from("profiles").select("full_name,avatar_url").eq("id", user.id).maybeSingle();
    setProfile(prof);
  }, [user, isAdmin, role]);

  useEffect(() => {
    document.title = "Condolences · Makiwa";
    if (!roleLoading) load();
  }, [load, roleLoading]);

  useEffect(() => {
    if (!memorialId || !isAdmin) return;
    (async () => {
      const { data } = await supabase
        .from("condolences").select("*").eq("memorial_id", memorialId)
        .order("created_at", { ascending: false });
      setItems(await withAvatars((data || []) as Condolence[]));
    })();
  }, [memorialId, isAdmin]);

  const update = async (id: string, patch: any) => {
    const { error } = await supabase.from("condolences").update(patch).eq("id", id);
    if (error) return toast.error("That change could not be saved. Please try again.");
    setItems(list => list.map(i => (i.id === id ? { ...i, ...patch } : i)));
    setPending(list => (patch.status && patch.status !== "pending" ? list.filter(i => i.id !== id) : list));
    logActivity("update", { entity_type: "condolence", entity_id: id, description: `Condolence marked ${patch.status || (patch.is_pinned ? "pinned" : "unpinned")}` });
    toast.success(patch.status === "approved" ? "Condolence published" : "Updated");
  };

  const addCondolence = async () => {
    const targetMemorial = isAdmin ? memorialId : form.memorial_id;
    const name = profile?.full_name || user?.email?.split("@")[0] || "";
    if (!name || !form.message.trim() || !targetMemorial) {
      toast.error("Please choose a memorial and write your message");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("condolences")
      .insert({
        memorial_id: targetMemorial,
        name,
        relationship: form.relationship || null,
        country: form.country || null,
        message: form.message,
        status: isAdmin ? "approved" : "pending",
        user_id: user?.id || null,
      })
      .select()
      .maybeSingle();
    setSubmitting(false);
    if (error) return toast.error("Your condolence could not be sent. Please try again.");
    const row: any = { ...data, avatar_url: profile?.avatar_url || null };
    if (isAdmin) setItems([row, ...items]);
    else setMine([row, ...mine]);
    logActivity("condolence", {
      entity_type: "memorial", entity_id: targetMemorial,
      description: `Shared a condolence for ${nameMap.get(targetMemorial) || "a memorial"}`,
    });
    setForm({ relationship: "", country: "", message: "", memorial_id: form.memorial_id });
    setOpen(false);
    toast.success(isAdmin ? "Condolence shared" : "Thank you. Your condolence will appear once an admin verifies it.");
  };

  const statusStyle = (s: string) =>
    s === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : s === "hidden" ? "bg-muted text-muted-foreground border-border"
    : "bg-amber-50 text-amber-700 border-amber-200";

  const shareDialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl bg-brand-orange text-brand-white hover:bg-brand-orange/90">
          <Plus className="h-4 w-4 mr-1.5" /> Share a condolence
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl flex items-center gap-2">
            <Heart className="h-5 w-5 text-brand-orange" /> Share a condolence
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
            <Avatar className="h-10 w-10">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-brand-orange/15 text-brand-orange">
                {(profile?.full_name || user?.email || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{profile?.full_name || user?.email}</p>
              <p className="text-xs text-muted-foreground">Signing as your account</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Memorial</Label>
            <Select
              value={isAdmin ? memorialId : form.memorial_id}
              onValueChange={(v) => (isAdmin ? setMemorialId(v) : setForm({ ...form, memorial_id: v }))}
            >
              <SelectTrigger><SelectValue placeholder="Choose a memorial" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {(isAdmin ? memorials : allMemorials).map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Relationship</Label>
              <Input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="Friend, cousin…" />
            </div>
            <div className="space-y-2"><Label>Country (optional)</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Kenya" />
            </div>
          </div>
          <div className="space-y-2"><Label>Message</Label>
            <Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Share a memory or message of comfort…" />
          </div>
          <Button onClick={addCondolence} disabled={submitting} className="w-full rounded-xl bg-brand-orange text-brand-white hover:bg-brand-orange/90">
            {submitting ? "Sharing…" : "Share condolence"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const card = (c: Condolence, opts: { showMemorial?: boolean; actions?: boolean }) => (
    <div
      key={c.id}
      className={`group relative rounded-2xl border bg-card p-4 sm:p-5 transition-all hover:shadow-elegant ${
        c.is_pinned ? "border-brand-orange/60 bg-gradient-to-r from-brand-orange/5 to-card" : "border-border"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-3 shrink-0 lg:w-56">
          <Avatar className="h-12 w-12 ring-2 ring-brand-orange/20">
            {c.avatar_url && <AvatarImage src={c.avatar_url} alt={c.name} />}
            <AvatarFallback className="bg-brand-orange/15 text-brand-orange font-semibold">
              {c.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{c.name}</h4>
              {c.is_pinned && <Pin className="h-3 w-3 text-brand-orange fill-current" />}
              {c.user_id && <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">verified</span>}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              {c.relationship && <span>{c.relationship}</span>}
              {c.country && <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {c.country}</span>}
              <span>· {format(new Date(c.created_at), "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {opts.showMemorial && (
            <Link to={`/memorial/${c.memorial_id}`} className="text-xs font-semibold text-brand-orange hover:underline">
              For {nameMap.get(c.memorial_id) || "a memorial"}
            </Link>
          )}
          <p className="text-sm text-foreground/90 leading-relaxed line-clamp-2">"{c.message}"</p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-3 shrink-0">
          <Badge variant="outline" className={`text-[10px] uppercase tracking-wider border ${statusStyle(c.status)}`}>
            {c.status}
          </Badge>
          {opts.actions && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => update(c.id, { status: "approved" })}
                className="h-8 rounded-lg border-emerald-300/60 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-500">
                <Check className="h-3.5 w-3.5 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => update(c.id, { is_pinned: !c.is_pinned })}
                className={`h-8 rounded-lg ${c.is_pinned ? "bg-brand-orange/10 border-brand-orange text-brand-orange" : "border-brand-orange/40 text-brand-orange hover:bg-brand-orange/10"}`}>
                <Pin className="h-3.5 w-3.5 mr-1" /> {c.is_pinned ? "Unpin" : "Pin"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => update(c.id, { status: "hidden" })}
                className="h-8 rounded-lg border-border text-muted-foreground hover:bg-muted hover:text-foreground">
                <EyeOff className="h-3.5 w-3.5 mr-1" /> Hide
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ---------- Supporter view ----------
  if (!isAdmin) {
    return (
      <>
        <PageHeader
          title="My Condolences"
          subtitle="Every tribute you have shared, in one place."
          action={allMemorials.length > 0 && shareDialog}
        />
        {mine.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No condolences yet" description="Share a message of comfort with a grieving family." />
        ) : (
          <div className="space-y-4">{mine.map(c => card(c, { showMemorial: true }))}</div>
        )}
      </>
    );
  }

  // ---------- Admin view ----------
  return (
    <>
      <PageHeader
        title="Condolences"
        subtitle="Verify, pin, or hide tributes shared by visitors."
        action={memorials.length > 0 && shareDialog}
      />

      {memorials.length === 0 ? (
        <EmptyState icon={MessageCircle} title="Create a memorial first" />
      ) : (
        <>
          {pending.length > 0 && (
            <section className="mb-10">
              <div className="mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <h3 className="font-serif text-xl">Awaiting your approval</h3>
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">{pending.length}</Badge>
              </div>
              <div className="space-y-4">
                {pending.map(c => card(c, { showMemorial: true, actions: true }))}
              </div>
            </section>
          )}

          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground">Viewing memorial:</span>
            <div className="max-w-xs w-64">
              <Select value={memorialId} onValueChange={setMemorialId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {memorials.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto">
              <Badge variant="outline" className="border-brand-orange/30 text-brand-orange">{items.length} tributes</Badge>
            </div>
          </div>

          {items.length === 0 ? (
            <EmptyState icon={MessageCircle} title="No condolences yet" description="Tributes from visitors will appear here." />
          ) : (
            <div className="space-y-4">{items.map(c => card(c, { actions: true }))}</div>
          )}
        </>
      )}
    </>
  );
};

export default Condolences;
