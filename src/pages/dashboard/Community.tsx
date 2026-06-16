import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessagesSquare, Image as ImageIcon, Heart, MessageCircle, Send, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Profile = { id: string; full_name: string | null; avatar_url: string | null; email: string | null };

const Community = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    document.title = "Community · Makiwa";
    loadFeed();
    if (user) supabase.from("profiles").select("id,full_name,avatar_url,email").eq("id", user.id).maybeSingle()
      .then(({ data }) => setMyProfile(data as Profile));
  }, [user]);

  const loadFeed = async () => {
    const { data: ps } = await supabase.from("community_posts").select("*").order("created_at", { ascending: false }).limit(50);
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
  };

  const toggleLike = async (postId: string) => {
    if (!user) return toast.error("Sign in to like posts");
    const cur = likes[postId] || { count: 0, mine: false };
    setLikes(l => ({ ...l, [postId]: { count: cur.count + (cur.mine ? -1 : 1), mine: !cur.mine } }));
    if (cur.mine) {
      await (supabase as any).from("community_post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await (supabase as any).from("community_post_likes").insert({ post_id: postId, user_id: user.id });
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
  };

  const deletePost = async (id: string) => {
    await supabase.from("community_posts").delete().eq("id", id);
    setPosts(posts.filter(p => p.id !== id));
  };

  const deleteComment = async (postId: string, id: string) => {
    await (supabase as any).from("community_post_comments").delete().eq("id", id);
    setComments(c => ({ ...c, [postId]: (c[postId] || []).filter(x => x.id !== id) }));
  };

  const me = myProfile;
  const myInitial = (me?.full_name || me?.email || user?.email || "?").charAt(0).toUpperCase();

  return (
    <>
      <PageHeader title="Community" subtitle="Share, react and comment with the Makiwa community." />

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

                <div className="px-2 py-1 grid grid-cols-2 border-b border-border">
                  <button onClick={() => toggleLike(p.id)} className={`flex items-center justify-center gap-2 py-2 rounded-md hover:bg-muted text-sm font-medium ${lk.mine ? "text-red-500" : "text-muted-foreground"}`}>
                    <Heart className={`h-4 w-4 ${lk.mine ? "fill-red-500" : ""}`} /> Like
                  </button>
                  <button onClick={() => setOpenComments(o => ({ ...o, [p.id]: !o[p.id] }))} className="flex items-center justify-center gap-2 py-2 rounded-md hover:bg-muted text-sm font-medium text-muted-foreground">
                    <MessageCircle className="h-4 w-4" /> Comment
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
    </>
  );
};

export default Community;
