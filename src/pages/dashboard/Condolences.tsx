import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import { MessageCircle, Pin, EyeOff, Check, Plus, Heart, MapPin } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
}

const Condolences = () => {
  const { user } = useAuth();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [memorialId, setMemorialId] = useState("");
  const [items, setItems] = useState<Condolence[]>([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", relationship: "", country: "", message: "" });

  useEffect(() => {
    document.title = "Condolences · Makiwa";
    if (!user) return;
    supabase.from("memorials").select("id,full_name").eq("created_by", user.id).then(({ data }) => {
      setMemorials(data || []);
      if (data?.[0]) setMemorialId(data[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!memorialId) return;
    (async () => {
      const { data } = await supabase
        .from("condolences")
        .select("*")
        .eq("memorial_id", memorialId)
        .order("created_at", { ascending: false });
      const rows = (data || []) as Condolence[];
      // Fetch avatars for any condolence that has a user_id
      const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean))) as string[];
      if (userIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id,avatar_url").in("id", userIds);
        const map = new Map((profs || []).map(p => [p.id, p.avatar_url]));
        rows.forEach(r => { if (r.user_id) r.avatar_url = map.get(r.user_id) || null; });
      }
      setItems(rows);
    })();
  }, [memorialId]);

  const update = async (id: string, patch: any) => {
    const { error } = await supabase.from("condolences").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    setItems(items.map(i => i.id === id ? { ...i, ...patch } : i));
    toast.success("Updated");
  };

  const addCondolence = async () => {
    if (!form.name.trim() || !form.message.trim() || !memorialId) {
      toast.error("Name and message are required");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("condolences")
      .insert({
        memorial_id: memorialId,
        name: form.name,
        relationship: form.relationship || null,
        country: form.country || null,
        message: form.message,
        status: "approved",
        user_id: user?.id || null,
      })
      .select()
      .maybeSingle();
    setSubmitting(false);
    if (error) return toast.error(error.message);
    let row: any = data;
    if (user?.id) {
      const { data: prof } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();
      row = { ...row, avatar_url: prof?.avatar_url || null };
    }
    setItems([row, ...items]);
    setForm({ name: "", relationship: "", country: "", message: "" });
    setOpen(false);
    toast.success("Condolence shared");
  };

  const statusStyle = (s: string) =>
    s === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : s === "hidden" ? "bg-muted text-muted-foreground border-border"
    : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <>
      <PageHeader
        title="Condolences"
        subtitle="Approve, pin, or hide tributes shared by visitors."
        action={
          memorials.length > 0 && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-brand-orange text-brand-white hover:bg-brand-orange/90">
                  <Plus className="h-4 w-4 mr-1.5" /> Add condolence
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl flex items-center gap-2">
                    <Heart className="h-5 w-5 text-brand-orange" /> Share a condolence
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Memorial</Label>
                    <Select value={memorialId} onValueChange={setMemorialId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {memorials.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Your name</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
                    </div>
                    <div className="space-y-2"><Label>Relationship</Label>
                      <Input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="Friend, cousin..." />
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Country (optional)</Label>
                    <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Kenya" />
                  </div>
                  <div className="space-y-2"><Label>Message</Label>
                    <Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Share a memory or message of comfort..." />
                  </div>
                  <Button onClick={addCondolence} disabled={submitting} className="w-full rounded-xl bg-brand-orange text-brand-white hover:bg-brand-orange/90">
                    {submitting ? "Sharing..." : "Share condolence"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )
        }
      />
      {memorials.length === 0 ? (
        <EmptyState icon={MessageCircle} title="Create a memorial first" />
      ) : (
        <>
          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground">Viewing memorial:</span>
            <div className="max-w-xs w-64">
              <Select value={memorialId} onValueChange={setMemorialId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{memorials.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="border-brand-orange/30 text-brand-orange ml-auto">{items.length} tributes</Badge>
          </div>

          {items.length === 0 ? (
            <EmptyState icon={MessageCircle} title="No condolences yet" description="Tributes from visitors will appear here." />
          ) : (
            <div className="space-y-4">
              {items.map(c => (
                <div
                  key={c.id}
                  className={`group relative rounded-2xl border bg-card p-4 sm:p-5 transition-all hover:shadow-elegant ${
                    c.is_pinned ? "border-brand-orange/60 bg-gradient-to-r from-brand-orange/5 to-card" : "border-border"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Avatar + sender info */}
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
                          {c.country && (
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" /> {c.country}
                            </span>
                          )}
                          <span>· {format(new Date(c.created_at), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/90 leading-relaxed line-clamp-2">
                        "{c.message}"
                      </p>
                    </div>

                    {/* Status + actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-3 shrink-0 lg:w-auto">
                      <Badge variant="outline" className={`text-[10px] uppercase tracking-wider border ${statusStyle(c.status)}`}>
                        {c.status}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => update(c.id, { status: "approved" })}
                          className="h-8 rounded-lg border-emerald-300/60 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-500"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => update(c.id, { is_pinned: !c.is_pinned })}
                          className={`h-8 rounded-lg ${c.is_pinned ? "bg-brand-orange/10 border-brand-orange text-brand-orange" : "border-brand-orange/40 text-brand-orange hover:bg-brand-orange/10"}`}
                        >
                          <Pin className="h-3.5 w-3.5 mr-1" /> {c.is_pinned ? "Unpin" : "Pin"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => update(c.id, { status: "hidden" })}
                          className="h-8 rounded-lg border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <EyeOff className="h-3.5 w-3.5 mr-1" /> Hide
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Condolences;
