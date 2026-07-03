import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessagesSquare, Image as ImageIcon, Heart, MessageCircle, Send, Trash2, Loader2, Newspaper, Plus, Pencil, X, Share2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { logActivity } from "@/lib/activity";

type Profile = { id: string; full_name: string | null; avatar_url: string | null; email: string | null };

const Community = () => {
  const { user } = useAuth();
  const { isSuperAdmin } = useUserRole();
  const [posts, setPosts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [likes, setLikes] = useState<Record<string, { count: number; mine: boolean }>>({});
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);

  // Admin blog state
  const [blogs, setBlogs] = useState<any[]>([]);
  const [blogOpen, setBlogOpen] = useState(false);
  const [blogEditing, setBlogEditing] = useState<any | null>(null);
  const [blogForm, setBlogForm] = useState({ title: "", body: "", image_url: "" });
  const [blogUploading, setBlogUploading] = useState(false);
  const [blogSaving, setBlogSaving] = useState(false);

  useEffect(() => {
    document.title = "Community · Makiwa";
    loadFeed();
    loadBlogs();
    if (user) supabase.from("profiles").select("id,full_name,avatar_url,email").eq("id", user.id).maybeSingle()
      .then(({ data }) => setMyProfile(data as Profile));
  }, [user]);

  const loadBlogs = async () => {
    const { data } = await supabase.from("community_posts").select("*").eq("category", "blog").order("created_at", { ascending: false }).limit(20);
    setBlogs(data || []);
  };

  const uploadBlogImage = async (file: File) => {
    if (!user) return;
    setBlogUploading(true);
    const path = `${user.id}/blog/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("memorial-media").upload(path, file);
    if (error) { toast.error(error.message); setBlogUploading(false); return; }
    const { data } = supabase.storage.from("memorial-media").getPublicUrl(path);
    setBlogForm(f => ({ ...f, image_url: data.publicUrl }));
    setBlogUploading(false);
  };

  const openNewBlog = () => { setBlogEditing(null); setBlogForm({ title: "", body: "", image_url: "" }); setBlogOpen(true); };
  const openEditBlog = (b: any) => { setBlogEditing(b); setBlogForm({ title: b.title || "", body: b.body || "", image_url: b.image_url || "" }); setBlogOpen(true); };

  const saveBlog = async () => {
    if (!user || !blogForm.title.trim()) return toast.error("Title required");
    setBlogSaving(true);
    if (blogEditing) {
      const { data, error } = await (supabase as any).from("community_posts")
        .update({ title: blogForm.title, body: blogForm.body || " ", image_url: blogForm.image_url || null })
        .eq("id", blogEditing.id).select().maybeSingle();
      setBlogSaving(false);
      if (error) return toast.error(error.message);
      setBlogs(bs => bs.map(x => x.id === data.id ? data : x));
    } else {
      const { data, error } = await (supabase as any).from("community_posts")
        .insert({ user_id: user.id, category: "blog", title: blogForm.title, body: blogForm.body || " ", image_url: blogForm.image_url || null })
        .select().maybeSingle();
      setBlogSaving(false);
      if (error) return toast.error(error.message);
      setBlogs(bs => [data, ...bs]);
    }
    setBlogOpen(false);
    toast.success("Saved");
  };

  const deleteBlog = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await supabase.from("community_posts").delete().eq("id", id);
    setBlogs(bs => bs.filter(b => b.id !== id));
  };


  const loadFeed = async () => {
    const { data: ps } = await supabase.from("community_posts").select("*").neq("category", "blog").order("created_at", { ascending: false }).limit(50);
    setPosts(ps || []);
    const userIds = [...new Set((ps || []).map((p: any) => p.user_id))];
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id,full_name,avatar_url,email").in("id", userIds);
      const map: Record<string, Profile> = {};
      (profs || []).forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
    }
    const ids = (ps || []).map((p: any) => p.id);
    if (ids.length) {
      const { data: lk } = await (supabase as any).from("community_post_likes").select("post_id,user_id").in("post_id", ids);
      const lmap: Record<string, { count: number; mine: boolean }> = {};
      ids.forEach((id: string) => { lmap[id] = { count: 0, mine: false }; });
      (lk || []).forEach((l: any) => {
        lmap[l.post_id].count++;
        if (l.user_id === user?.id) lmap[l.post_id].mine = true;
      });
      setLikes(lmap);
      const { data: cm } = await (supabase as any).from("community_post_comments").select("*").in("post_id", ids).order("created_at", { ascending: true });
      const cmap: Record<string, any[]> = {};
      ids.forEach((id: string) => { cmap[id] = []; });
      (cm || []).forEach((c: any) => { cmap[c.post_id].push(c); });
      setComments(cmap);
      // load comment author profiles too
      const cuserIds = [...new Set((cm || []).map((c: any) => c.user_id))].filter(id => !userIds.includes(id as string));
      if (cuserIds.length) {
        const { data: cprofs } = await supabase.from("profiles").select("id,full_name,avatar_url,email").in("id", cuserIds as string[]);
        setProfiles(prev => {
          const next = { ...prev };
          (cprofs || []).forEach((p: any) => { next[p.id] = p; });
          return next;
        });
      }
    }
  };

  const upload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/community/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("memorial-media").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("memorial-media").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  };

  const post = async () => {
    if (!user || (!body.trim() && !imageUrl)) return;
    setPosting(true);
    const { data, error } = await (supabase as any).from("community_posts").insert({
      user_id: user.id, body: body.trim() || " ", category: "discussion", image_url: imageUrl || null,
    }).select().maybeSingle();
    setPosting(false);
    if (error) return toast.error(error.message);
    setPosts([data, ...posts]);
    setLikes(l => ({ ...l, [data.id]: { count: 0, mine: false } }));
    setComments(c => ({ ...c, [data.id]: [] }));
    setBody(""); setImageUrl("");
    logActivity("create", { entity_type: "community_post", entity_id: data.id, description: "Created a community post" });
  };

  const toggleLike = async (postId: string) => {
    if (!user) return toast.error("Sign in to like posts");
    const cur = likes[postId] || { count: 0, mine: false };
    setLikes(l => ({ ...l, [postId]: { count: cur.count + (cur.mine ? -1 : 1), mine: !cur.mine } }));
    if (cur.mine) {
      await (supabase as any).from("community_post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      logActivity("unlike", { entity_type: "community_post", entity_id: postId, description: "Removed like from a post" });
    } else {
      await (supabase as any).from("community_post_likes").insert({ post_id: postId, user_id: user.id });
      logActivity("like", { entity_type: "community_post", entity_id: postId, description: "Liked a community post" });
    }
  };

  const addComment = async (postId: string) => {
    if (!user) return toast.error("Sign in to comment");
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return;
    const { data, error } = await (supabase as any).from("community_post_comments")
      .insert({ post_id: postId, user_id: user.id, body: text }).select().maybeSingle();
    if (error) return toast.error(error.message);
    setComments(c => ({ ...c, [postId]: [...(c[postId] || []), data] }));
    setCommentDrafts(d => ({ ...d, [postId]: "" }));
    if (myProfile) setProfiles(p => ({ ...p, [user.id]: myProfile }));
    logActivity("comment", { entity_type: "community_post", entity_id: postId, description: "Commented on a community post" });
  };

  const deletePost = async (id: string) => {
    await supabase.from("community_posts").delete().eq("id", id);
    setPosts(posts.filter(p => p.id !== id));
    logActivity("delete", { entity_type: "community_post", entity_id: id, description: "Deleted a community post" });
  };

  const deleteComment = async (postId: string, id: string) => {
    await (supabase as any).from("community_post_comments").delete().eq("id", id);
    setComments(c => ({ ...c, [postId]: (c[postId] || []).filter(x => x.id !== id) }));
    logActivity("delete", { entity_type: "community_post_comment", entity_id: id, description: "Deleted a comment" });
  };

  const sharePost = async (p: any) => {
    const url = `${window.location.origin}/dashboard/community#post-${p.id}`;
    const text = p.title || (p.body && p.body.trim()) || "Community post on Makiwa";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Makiwa community", text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
      logActivity("share", { entity_type: "community_post", entity_id: p.id, description: "Shared a community post" });
    } catch {
      /* user dismissed */
    }
  };

  const me = myProfile;
  const myInitial = (me?.full_name || me?.email || user?.email || "?").charAt(0).toUpperCase();

  return (
    <>
      <PageHeader title="Community" subtitle="Share, react and comment with the Makiwa community." />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="min-w-0">
      {/* Composer */}
      {user && (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 mb-6 shadow-sm">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={me?.avatar_url || undefined} />
              <AvatarFallback className="bg-brand-orange text-white">{myInitial}</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder="What's on your mind? Share a memory, fun fact, or update…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[64px] resize-none border-0 bg-muted/40 focus-visible:ring-1 focus-visible:ring-brand-orange/50 rounded-xl"
            />
          </div>
          {imageUrl && (
            <div className="mt-3 ml-13 relative inline-block">
              <img src={imageUrl} alt="" className="h-32 rounded-lg object-cover" />
              <button onClick={() => setImageUrl("")} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black/70 text-white text-xs">×</button>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
              <ImageIcon className="h-4 w-4" />
              {uploading ? "Uploading…" : "Photo"}
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} disabled={uploading} />
            </label>
            <Button onClick={post} disabled={posting || (!body.trim() && !imageUrl)} className="rounded-full bg-brand-orange text-white hover:bg-brand-orange/90 px-6">
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1.5" /> Post</>}
            </Button>
          </div>
        </div>
      )}

      {posts.length === 0 ? <EmptyState icon={MessagesSquare} title="No posts yet" description="Be the first to share something." /> : (
        <div className="space-y-5">
          {posts.map(p => {
            const author = profiles[p.user_id];
            const lk = likes[p.id] || { count: 0, mine: false };
            const cm = comments[p.id] || [];
            const canDelete = p.user_id === user?.id;
            return (
              <article key={p.id} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <header className="p-4 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={author?.avatar_url || undefined} />
                    <AvatarFallback className="bg-brand-orange text-white">{(author?.full_name || author?.email || "?").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{author?.full_name || author?.email || "Member"}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</p>
                  </div>
                  {canDelete && (
                    <button onClick={() => deletePost(p.id)} className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-muted">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </header>

                {p.title && <h3 className="px-4 -mt-1 font-serif text-xl">{p.title}</h3>}
                {p.body && p.body.trim() && (
                  <p className="px-4 pb-3 text-foreground/90 leading-relaxed whitespace-pre-wrap">{p.body}</p>
                )}

                {p.image_url && (
                  <div className="bg-muted/30 border-y border-border">
                    <img src={p.image_url} alt="" className="w-full max-h-[600px] object-cover" />
                  </div>
                )}

                <div className="px-4 py-2 flex items-center gap-5 text-sm text-muted-foreground border-b border-border">
                  {lk.count > 0 && <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" /> {lk.count}</span>}
                  {cm.length > 0 && (
                    <button onClick={() => setOpenComments(o => ({ ...o, [p.id]: !o[p.id] }))} className="ml-auto hover:underline">
                      {cm.length} {cm.length === 1 ? "comment" : "comments"}
                    </button>
                  )}
                </div>

                <div className="px-2 py-1 grid grid-cols-3 border-b border-border">
                  <button onClick={() => toggleLike(p.id)} className={`flex items-center justify-center gap-2 py-2 rounded-md hover:bg-muted text-sm font-medium ${lk.mine ? "text-red-500" : "text-muted-foreground"}`}>
                    <Heart className={`h-4 w-4 ${lk.mine ? "fill-red-500" : ""}`} /> Like
                  </button>
                  <button onClick={() => setOpenComments(o => ({ ...o, [p.id]: !o[p.id] }))} className="flex items-center justify-center gap-2 py-2 rounded-md hover:bg-muted text-sm font-medium text-muted-foreground">
                    <MessageCircle className="h-4 w-4" /> Comment
                  </button>
                  <button onClick={() => sharePost(p)} className="flex items-center justify-center gap-2 py-2 rounded-md hover:bg-muted text-sm font-medium text-muted-foreground">
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                </div>

                {(openComments[p.id] || cm.length > 0) && (
                  <div className="p-4 space-y-3">
                    {cm.map(c => {
                      const a = profiles[c.user_id];
                      const canDel = c.user_id === user?.id;
                      return (
                        <div key={c.id} className="flex gap-2 items-start group">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={a?.avatar_url || undefined} />
                            <AvatarFallback className="bg-brand-orange/80 text-white text-xs">{(a?.full_name || a?.email || "?").charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="rounded-2xl bg-muted/60 px-3 py-2">
                              <p className="text-xs font-medium">{a?.full_name || a?.email || "Member"}</p>
                              <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{c.body}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 ml-3">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
                          </div>
                          {canDel && (
                            <button onClick={() => deleteComment(p.id, c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {user && (
                      <div className="flex gap-2 items-start pt-1">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={me?.avatar_url || undefined} />
                          <AvatarFallback className="bg-brand-orange text-white text-xs">{myInitial}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <input
                            value={commentDrafts[p.id] || ""}
                            onChange={(e) => setCommentDrafts(d => ({ ...d, [p.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment(p.id); } }}
                            placeholder="Write a comment…"
                            className="flex-1 px-3 py-2 text-sm rounded-full bg-muted/60 border-0 focus:outline-none focus:ring-1 focus:ring-brand-orange/50"
                          />
                          <button onClick={() => addComment(p.id)} className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-brand-orange text-white hover:bg-brand-orange/90">
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
        </div>

        {/* Right sidebar: Blog / Announcements */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-brand-orange/15 text-brand-orange flex items-center justify-center">
                  <Newspaper className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-lg">Blog</h3>
              </div>
              {isSuperAdmin && (
                <Button size="sm" onClick={openNewBlog} className="h-8 rounded-full bg-brand-orange hover:bg-brand-orange/90 text-white">
                  <Plus className="h-3.5 w-3.5 mr-1" /> New
                </Button>
              )}
            </div>
            {blogs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No posts yet.</p>
            ) : (
              <div className="space-y-4">
                {blogs.map(b => (
                  <article key={b.id} className="group rounded-xl overflow-hidden border border-border/70 bg-background hover:shadow-md transition-shadow">
                    {b.image_url && <img src={b.image_url} alt="" className="w-full h-52 object-cover" />}
                    <div className="p-3">
                      <h4 className="font-serif text-sm font-medium leading-tight line-clamp-2">{b.title}</h4>
                      {b.body && b.body.trim() && b.body !== " " && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{b.body}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}</span>
                        {isSuperAdmin && (
                          <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditBlog(b)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button onClick={() => deleteBlog(b.id)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <Dialog open={blogOpen} onOpenChange={setBlogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-2xl">{blogEditing ? "Edit blog post" : "New blog post"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} />
            <Textarea placeholder="Write the post…" rows={6} value={blogForm.body} onChange={(e) => setBlogForm({ ...blogForm, body: e.target.value })} />
            {blogForm.image_url && (
              <div className="relative inline-block">
                <img src={blogForm.image_url} alt="" className="h-32 rounded-lg object-cover" />
                <button onClick={() => setBlogForm({ ...blogForm, image_url: "" })} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black/80 text-white inline-flex items-center justify-center">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
              <ImageIcon className="h-4 w-4" />
              {blogUploading ? "Uploading…" : "Add photo"}
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadBlogImage(e.target.files[0])} disabled={blogUploading} />
            </label>
            <Button onClick={saveBlog} disabled={blogSaving} className="w-full rounded-full bg-brand-orange text-white hover:bg-brand-orange/90">
              {blogSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : blogEditing ? "Update" : "Publish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Community;
