import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarHeart, Plus, Flame } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const Anniversary = () => {
  const { user } = useAuth();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [memorialId, setMemorialId] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", description: "", remembrance_date: "" });

  useEffect(() => {
    document.title = "Anniversary · Peaceful Rest";
    if (!user) return;
    supabase.from("memorials").select("id,full_name").eq("created_by", user.id).then(({ data }) => {
      setMemorials(data || []); if (data?.[0]) setMemorialId(data[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!memorialId) return;
    supabase.from("anniversaries").select("*").eq("memorial_id", memorialId).order("remembrance_date")
      .then(({ data }) => setItems(data || []));
  }, [memorialId]);

  const add = async () => {
    if (!form.title || !form.remembrance_date || !memorialId) return;
    const { data, error } = await supabase.from("anniversaries").insert({ ...form, memorial_id: memorialId }).select().maybeSingle();
    if (error) return toast.error(error.message);
    setItems([...items, data]); setForm({ title: "", description: "", remembrance_date: "" });
    toast.success("Anniversary added");
  };

  return (
    <>
      <PageHeader title="Anniversary & Remembrance" subtitle="Plan yearly remembrance gatherings, candle tributes, and RSVPs." />
      {memorials.length === 0 ? <EmptyState icon={CalendarHeart} title="Create a memorial first" /> : (
        <>
          <div className="mb-6 max-w-sm">
            <Select value={memorialId} onValueChange={setMemorialId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{memorials.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 mb-8 space-y-4">
            <h3 className="font-serif text-xl">New remembrance</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="1st Anniversary" /></div>
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.remembrance_date} onChange={(e) => setForm({...form, remembrance_date: e.target.value})} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
            </div>
            <Button onClick={add} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90"><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </div>

          {items.length === 0 ? <EmptyState icon={CalendarHeart} title="No anniversaries set" /> : (
            <div className="space-y-4">
              {items.map(a => (
                <div key={a.id} className="rounded-2xl border border-border bg-card p-6 flex items-center gap-5">
                  <div className="h-14 w-14 rounded-full bg-brand-black flex items-center justify-center shrink-0">
                    <Flame className="h-5 w-5 text-brand-orange candle-flicker" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-serif text-xl">{a.title}</h4>
                    <p className="text-sm text-muted-foreground">{format(new Date(a.remembrance_date), "MMMM d, yyyy")}</p>
                    {a.description && <p className="mt-2 text-foreground/80">{a.description}</p>}
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

export default Anniversary;
