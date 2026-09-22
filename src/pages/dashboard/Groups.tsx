import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  UsersRound, Plus, Search, Send, Paperclip, Loader2, Settings2, Trash2,
  Pencil, ShieldCheck, LogOut, UserMinus, ArrowLeft, FileText, Check, X,
} from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";

type Group = { id: string; name: string; description: string | null; avatar_url: string | null; created_by: string; created_at: string };
type Member = { id: string; group_id: string; user_id: string; role: string; last_read_at: string; joined_at: string };
type GroupMessage = {
  id: string; group_id: string; sender_id: string; content: string | null;
  attachment_url: string | null; attachment_type: string | null; attachment_name: string | null;
  edited_at: string | null; created_at: string;
};
type Profile = { id: string; full_name: string | null; email: string | null; avatar_url: string | null };

const initialsOf = (name: string) => (name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const Groups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myMemberships, setMyMemberships] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  // active group state
  const [members, setMembers] = useState<Member[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // create / edit form
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);
  const [iconUploading, setIconUploading] = useState(false);


  const activeGroup = useMemo(() => groups.find((g) => g.id === activeId) || null, [groups, activeId]);
  const myRole = useMemo(
    () => members.find((m) => m.user_id === user?.id)?.role || myMemberships.find((m) => m.group_id === activeId)?.role || null,
    [members, myMemberships, activeId, user]
  );
  const isMember = !!myRole;
  const isGroupAdmin = myRole === "admin";

  const loadGroups = useCallback(async () => {
    if (!user) return;
    const [{ data: gs }, { data: ms }] = await Promise.all([
      supabase.from("groups").select("*").order("created_at", { ascending: false }),
      supabase.from("group_members").select("*").eq("user_id", user.id),
    ]);
    setGroups((gs as Group[]) || []);
    setMyMemberships((ms as Member[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    document.title = "Groups · Makiwa";
    loadGroups();
  }, [loadGroups]);

  const loadProfiles = useCallback(async (ids: string[]) => {
    const missing = ids.filter((id) => id && !profiles[id]);
    if (!missing.length) return;
    const { data } = await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", missing);
    if (data) setProfiles((p) => ({ ...p, ...Object.fromEntries(data.map((d: any) => [d.id, d])) }));
  }, [profiles]);

  const loadConversation = useCallback(async (groupId: string) => {
    const [{ data: mem }, { data: msg }] = await Promise.all([
      supabase.from("group_members").select("*").eq("group_id", groupId).order("joined_at"),
      supabase.from("group_messages").select("*").eq("group_id", groupId).order("created_at").limit(300),
    ]);
    setMembers((mem as Member[]) || []);
    setMessages((msg as GroupMessage[]) || []);
    await loadProfiles([...new Set([...(mem || []).map((m: any) => m.user_id), ...(msg || []).map((m: any) => m.sender_id)])]);
  }, [loadProfiles]);

  // Open a group: only members get the conversation (enforced by row-level security too).
  useEffect(() => {
    if (!activeId || !user) return;
    const mine = myMemberships.some((m) => m.group_id === activeId);
    if (!mine) { setMembers([]); setMessages([]); return; }
    loadConversation(activeId);
    supabase.from("group_members").update({ last_read_at: new Date().toISOString() })
      .eq("group_id", activeId).eq("user_id", user.id).then(() => {});
    const ch = supabase
      .channel(`group-${activeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_messages", filter: `group_id=eq.${activeId}` }, () => loadConversation(activeId))
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members", filter: `group_id=eq.${activeId}` }, () => loadConversation(activeId))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, user, myMemberships.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, activeId]);

  useEffect(() => {
    if (activeGroup) setEditForm({ name: activeGroup.name, description: activeGroup.description || "" });
  }, [activeGroup]);

  const nameOf = (id: string) => profiles[id]?.full_name || profiles[id]?.email?.split("@")[0] || "Member";

  // A message can still be edited until another member has read it.
  const isUnread = (m: GroupMessage) =>
    !members.some((mem) => mem.user_id !== m.sender_id && new Date(mem.last_read_at) >= new Date(m.created_at));

  const createGroup = async () => {
    if (!user) return;
    if (form.name.trim().length < 3) return toast.error("Give the group a name of at least 3 characters");
    setBusy(true);
    const { data, error } = await supabase.from("groups")
      .insert({ name: form.name.trim(), description: form.description.trim() || null, created_by: user.id })
      .select().maybeSingle();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Group created — you are its admin");
    logActivity("group_create", { entity_type: "group", entity_id: data?.id, description: `Created group ${form.name.trim()}` });
    setForm({ name: "", description: "" });
    setCreateOpen(false);
    await loadGroups();
    setActiveId(data?.id || null);
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("group_members").insert({ group_id: groupId, user_id: user.id, role: "member" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("You joined the group");
    await loadGroups();
    setActiveId(groupId);
  };

  const leaveGroup = async (groupId: string) => {
    if (!user || !confirm("Leave this group?")) return;
    const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
    if (error) return toast.error(error.message);
    toast.success("You left the group");
    setActiveId(null);
    setManageOpen(false);
    loadGroups();
  };

  const saveDetails = async () => {
    if (!activeId) return;
    if (editForm.name.trim().length < 3) return toast.error("Give the group a name of at least 3 characters");
    setBusy(true);
    const { error } = await supabase.from("groups")
      .update({ name: editForm.name.trim(), description: editForm.description.trim() || null }).eq("id", activeId);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Group details saved");
    loadGroups();
  };

  // Group icon: admins only. The update itself is authorised by row-level security.
  const uploadGroupIcon = async (file: File) => {
    if (!activeId || !isGroupAdmin) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Please choose an image under 5MB");
    setIconUploading(true);
    const path = `groups/${activeId}/icon-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("memorial-media").upload(path, file);
    if (upErr) { setIconUploading(false); return toast.error(upErr.message); }
    const { data } = supabase.storage.from("memorial-media").getPublicUrl(path);
    const { error } = await supabase.from("groups").update({ avatar_url: data.publicUrl }).eq("id", activeId);
    setIconUploading(false);
    if (error) return toast.error("You do not have permission to change this group icon");
    toast.success("Group icon updated");
    logActivity("update", { entity_type: "group", entity_id: activeId, description: "Updated the group icon" });
    loadGroups();
  };

  const removeGroupIcon = async () => {
    if (!activeId || !isGroupAdmin) return;
    const { error } = await supabase.from("groups").update({ avatar_url: null }).eq("id", activeId);
    if (error) return toast.error("You do not have permission to change this group icon");
    toast.success("Group icon removed");
    loadGroups();
  };

  const deleteGroup = async () => {

    if (!activeId || !confirm("Delete this group and all its messages?")) return;
    const { error } = await supabase.from("groups").delete().eq("id", activeId);
    if (error) return toast.error(error.message);
    toast.success("Group deleted");
    setManageOpen(false);
    setActiveId(null);
    loadGroups();
  };

  const setMemberRole = async (m: Member, role: string) => {
    const { error } = await supabase.from("group_members").update({ role }).eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success(role === "admin" ? `${nameOf(m.user_id)} is now an admin` : `${nameOf(m.user_id)} is now a member`);
    loadConversation(m.group_id);
  };

  const removeMember = async (m: Member) => {
    if (!confirm(`Remove ${nameOf(m.user_id)} from this group?`)) return;
    const { error } = await supabase.from("group_members").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Member removed");
    loadConversation(m.group_id);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeId || !input.trim()) return;
    setSending(true);
    const { error } = await supabase.from("group_messages")
      .insert({ group_id: activeId, sender_id: user.id, content: input.trim() });
    setSending(false);
    if (error) return toast.error(error.message);
    setInput("");
  };

  const sendAttachment = async (file: File) => {
    if (!user || !activeId) return;
    if (file.size > 10 * 1024 * 1024) return toast.error("Please choose a file under 10MB");
    setUploading(true);
    const path = `groups/${activeId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("memorial-media").upload(path, file);
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const { data } = supabase.storage.from("memorial-media").getPublicUrl(path);
    const { error } = await supabase.from("group_messages").insert({
      group_id: activeId, sender_id: user.id,
      attachment_url: data.publicUrl,
      attachment_type: file.type.startsWith("image/") ? "image" : "file",
      attachment_name: file.name,
    });
    setUploading(false);
    if (error) toast.error(error.message);
  };

  const saveEdit = async (m: GroupMessage) => {
    if (!editText.trim()) return;
    const { error } = await supabase.from("group_messages")
      .update({ content: editText.trim(), edited_at: new Date().toISOString() }).eq("id", m.id);
    if (error) return toast.error(error.message);
    setEditingId(null);
  };

  const deleteMessage = async (m: GroupMessage) => {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("group_messages").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return groups.filter((g) => !s || g.name.toLowerCase().includes(s) || (g.description || "").toLowerCase().includes(s));
  }, [groups, q]);

  const memberIds = new Set(myMemberships.map((m) => m.group_id));
  const mine = filtered.filter((g) => memberIds.has(g.id));
  const others = filtered.filter((g) => !memberIds.has(g.id));

  // ---------- Conversation view ----------
  if (activeId && activeGroup) {
    return (
      <>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setActiveId(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> All groups
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-2xl truncate">{activeGroup.name}</h2>
            <p className="text-xs text-muted-foreground truncate">
              {members.length} member{members.length === 1 ? "" : "s"}
              {activeGroup.description ? ` · ${activeGroup.description}` : ""}
            </p>
          </div>
          {isMember && (
            <Dialog open={manageOpen} onOpenChange={setManageOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full">
                  <Settings2 className="h-4 w-4 mr-1" /> {isGroupAdmin ? "Manage" : "Group info"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="font-serif text-2xl">{isGroupAdmin ? "Manage group" : "Group info"}</DialogTitle></DialogHeader>
                <div className="space-y-6">
                  {isGroupAdmin && (
                    <div className="space-y-3">
                      <div className="space-y-2"><Label>Group name</Label>
                        <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Description</Label>
                        <Textarea rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
                      <Button onClick={saveDetails} disabled={busy} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save details"}
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Members</p>
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={profiles[m.user_id]?.avatar_url || undefined} />
                          <AvatarFallback className="bg-brand-orange/10 text-brand-orange text-xs">{initialsOf(nameOf(m.user_id))}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{nameOf(m.user_id)}{m.user_id === user?.id ? " (you)" : ""}</p>
                          <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                        </div>
                        {isGroupAdmin && m.user_id !== user?.id && (
                          <div className="flex shrink-0 gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title={m.role === "admin" ? "Make member" : "Make admin"}
                              onClick={() => setMemberRole(m, m.role === "admin" ? "member" : "admin")}>
                              <ShieldCheck className={`h-4 w-4 ${m.role === "admin" ? "text-brand-orange" : "text-muted-foreground"}`} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Remove member"
                              onClick={() => removeMember(m)}>
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                    <Button variant="outline" className="rounded-full" onClick={() => leaveGroup(activeGroup.id)}>
                      <LogOut className="h-4 w-4 mr-1" /> Leave group
                    </Button>
                    {isGroupAdmin && (
                      <Button variant="outline" onClick={deleteGroup}
                        className="rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                        <Trash2 className="h-4 w-4 mr-1" /> Delete group
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!isMember ? (
          <EmptyState icon={UsersRound} title="Members only"
            description="Join this group to read the conversation and share messages." />
        ) : (
          <div className="flex h-[62vh] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
              {messages.length === 0 ? (
                <p className="mt-10 text-center text-sm text-muted-foreground">No messages yet. Say hello.</p>
              ) : messages.map((m) => {
                const own = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words ${own ? "rounded-br-sm bg-brand-orange text-white" : "rounded-bl-sm border border-border bg-background text-foreground"}`}>
                      {!own && <p className="mb-0.5 text-[11px] font-semibold opacity-80">{nameOf(m.sender_id)}</p>}
                      {m.attachment_url && (m.attachment_type === "image" ? (
                        <img src={m.attachment_url} alt={m.attachment_name || "attachment"} className="mb-1 max-h-56 rounded-lg object-cover" />
                      ) : (
                        <a href={m.attachment_url} target="_blank" rel="noreferrer"
                          className={`mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 ${own ? "bg-white/20" : "bg-muted"}`}>
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate text-xs">{m.attachment_name || "Document"}</span>
                        </a>
                      ))}
                      {editingId === m.id ? (
                        <div className="flex items-center gap-1.5">
                          <Input value={editText} onChange={(e) => setEditText(e.target.value)}
                            className="h-8 bg-background text-foreground" autoFocus />
                          <button onClick={() => saveEdit(m)} aria-label="Save" className="rounded p-1 hover:bg-black/10"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditingId(null)} aria-label="Cancel" className="rounded p-1 hover:bg-black/10"><X className="h-4 w-4" /></button>
                        </div>
                      ) : m.content && <p className={`whitespace-pre-wrap ${mine ? "text-black" : "text-foreground"}`}>{m.content}</p>}
                      <div className={`mt-0.5 flex items-center justify-end gap-2 text-[10px] text-black`}>
                        {m.edited_at && <span>edited</span>}
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {own && m.content && isUnread(m) && editingId !== m.id && (
                          <button onClick={() => { setEditingId(m.id); setEditText(m.content || ""); }} aria-label="Edit message" title="Edit before it is read">
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                        {(own || isGroupAdmin) && (
                          <button onClick={() => deleteMessage(m)} aria-label="Delete message"><Trash2 className="h-3 w-3" /></button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-border bg-card p-2">
              <input ref={fileRef} type="file" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) sendAttachment(f); e.target.value = ""; }} />
              <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-lg"
                disabled={uploading} onClick={() => fileRef.current?.click()} aria-label="Attach a file">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </Button>
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…"
                className="h-9 flex-1 rounded-lg bg-background text-foreground placeholder:text-muted-foreground" />
              <Button type="submit" size="icon" disabled={!input.trim() || sending}
                className="h-9 w-9 shrink-0 rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </>
    );
  }

  // ---------- Directory ----------
  const GroupCard = ({ g, joined }: { g: Group; joined: boolean }) => (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
        <UsersRound className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{g.name}</p>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{g.description || "A Makiwa community group."}</p>
        <div className="mt-3 flex gap-2">
          {joined ? (
            <Button size="sm" className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90" onClick={() => setActiveId(g.id)}>
              Open chat
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="rounded-full" disabled={busy} onClick={() => joinGroup(g.id)}>
              Join group
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader title="Groups" subtitle="Community groups for families, friends and support circles."
        action={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
                <Plus className="h-4 w-4 mr-1" /> New group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-serif text-2xl">Create a group</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Group name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wanjiku family circle" /></div>
                <div className="space-y-2"><Label>What is this group about?</Label>
                  <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <p className="text-xs text-muted-foreground">You will be the group admin and can add or remove members at any time.</p>
                <Button onClick={createGroup} disabled={busy} className="w-full rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create group"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search groups…" className="pl-9 rounded-xl" />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState icon={UsersRound} title="No groups yet" description="Create the first group and invite people to join." />
      ) : (
        <div className="space-y-8">
          <section>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">Your groups</h3>
            {mine.length === 0 ? (
              <p className="text-sm text-muted-foreground">You haven't joined a group yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mine.map((g) => <GroupCard key={g.id} g={g} joined />)}
              </div>
            )}
          </section>
          {others.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Discover groups</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((g) => <GroupCard key={g.id} g={g} joined={false} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
};

export default Groups;
