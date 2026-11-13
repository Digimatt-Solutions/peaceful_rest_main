import { Checkbox } from "@/components/ui/checkbox";
import { familyDisplayName } from "@/lib/privacy";
import { Link } from "react-router-dom";
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

const RELATIONSHIPS = [
  "Father",
  "Mother",
  "Spouse",
  "Son",
  "Daughter",
  "Child",
  "Brother",
  "Sister",
  "Sibling",
  "Grandfather",
  "Grandmother",
  "Grandson",
  "Granddaughter",
  "Great Grandson",
  "Great Granddaughter",
  "Step Father",
  "Step Mother",
  "Step Child",
  "Uncle",
  "Aunt",
  "Nephew",
  "Niece",
  "Cousin",
  "Father in Law",
  "Mother in Law",
  "Son in Law",
  "Daughter in Law",
  "Brother in Law",
  "Sister in Law",
  "Co-wife",
  "Other",
];

/** Turn free text into a tidy Title Case label, e.g. "  best FRIEND " -> "Best Friend" */
const tidyLabel = (v: string) =>
  v
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .split(" ")
    .map((w) => (["in", "of", "the", "and"].includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");

type Member = { id: string; name: string; relationship: string; memorial_id: string; photo_url?: string | null; display_order?: number | null; is_minor?: boolean; privacy_mode?: string; consent_confirmed?: boolean };

const FamilyTree = () => {
  const { user } = useAuth();
  const { isSuperAdmin } = useUserRole();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [memorialId, setMemorialId] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Father");
  const [customRel, setCustomRel] = useState("");
  const [editing, setEditing] = useState<Member | null>(null);
  const [editName, setEditName] = useState("");
  const [editRel, setEditRel] = useState("Father");
  const [editCustomRel, setEditCustomRel] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [isMinor, setIsMinor] = useState(false);
  const [privacyMode, setPrivacyMode] = useState("abbreviated");
  const deceased = memorials.find(m => m.id === memorialId);

  useEffect(() => {
    document.title = "Family Tree · Makiwa";
    if (!user) return;
    const q = supabase.from("memorials").select("id,full_name,profile_photo_url,family_consent_confirmed");
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
    if (!name.trim() || !memorialId) return;
    if (!consent) return toast.error("Confirm permission before adding this family member");
    const rel = relationship === "Other" ? tidyLabel(customRel) : relationship;
    if (!rel) return toast.error("Please describe the relationship");
    const { data, error } = await supabase
      .from("family_members")
      .insert({ memorial_id: memorialId, name: tidyLabel(name), relationship: rel, consent_confirmed: consent, is_minor: isMinor, privacy_mode: isMinor && privacyMode === "abbreviated" ? "initials" : privacyMode })
      .select()
      .maybeSingle();
    if (error) return toast.error(error.message);
    setMembers([...members, data as Member]);
    setName("");
    setCustomRel("");
    setRelationship("Father");
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
    setConsent(false);
    setIsMinor(Boolean(m.is_minor));
    setPrivacyMode(m.privacy_mode || "abbreviated");
    setEditing(m);
    setEditName(m.name);
    const known = RELATIONSHIPS.includes(m.relationship);
    setEditRel(known ? m.relationship : "Other");
    setEditCustomRel(known ? "" : m.relationship);
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!consent) return toast.error("Confirm permission before saving");
    if (!editName.trim()) return toast.error("Name required");
    const rel = editRel === "Other" ? tidyLabel(editCustomRel) : editRel;
    if (!rel) return toast.error("Please describe the relationship");
    const nextName = tidyLabel(editName);
    const { error } = await supabase
      .from("family_members")
      .update({ name: nextName, relationship: rel, consent_confirmed: consent, is_minor: isMinor, privacy_mode: isMinor && privacyMode === "abbreviated" ? "initials" : privacyMode })
      .eq("id", editing.id);
    if (error) return toast.error(error.message);
    setMembers(members.map(m => m.id === editing.id ? { ...m, name: nextName, relationship: rel, consent_confirmed: consent, is_minor: isMinor, privacy_mode: isMinor && privacyMode === "abbreviated" ? "initials" : privacyMode } : m));
    setEditing(null);
    toast.success("Updated");
  };

  const swapMembers = async (_first: Member, _second: Member, orderedLane: Member[]) => {
    const results = await Promise.all(orderedLane.map((member, index) =>
      supabase.from("family_members").update({ display_order: index }).eq("id", member.id),
    ));
    const error = results.find((result) => result.error)?.error;
    if (error) {
      toast.error("The family members could not be moved. Please try again.");
      const { data } = await supabase.from("family_members").select("*").eq("memorial_id", memorialId).order("created_at");
      setMembers((data as Member[]) || []);
      return;
    }
    const orders = new Map(orderedLane.map((member, index) => [member.id, index]));
    setMembers((current) => current.map((member) => orders.has(member.id) ? { ...member, display_order: orders.get(member.id) } : member));
    toast.success("Family positions updated");
  };

  const privacyFields = <div className="space-y-3 border-t border-border pt-4"><label className="flex items-center gap-2 text-sm"><Checkbox checked={isMinor} onCheckedChange={value => { setIsMinor(value === true); if (value) setPrivacyMode("initials"); }} />Under 18 years old</label><Select value={privacyMode} onValueChange={setPrivacyMode}><SelectTrigger aria-label="Family profile visibility"><SelectValue /></SelectTrigger><SelectContent>{!isMinor && <SelectItem value="abbreviated">Public: first name and initials</SelectItem>}<SelectItem value="initials">Public: initials only, no photo</SelectItem><SelectItem value="family">Family access only (authorised administrators)</SelectItem></SelectContent></Select><label className="flex items-start gap-2 text-sm"><Checkbox checked={consent} onCheckedChange={value => setConsent(value === true)} /><span>I confirm I have permission from this living relative, or appropriate parental/guardian consent for a minor, for the selected use of their information and photos.</span></label><Link to="/privacy" className="text-xs underline text-brand-orange">Privacy Policy</Link></div>;

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
            <Button onClick={() => { setConsent(false); setIsMinor(false); setPrivacyMode("abbreviated"); setAddOpen(true); }} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
              <Plus className="h-4 w-4 mr-1.5" /> Add family member
            </Button>
          </div>

          {!deceased?.family_consent_confirmed && <p className="mb-4 text-sm text-muted-foreground">Family information stays hidden publicly until consent is confirmed in <Link to={`/dashboard/obituary?id=${memorialId}`} className="underline text-brand-orange">Obituary Management</Link>.</p>}
          <FamilyTreeView
            deceasedName={deceased?.full_name || "Loved One"}
            deceasedPhoto={deceased?.profile_photo_url}
            members={members.filter(m => m.privacy_mode !== "family" && m.consent_confirmed)}
            canReorder
            onSwap={swapMembers}
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
                    <p className="text-sm font-medium truncate">{familyDisplayName(m.name, m.is_minor || m.privacy_mode === "initials")}</p>
                    <p className="text-xs text-muted-foreground">{m.privacy_mode === "family" ? "Family access only" : !m.consent_confirmed ? "Awaiting consent" : "Consent confirmed"}</p>
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
                <SelectContent className="max-h-64">
                  {RELATIONSHIPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              {editRel === "Other" && (
                <div className="space-y-1.5 pt-1">
                  <Input
                    value={editCustomRel}
                    onChange={(e) => setEditCustomRel(e.target.value)}
                    placeholder="e.g. Godmother, Family Friend"
                    className="rounded-xl"
                  />
                  {editCustomRel.trim() && (
                    <p className="text-xs text-muted-foreground">
                      Will be saved as <span className="font-medium text-brand-orange">{tidyLabel(editCustomRel)}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          {privacyFields}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit} className="rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-brand-white">Save</Button>
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
                <SelectContent className="max-h-64">
                  {RELATIONSHIPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              {relationship === "Other" && (
                <div className="space-y-1.5 pt-1">
                  <Input
                    value={customRel}
                    onChange={(e) => setCustomRel(e.target.value)}
                    placeholder="e.g. Godmother, Family Friend"
                    className="rounded-xl"
                  />
                  {customRel.trim() && (
                    <p className="text-xs text-muted-foreground">
                      Will be saved as <span className="font-medium text-brand-orange">{tidyLabel(customRel)}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          {privacyFields}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={add} className="rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-brand-white">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FamilyTree;
