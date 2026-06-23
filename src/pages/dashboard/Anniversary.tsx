import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarHeart, Plus, Flame, Clock } from "lucide-react";
import { toast } from "sonner";
import { format, addYears, differenceInDays } from "date-fns";

const Anniversary = () => {
  const { user } = useAuth();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [memorialId, setMemorialId] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", remembrance_date: "" });

  useEffect(() => {
    document.title = "Anniversary · Makiwa";
    if (!user) return;
    supabase
      .from("memorials")
      .select("id,full_name,profile_photo_url,date_of_death,created_at")
      .eq("created_by", user.id)
      .then(({ data }) => {
        setMemorials(data || []);
        if (data?.[0]) setMemorialId(data[0].id);
      });
  }, [user]);

  useEffect(() => {
    if (!memorialId) return;
    supabase
      .from("anniversaries")
      .select("*")
      .eq("memorial_id", memorialId)
      .order("remembrance_date")
      .then(({ data }) => setItems(data || []));
  }, [memorialId]);

  // Auto-generated anniversaries: 1 year after date_of_death (fallback memorial creation date)
  const upcoming = useMemo(() => {
    const today = new Date();
    return memorials
      .map((m) => {
        const baseStr = m.date_of_death || m.created_at;
        if (!baseStr) return null;
        const base = new Date(baseStr);
        let next = addYears(base, 1);
        let year = 1;
        while (next < today) {
          year += 1;
          next = addYears(base, year);
        }
        const daysAway = differenceInDays(next, today);
        return { memorial: m, date: next, year, daysAway };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.daysAway - b.daysAway);
  }, [memorials]);

  const add = async () => {
    if (!form.title || !form.remembrance_date || !memorialId) return;
    const { data, error } = await supabase
      .from("anniversaries")
      .insert({ ...form, memorial_id: memorialId })
      .select()
      .maybeSingle();
    if (error) return toast.error(error.message);
    setItems([...items, data]);
    setForm({ title: "", description: "", remembrance_date: "" });
    setOpen(false);
    toast.success("Anniversary added");
  };

  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <>
      <PageHeader
        title="Anniversary & Remembrance"
        subtitle="Plan yearly remembrance gatherings, candle tributes, and RSVPs."
        action={
          memorials.length > 0 && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-brand-orange text-brand-white hover:bg-brand-orange/90">
                  <Plus className="h-4 w-4 mr-1.5" /> Add anniversary
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">New remembrance</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Memorial</Label>
                    <Select value={memorialId} onValueChange={setMemorialId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {memorials.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="1st Anniversary" />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={form.remembrance_date} onChange={(e) => setForm({ ...form, remembrance_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A few words about the gathering" />
                  </div>
                  <Button onClick={add} className="w-full rounded-xl bg-brand-orange text-brand-white hover:bg-brand-orange/90">
                    Save anniversary
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )
        }
      />

      {memorials.length === 0 ? (
        <EmptyState icon={CalendarHeart} title="Create a memorial first" />
      ) : (
        <>
          {/* Auto-generated upcoming anniversaries */}
          <section className="mb-10">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h3 className="font-serif text-xl">Upcoming anniversaries</h3>
                <p className="text-sm text-muted-foreground">Auto-calculated one year after each burial date.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map((u: any) => (
                <div
                  key={u.memorial.id}
                  className="rounded-2xl border border-brand-orange/25 bg-gradient-to-br from-brand-orange/5 via-card to-card p-5 hover:shadow-elegant transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 ring-2 ring-brand-orange/30">
                      {u.memorial.profile_photo_url && (
                        <AvatarImage src={u.memorial.profile_photo_url} alt={u.memorial.full_name} />
                      )}
                      <AvatarFallback className="bg-brand-orange/15 text-brand-orange font-semibold">
                        {u.memorial.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-lg truncate">{u.memorial.full_name}</h4>
                      <Badge variant="outline" className="text-[10px] mt-1 border-brand-orange/40 text-brand-orange">
                        {ordinal(u.year)} anniversary
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1.5 text-foreground/80">
                      <CalendarHeart className="h-4 w-4 text-brand-orange" />
                      {format(u.date, "MMM d, yyyy")}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {u.daysAway === 0 ? "Today" : `${u.daysAway} days`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Per-memorial custom remembrances */}
          <section>
            <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
              <h3 className="font-serif text-xl">Custom remembrances</h3>
              <div className="max-w-xs w-full sm:w-64">
                <Select value={memorialId} onValueChange={setMemorialId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {memorials.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {items.length === 0 ? (
              <EmptyState icon={CalendarHeart} title="No custom anniversaries yet" description="Click Add anniversary to create one." />
            ) : (
              <div className="space-y-4">
                {items.map((a) => (
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
          </section>
        </>
      )}
    </>
  );
};

export default Anniversary;
