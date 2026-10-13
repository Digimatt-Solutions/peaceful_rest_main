import { useRef, useState } from "react";
import { Heart, MessageCircle, Loader2, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmojiPicker, insertAtCursor } from "./EmojiPicker";
import { ShareMemorialMenu } from "./ShareMemorialMenu";
import defaultProfile from "@/assets/default-profile.png.asset.json";

export const avatarOf = (url?: string | null) => url || defaultProfile.url;

type Comment = { id: string; user_id: string | null; guest_name?: string | null; body: string; created_at: string };

export const CondolenceTribute = ({ c, avatar, likes, comments, profiles, userId, memorialUrl, memorialId, memorialName, onChange }: {
  c: any; avatar?: string | null; likes: { user_id: string | null }[]; comments: Comment[];
  profiles: Record<string, { full_name: string | null; avatar_url: string | null }>;
  userId: string | null; memorialUrl: string; memorialId: string; memorialName: string; onChange: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [guestName, setGuestName] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const liked = !!userId && likes.some((l) => l.user_id === userId);

  const toggleLike = async () => {
    const q = liked && userId
      ? supabase.from("condolence_likes" as any).delete().eq("condolence_id", c.id).eq("user_id", userId)
      : supabase.from("condolence_likes" as any).insert({ condolence_id: c.id, ...(userId ? { user_id: userId } : {}) });
    const { error } = await q;
    if (error) return toast.error(error.message);
    onChange();
  };

  const sendReply = async () => {
    const body = reply.trim();
    if (!body) return;
    if (body.length > 1000) return toast.error("Reply is too long");
    const name = guestName.trim();
    if (!userId && !name) return toast.error("Please add your name so the family knows who is replying.");
    setBusy(true);
    const { error } = await supabase.from("condolence_comments" as any).insert({
      condolence_id: c.id, body,
      ...(userId ? { user_id: userId } : { guest_name: name }),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setReply("");
    onChange();
  };

  const removeReply = async (id: string) => {
    const { error } = await supabase.from("condolence_comments" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChange();
  };

  const share = async () => {
    const url = `${memorialUrl}#tribute-${c.id}`;
    const text = `${c.name}: "${c.message.slice(0, 140)}${c.message.length > 140 ? "…" : ""}"`;
    try {
      if (navigator.share) await navigator.share({ title: "Makiwa tribute", text, url });
      else { await navigator.clipboard.writeText(url); toast.success("Tribute link copied"); }
    } catch (e: any) { if (e?.name !== "AbortError") toast.error("Could not share"); }
  };

  return (
    <div id={`tribute-${c.id}`} className={`rounded-2xl border p-5 sm:p-6 ${c.is_pinned ? "border-brand-orange/40 bg-brand-orange/[0.03]" : "border-border bg-card"}`}>
      <div className="flex items-center gap-3">
        <img src={avatarOf(avatar)} alt={c.name} className="h-10 w-10 rounded-full object-cover bg-muted shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{c.name}</p>
          <p className="text-xs text-muted-foreground">
            {c.relationship ? `${c.relationship} · ` : ""}{format(new Date(c.created_at), "MMM d, yyyy")}
          </p>
        </div>
        {c.is_pinned && <span className="text-[10px] uppercase tracking-widest text-brand-orange font-semibold">Pinned</span>}
      </div>

      <div className={c.media_url ? "mt-4 grid sm:grid-cols-[1fr_200px] gap-4" : "mt-4"}>
        <p className="text-foreground/85 leading-relaxed whitespace-pre-line break-words">{c.message}</p>
        {c.media_url && (
          <figure className="rounded-xl overflow-hidden border border-border bg-muted">
            {c.media_type === "video"
              ? <video src={c.media_url} controls preload="metadata" className="w-full max-h-64 object-cover" />
              : <img src={c.media_url} alt={c.media_title || "Life moment"} loading="lazy" className="w-full max-h-64 object-cover" />}
            {c.media_title && <figcaption className="px-3 py-2 text-xs text-muted-foreground">{c.media_title}</figcaption>}
          </figure>
        )}
      </div>

      <div className="mt-4 flex items-center gap-1 sm:gap-3 border-t border-border pt-3 text-sm">
        <button onClick={toggleLike} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-muted ${liked ? "text-brand-orange" : "text-muted-foreground"}`}>
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {likes.length}
        </button>
        <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-muted text-muted-foreground">
          <MessageCircle className="h-4 w-4" /> {comments.length} {comments.length === 1 ? "reply" : "replies"}
        </button>
        <button onClick={share} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-muted text-muted-foreground ml-auto">
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          {comments.map((r) => {
            const p = profiles[r.user_id];
            return (
              <div key={r.id} className="flex gap-2.5">
                <img src={avatarOf(p?.avatar_url)} alt="" className="h-8 w-8 rounded-full object-cover bg-muted shrink-0" />
                <div className="flex-1 min-w-0 rounded-2xl bg-muted/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{p?.full_name || "Makiwa member"}</p>
                    <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                    {r.user_id === userId && (
                      <button onClick={() => removeReply(r.id)} aria-label="Delete reply" className="ml-auto text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                  <p className="text-sm text-foreground/85 whitespace-pre-line break-words">{r.body}</p>
                </div>
              </div>
            );
          })}
          {userId ? (
            <div className="flex items-end gap-1.5">
              <EmojiPicker onPick={(e) => setReply((v) => insertAtCursor(ref.current, v, e))} />
              <Textarea ref={ref} value={reply} onChange={(e) => setReply(e.target.value)} rows={1} maxLength={1000} placeholder="Write a reply…" className="rounded-2xl min-h-[40px] flex-1" />
              <Button size="icon" onClick={sendReply} disabled={busy || !reply.trim()} className="rounded-full bg-brand-orange text-brand-black hover:bg-brand-orange/90 shrink-0">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground"><Link to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} className="text-brand-orange underline">Sign in</Link> to reply.</p>
          )}
        </div>
      )}
    </div>
  );
};
