import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessagesSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const CATS = [
  { v: "support", l: "Grief Support" },
  { v: "encouragement", l: "Encouragement" },
  { v: "help", l: "Help Request" },
  { v: "discussion", l: "Discussion" },
];

const Community = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", body: "", category: "support" });

  useEffect(() => {
    document.title = "Community · Peaceful Rest";
    supabase.from("community_posts").select("*").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setItems(data || []));
  }, []);

  const add = async () => {
    if (!user || !form.title || !form.body) return;
    const { data, error } = await supabase.from("community_posts").insert({ ...form, user_id: user.id }).select().maybeSingle();
    if (error) return toast.error(error.message);
    setItems([data, ...items]); setForm({ title: "", body: "", category: "support" });
    toast.success("Posted");
  };

  const remove = async (id: string) => {
    await supabase.from("community_posts").delete().eq("id", id);
    setItems(items.filter(i => i.id !== id));
  };

  return (
    <>
      <PageHeader title="Community" subtitle="A safe space to share, ask, and find encouragement." />
      <div className="rounded-2xl border border-border bg-card p-6 mb-8 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} /></div>
          <div className="space-y-2"><Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({...form, category: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATS.map(c => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2"><Label>Message</Label><Textarea rows={4} value={form.body} onChange={(e) => setForm({...form, body: e.target.value})} /></div>
        </div>
        <Button onClick={add} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90"><Plus className="h-4 w-4 mr-1" /> Share</Button>
      </div>

      {items.length === 0 ? <EmptyState icon={MessagesSquare} title="No posts yet" /> : (
        <div className="space-y-4">
          {items.map(p => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-6 group relative">
              {p.user_id === user?.id && (
                <button onClick={() => remove(p.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="h-4 w-4" /></button>
              )}
              <span className="text-xs uppercase tracking-widest text-brand-orange font-semibold">{CATS.find(c => c.v === p.category)?.l || p.category}</span>
              <h4 className="font-serif text-xl mt-2">{p.title}</h4>
              <p className="mt-2 text-foreground/85 leading-relaxed whitespace-pre-wrap">{p.body}</p>
              <p className="mt-3 text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy · h:mm a")}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Community;
