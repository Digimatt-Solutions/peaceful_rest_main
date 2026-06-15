import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Plus, Trash2, Pencil, Save, X, Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ParticipationPanel } from "@/components/announcements/ParticipationPanel";

interface Props { category?: string; title: string; subtitle: string; }

const AnnouncementsPage = ({ category, title, subtitle }: Props) => {
  const { user } = useAuth();
  const { isSuperAdmin, isMemorialAdmin } = useUserRole();
  const [items, setItems] = useState<any[]>([]);
  const [authors, setAuthors] = useState<Record<string, { full_name: string | null; email: string | null }>>({});
  const [form, setForm] = useState({ title: "", body: "", venue: "", event_date: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => { document.title = `${title} · Makiwa`; }, [title]);

  useEffect(() => {
    if (!user) return;
    let q = supabase.from("announcements").select("*").order("created_at", { ascending: false });

    // Super admin sees ALL announcements; others see only their own
    if (!isSuperAdmin) q = q.eq("created_by", user.id);
    if (category) q = q.eq("category", category);

    q.then(async ({ data }) => {
      const list = data || [];
      setItems(list);

      // Fetch author profiles for super admin view
      if (isSuperAdmin && list.length) {
        const ids = Array.from(new Set(list.map((i: any) => i.created_by)));
        const { data: profs } = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
        const map: any = {};
        (profs || []).forEach((p: any) => { map[p.id] = { full_name: p.full_name, email: p.email }; });
        setAuthors(map);
      }
    });
  }, [user, category, isSuperAdmin]);

  // For memorial admins we want to enforce single-announcement scope per category:
  // they can only post if they don't already have one in this category.
  const memorialAdminLocked = isMemorialAdmin && items.some(i => i.created_by === user?.id);

  const add = async () => {
    if (!user || !form.title || !form.body) return;
    if (memorialAdminLocked) {
      toast.error("Memorial admins can only manage one announcement at a time. Edit or delete the existing one.");
      return;
    }
    const payload: any = { ...form, created_by: user.id, event_date: form.event_date || null, category: category || "general" };
    const { data, error } = await supabase.from("announcements").insert(payload).select().maybeSingle();
    if (error) return toast.error(error.message);
    setItems([data, ...items]); setForm({ title: "", body: "", venue: "", event_date: "" });
    toast.success("Posted");
  };

  const startEdit = (a: any) => {
    setEditing(a.id);
    setEditForm({ title: a.title, body: a.body, venue: a.venue || "", event_date: a.event_date ? a.event_date.slice(0, 16) : "" });
  };

  const saveEdit = async (id: string) => {
    const payload: any = { ...editForm, event_date: editForm.event_date || null };
    const { error } = await supabase.from("announcements").update(payload).eq("id", id);
    if (error) return toast.error(error.message);
    setItems(items.map(i => i.id === id ? { ...i, ...payload } : i));
    setEditing(null);
    toast.success("Updated");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems(items.filter(i => i.id !== id));
  };

  const canEdit = (a: any) => isSuperAdmin || a.created_by === user?.id;

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} action={
        isSuperAdmin && (
          <Badge variant="outline" className="rounded-full border-brand-orange/40 text-brand-orange gap-1.5">
            <Shield className="h-3 w-3" /> Super-admin · viewing all
          </Badge>
        )
      } />

      {!memorialAdminLocked && (
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
      )}

      {memorialAdminLocked && (
        <div className="rounded-2xl border border-brand-orange/30 bg-brand-orange/5 p-5 mb-8 text-sm text-foreground/80">
          As a memorial admin, you can manage one {category === "event" ? "event" : "announcement"} at a time. Edit or remove the one below to post a new one.
        </div>
      )}

      {items.length === 0 ? <EmptyState icon={Megaphone} title="Nothing posted yet" /> : (
        <div className="space-y-5">
          {items.map(a => {
            const isEditing = editing === a.id;
            const author = authors[a.created_by];
            return (
              <div key={a.id} className="rounded-2xl border border-border bg-card p-6 group relative transition-shadow hover:shadow-soft">
                {canEdit(a) && !isEditing && (
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(a)} className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(a.id)} className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}

                {isEditing ? (
                  <div className="space-y-3 pr-8">
                    <Input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="font-serif text-xl h-12" />
                    <Textarea rows={4} value={editForm.body} onChange={e => setEditForm({...editForm, body: e.target.value})} />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input type="datetime-local" value={editForm.event_date} onChange={e => setEditForm({...editForm, event_date: e.target.value})} />
                      <Input placeholder="Venue" value={editForm.venue} onChange={e => setEditForm({...editForm, venue: e.target.value})} />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(a.id)} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90"><Save className="h-3.5 w-3.5 mr-1" /> Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(null)} className="rounded-full"><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="font-serif text-2xl font-medium pr-16">{a.title}</h4>
                    <div className="mt-1.5 text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                      {a.event_date && <span>{format(new Date(a.event_date), "MMM d, yyyy · h:mm a")}</span>}
                      {a.event_date && a.venue && <span>·</span>}
                      {a.venue && <span>{a.venue}</span>}
                      {isSuperAdmin && author && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            posted by <span className="font-medium text-foreground/80">{author.full_name || author.email}</span>
                          </span>
                        </>
                      )}
                    </div>
                    <p className="mt-3 text-foreground/85 leading-relaxed whitespace-pre-wrap">{a.body}</p>

                    <ParticipationPanel
                      announcementId={a.id}
                      actions={category === "event" ? ["rsvp", "candle", "donation"] : ["candle", "condolence", "donation"]}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default AnnouncementsPage;
