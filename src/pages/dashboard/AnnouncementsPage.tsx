import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props { category?: string; title: string; subtitle: string; }

const AnnouncementsPage = ({ category, title, subtitle }: Props) => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", body: "", venue: "", event_date: "" });

  useEffect(() => {
    document.title = `${title} · Peaceful Rest`;
    if (!user) return;
    let q = supabase.from("announcements").select("*").eq("created_by", user.id).order("created_at", { ascending: false });
    if (category) q = q.eq("category", category);
    q.then(({ data }) => setItems(data || []));
  }, [user, category, title]);

  const add = async () => {
    if (!user || !form.title || !form.body) return;
    const payload: any = { ...form, created_by: user.id, event_date: form.event_date || null, category: category || "general" };
    const { data, error } = await supabase.from("announcements").insert(payload).select().maybeSingle();
    if (error) return toast.error(error.message);
    setItems([data, ...items]); setForm({ title: "", body: "", venue: "", event_date: "" });
    toast.success("Posted");
  };

  const remove = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    setItems(items.filter(i => i.id !== id));
  };

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="rounded-2xl border border-border bg-card p-6 mb-8 space-y-4">
        <h3 className="font-serif text-xl">New post</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Message</Label><Textarea rows={4} value={form.body} onChange={(e) => setForm({...form, body: e.target.value})} /></div>
          <div className="space-y-2"><Label>Date (optional)</Label><Input type="datetime-local" value={form.event_date} onChange={(e) => setForm({...form, event_date: e.target.value})} /></div>
          <div className="space-y-2"><Label>Venue (optional)</Label><Input value={form.venue} onChange={(e) => setForm({...form, venue: e.target.value})} /></div>
        </div>
        <Button onClick={add} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90"><Plus className="h-4 w-4 mr-1" /> Post</Button>
      </div>

      {items.length === 0 ? <EmptyState icon={Megaphone} title="Nothing posted yet" /> : (
        <div className="space-y-4">
          {items.map(a => (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-6 group relative">
              <button onClick={() => remove(a.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="h-4 w-4" /></button>
              <h4 className="font-serif text-xl">{a.title}</h4>
              <div className="mt-1 text-xs text-muted-foreground">
                {a.event_date && format(new Date(a.event_date), "MMM d, yyyy · h:mm a")}
                {a.venue && ` · ${a.venue}`}
              </div>
              <p className="mt-3 text-foreground/85 leading-relaxed whitespace-pre-wrap">{a.body}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default AnnouncementsPage;
