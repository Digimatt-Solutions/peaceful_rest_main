import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Pin, EyeOff, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const Condolences = () => {
  const { user } = useAuth();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [memorialId, setMemorialId] = useState("");
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    document.title = "Condolences · Makiwa";
    if (!user) return;
    supabase.from("memorials").select("id,full_name").eq("created_by", user.id).then(({ data }) => {
      setMemorials(data || []); if (data?.[0]) setMemorialId(data[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!memorialId) return;
    supabase.from("condolences").select("*").eq("memorial_id", memorialId).order("created_at", { ascending: false })
      .then(({ data }) => setItems(data || []));
  }, [memorialId]);

  const update = async (id: string, patch: any) => {
    const { error } = await supabase.from("condolences").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    setItems(items.map(i => i.id === id ? { ...i, ...patch } : i));
  };

  return (
    <>
      <PageHeader title="Condolences" subtitle="Approve, pin, or hide tributes shared by visitors." />
      {memorials.length === 0 ? <EmptyState icon={MessageCircle} title="Create a memorial first" /> : (
        <>
          <div className="mb-6 max-w-sm">
            <Select value={memorialId} onValueChange={setMemorialId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{memorials.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {items.length === 0 ? <EmptyState icon={MessageCircle} title="No condolences yet" description="Tributes from visitors will appear here." /> : (
            <div className="space-y-4">
              {items.map(c => (
                <div key={c.id} className={`rounded-2xl border p-6 bg-card ${c.is_pinned ? "border-brand-orange" : "border-border"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{c.name}</span>
                        {c.relationship && <span className="text-xs text-muted-foreground">· {c.relationship}</span>}
                        {c.country && <span className="text-xs text-muted-foreground">· {c.country}</span>}
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${c.status === 'approved' ? 'bg-green-100 text-green-800' : c.status === 'hidden' ? 'bg-muted text-muted-foreground' : 'bg-cream'}`}>{c.status}</span>
                        {c.is_pinned && <Pin className="h-3 w-3 text-brand-orange" />}
                      </div>
                      <p className="mt-3 text-foreground/90 leading-relaxed">{c.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{format(new Date(c.created_at), "MMM d, yyyy")}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="sm" variant="ghost" onClick={() => update(c.id, { status: "approved" })}><Check className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => update(c.id, { is_pinned: !c.is_pinned })}><Pin className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => update(c.id, { status: "hidden" })}><EyeOff className="h-4 w-4" /></Button>
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
