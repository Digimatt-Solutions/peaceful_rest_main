import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FamilyTreeView } from "@/components/family/FamilyTreeView";

const RELATIONSHIPS = ["Father", "Mother", "Spouse", "Child", "Sibling"];

const FamilyTree = () => {
  const { user } = useAuth();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [memorialId, setMemorialId] = useState<string>("");
  const [members, setMembers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Father");
  const deceased = memorials.find(m => m.id === memorialId);

  useEffect(() => {
    document.title = "Family Tree · Peaceful Rest";
    if (!user) return;
    supabase.from("memorials").select("id,full_name,profile_photo_url").eq("created_by", user.id).then(({ data }) => {
      setMemorials(data || []);
      if (data?.[0]) setMemorialId(data[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!memorialId) return;
    supabase.from("family_members").select("*").eq("memorial_id", memorialId).order("created_at")
      .then(({ data }) => setMembers(data || []));
  }, [memorialId]);

  const add = async () => {
    if (!name || !memorialId) return;
    const { data, error } = await supabase.from("family_members").insert({ memorial_id: memorialId, name, relationship }).select().maybeSingle();
    if (error) return toast.error(error.message);
    setMembers([...members, data]); setName(""); toast.success("Family member added");
  };

  const remove = async (id: string) => {
    await supabase.from("family_members").delete().eq("id", id);
    setMembers(members.filter(m => m.id !== id));
  };



  return (
    <>
      <PageHeader title="Nuclear Family Tree" subtitle="Honor those who shaped their life — parents, spouse, children, siblings." />

      {memorials.length === 0 ? (
        <EmptyState icon={Users} title="Create a memorial first" description="Family tree is linked to a specific memorial." />
      ) : (
        <>
          <div className="mb-8 flex flex-wrap items-end gap-3">
            <div className="space-y-2 flex-1 min-w-[220px]">
              <Label>Memorial</Label>
              <Select value={memorialId} onValueChange={setMemorialId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{memorials.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 mb-8 grid sm:grid-cols-[1fr_180px_auto] gap-3 items-end">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mary Okonkwo" /></div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RELATIONSHIPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={add} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90"><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </div>

          <FamilyTreeView
            deceasedName={deceased?.full_name || "Loved One"}
            deceasedPhoto={deceased?.profile_photo_url}
            members={members}
            className="mb-10"
          />

          <div className="space-y-6">
            <h3 className="font-serif text-xl">All members</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {members.map(m => (
                <div key={m.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 group">
                  <div className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center font-serif text-sm shrink-0">
                    {m.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.relationship}</p>
                  </div>
                  <button onClick={() => remove(m.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {members.length === 0 && <EmptyState icon={Users} title="No family members yet" description="Start building the family tree above." />}
          </div>
        </>
      )}
    </>
  );
};

export default FamilyTree;
