import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { FamilyTreeView } from "@/components/family/FamilyTreeView";

const RELATIONSHIPS = ["Father", "Mother", "Spouse", "Child", "Sibling"];

type Member = { id: string; name: string; relationship: string; memorial_id: string };

const FamilyTree = () => {
  const { user } = useAuth();
  const { isSuperAdmin } = useUserRole();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [memorialId, setMemorialId] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Father");
  const [editing, setEditing] = useState<Member | null>(null);
  const [editName, setEditName] = useState("");
  const [editRel, setEditRel] = useState("Father");
  const [addOpen, setAddOpen] = useState(false);
  const deceased = memorials.find(m => m.id === memorialId);

  useEffect(() => {
    document.title = "Family Tree · Makiwa";
    if (!user) return;
    const q = supabase.from("memorials").select("id,full_name,profile_photo_url");
    const promise = isSuperAdmin ? q : q.eq("created_by", user.id);
    promise.then(({ data }) => {
      setMemorials(data || []);
      if (data?.[0]) setMemorialId(data[0].id);
    });
  }, [user, isSuperAdmin]);

  useEffect(() => {
    if (!memorialId) return;
    supabase.from("family_members").select("*").eq("memorial_id", memorialId).order("created_at")
      .then(({ data }) => setMembers((data as Member[]) || []));
  }, [memorialId]);

  const add = async () => {
    if (!name || !memorialId) return;
    const { data, error } = await supabase
      .from("family_members")
      .insert({ memorial_id: memorialId, name, relationship })
      .select()
      .maybeSingle();
    if (error) return toast.error(error.message);
    setMembers([...members, data as Member]);
    setName("");
    setAddOpen(false);
    toast.success("Family member added");
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this family member?")) return;
    const { error } = await supabase.from("family_members").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setMembers(members.filter(m => m.id !== id));
    toast.success("Removed");
  };

  const startEdit = (m: Member) => {
    setEditing(m);
    setEditName(m.name);
    setEditRel(m.relationship);
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editName.trim()) return toast.error("Name required");
    const { error } = await supabase
      .from("family_members")
      .update({ name: editName, relationship: editRel })
      .eq("id", editing.id);
    if (error) return toast.error(error.message);
    setMembers(members.map(m => m.id === editing.id ? { ...m, name: editName, relationship: editRel } : m));
    setEditing(null);
    toast.success("Updated");
  };

  return (
    <>
      <PageHeader
        title="Nuclear Family Tree"
        subtitle="Honor those who shaped their life - parents, spouse, children, siblings."
      />

      {memorials.length === 0 ? (
        <EmptyState icon={Users} title="No memorials yet" description="Family tree is linked to a specific memorial." />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-end gap-3">
            <div className="space-y-2 flex-1 min-w-[220px]">
              <Label>Memorial</Label>
              <Select value={memorialId} onValueChange={setMemorialId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {memorials.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setAddOpen(true)} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
              <Plus className="h-4 w-4 mr-1.5" /> Add family member
            </Button>
          </div>

          <FamilyTreeView
            deceasedName={deceased?.full_name || "Loved One"}
            deceasedPhoto={deceased?.profile_photo_url}
            members={members}
            className="mb-10 mx-auto"
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
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => startEdit(m)} className="text-muted-foreground hover:text-brand-orange p-1.5 rounded-md hover:bg-brand-orange/10" aria-label="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => remove(m.id)} className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-destructive/10" aria-label="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {members.length === 0 && <EmptyState icon={Users} title="No family members yet" description="Start building the family tree above." />}
          </div>
        </>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit family member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select value={editRel} onValueChange={setEditRel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit} className="rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add family member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mary Okonkwo" />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={add} className="rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FamilyTree;
