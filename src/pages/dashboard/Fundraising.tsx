import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { HandHeart, Plus } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "funeral_expenses", label: "Funeral Expenses" },
  { value: "family_support", label: "Family Support" },
  { value: "education_trust", label: "Education Trust" },
  { value: "other", label: "Other" },
];

const Fundraising = () => {
  const { user } = useAuth();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [memorialId, setMemorialId] = useState("");
  const [funds, setFunds] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", description: "", category: "funeral_expenses", goal_amount: 0 });

  useEffect(() => {
    document.title = "Fundraising · Peaceful Rest";
    if (!user) return;
    supabase.from("memorials").select("id,full_name").eq("created_by", user.id).then(({ data }) => {
      setMemorials(data || []); if (data?.[0]) setMemorialId(data[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!memorialId) return;
    supabase.from("fundraisers").select("*").eq("memorial_id", memorialId).order("created_at", { ascending: false })
      .then(({ data }) => setFunds(data || []));
  }, [memorialId]);

  const create = async () => {
    if (!form.title || !memorialId) return;
    const { data, error } = await supabase.from("fundraisers").insert({ ...form, memorial_id: memorialId, goal_amount: Number(form.goal_amount) }).select().maybeSingle();
    if (error) return toast.error(error.message);
    setFunds([data, ...funds]); setForm({ title: "", description: "", category: "funeral_expenses", goal_amount: 0 });
    toast.success("Fundraiser created");
  };

  return (
    <>
      <PageHeader title="Fundraising" subtitle="Receive contributions toward funeral expenses, family support, or education." />
      {memorials.length === 0 ? <EmptyState icon={HandHeart} title="Create a memorial first" /> : (
        <>
          <div className="mb-6 max-w-sm">
            <Select value={memorialId} onValueChange={setMemorialId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{memorials.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 mb-8 space-y-4">
            <h3 className="font-serif text-xl">New fundraiser</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
              <div className="space-y-2"><Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({...form, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Goal amount ($)</Label><Input type="number" value={form.goal_amount} onChange={(e) => setForm({...form, goal_amount: Number(e.target.value)})} /></div>
            </div>
            <Button onClick={create} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90"><Plus className="h-4 w-4 mr-1" /> Create fundraiser</Button>
          </div>

          {funds.length === 0 ? <EmptyState icon={HandHeart} title="No fundraisers yet" /> : (
            <div className="grid md:grid-cols-2 gap-4">
              {funds.map(f => {
                const pct = f.goal_amount > 0 ? Math.min(100, (Number(f.raised_amount) / Number(f.goal_amount)) * 100) : 0;
                return (
                  <div key={f.id} className="rounded-2xl border border-border bg-card p-6">
                    <span className="text-xs uppercase tracking-widest text-brand-orange font-semibold">{CATEGORIES.find(c => c.value === f.category)?.label}</span>
                    <h4 className="mt-2 font-serif text-xl">{f.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{f.description}</p>
                    <div className="mt-5">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold">${Number(f.raised_amount).toLocaleString()}</span>
                        <span className="text-muted-foreground">of ${Number(f.goal_amount).toLocaleString()}</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Fundraising;
