import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Send, Minus, Check, CheckCheck, Clock, Paperclip, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export interface ChatContext {
  memorialId?: string | null;
  fundraiserId?: string | null;
  label?: string;
}

export interface ChatPeer {
  id: string;
  name: string;
  avatar_url?: string | null;
  subtitle?: string;
  context?: ChatContext;
}

interface ChatPopupProps {
  peer: ChatPeer;
  onClose: () => void;
  embedded?: boolean;
  initialDraft?: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string | null;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
  is_broadcast?: boolean | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  memorial_id?: string | null;
  fundraiser_id?: string | null;
}

const SELECT_COLS =
  "id, sender_id, recipient_id, content, created_at, delivered_at, read_at, is_broadcast, attachment_url, attachment_type, attachment_name, memorial_id, fundraiser_id";


export default function ChatPopup({ peer, onClose, embedded = false, initialDraft }: ChatPopupProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialDraft ?? "");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const markIncoming = async (ids: string[], asRead: boolean) => {
    if (!ids.length || !user) return;
    const now = new Date().toISOString();
    const patch = asRead ? { delivered_at: now, read_at: now } : { delivered_at: now };
    await supabase.from("messages").update(patch).in("id", ids).eq("recipient_id", user.id);
  };

  const ctxMemorial = peer.context?.memorialId ?? null;
  const ctxFundraiser = peer.context?.fundraiserId ?? null;

  const matchesContext = (m: ChatMessage) =>
    (m.memorial_id ?? null) === ctxMemorial && (m.fundraiser_id ?? null) === ctxFundraiser;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      let query = supabase
        .from("messages")
        .select(SELECT_COLS)
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${peer.id}),and(sender_id.eq.${peer.id},recipient_id.eq.${user.id})`
        );
      query = ctxMemorial ? query.eq("memorial_id", ctxMemorial) : query.is("memorial_id", null);
      query = ctxFundraiser ? query.eq("fundraiser_id", ctxFundraiser) : query.is("fundraiser_id", null);

      const { data } = await query.order("created_at", { ascending: true }).limit(300);
      if (cancelled) return;
      const list = (data as ChatMessage[]) || [];
      setMessages(list);
      const incoming = list
        .filter((m) => m.recipient_id === user.id && (!m.read_at || !m.delivered_at))
        .map((m) => m.id);
      markIncoming(incoming, true);
    })();

    const pairKey = [user.id, peer.id].sort().join("-");
    const channel = supabase
      .channel(`makiwa-chat-${pairKey}-${ctxMemorial || ctxFundraiser || "general"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as ChatMessage;
        const involves =
          (m.sender_id === user.id && m.recipient_id === peer.id) ||
          (m.sender_id === peer.id && m.recipient_id === user.id);
        if (!involves || !matchesContext(m)) return;
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        if (m.recipient_id === user.id) markIncoming([m.id], !minimized);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as ChatMessage;
        setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...m } : x)));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, peer.id, ctxMemorial, ctxFundraiser]);


  useEffect(() => {
    if (minimized || !user) return;
    const ids = messages.filter((m) => m.recipient_id === user.id && !m.read_at).map((m) => m.id);
    if (ids.length) markIncoming(ids, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minimized, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, minimized]);

  const pushMessage = async (payload: {
    content?: string;
    attachment_url?: string;
    attachment_type?: string;
    attachment_name?: string;
  }) => {
    if (!user) return;
    const tmpId = `tmp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tmpId,
      sender_id: user.id,
      recipient_id: peer.id,
      content: payload.content || null,
      created_at: new Date().toISOString(),
      delivered_at: null,
      read_at: null,
      attachment_url: payload.attachment_url || null,
      attachment_type: payload.attachment_type || null,
      attachment_name: payload.attachment_name || null,
      memorial_id: ctxMemorial,
      fundraiser_id: ctxFundraiser,
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        recipient_id: peer.id,
        content: payload.content || "",
        attachment_url: payload.attachment_url || null,
        attachment_type: payload.attachment_type || null,
        attachment_name: payload.attachment_name || null,
        memorial_id: ctxMemorial,
        fundraiser_id: ctxFundraiser,
      })
      .select(SELECT_COLS)
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tmpId));
      toast.error("Failed to send message");
    } else if (data) {
      setMessages((prev) => prev.map((m) => (m.id === tmpId ? (data as ChatMessage) : m)));
    }
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");
    await pushMessage({ content });
    setSending(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) return toast.error("Maximum file size is 10MB");
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `chat/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("memorial-media")
      .upload(path, file, { contentType: file.type });
    if (upErr) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from("memorial-media").getPublicUrl(path);
    await pushMessage({
      attachment_url: pub.publicUrl,
      attachment_type: file.type,
      attachment_name: file.name,
    });
    setUploading(false);
  };

  const initials = peer.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const Body = (
    <>
      {!embedded && (
        <div
          className="flex cursor-pointer items-center gap-3 bg-brand-orange px-3 py-2.5 text-white"
          onClick={() => setMinimized((m) => !m)}
        >
          {peer.avatar_url ? (
            <img src={peer.avatar_url} alt={peer.name} className="h-9 w-9 rounded-full object-cover ring-2 ring-white/30" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{peer.name}</p>
            <p className="text-[11px] opacity-90">{peer.subtitle || "Direct message"}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setMinimized((m) => !m); }} className="rounded p-1 hover:bg-white/20">
            <Minus className="h-4 w-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="rounded p-1 hover:bg-white/20">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {(embedded || !minimized) && (
        <>
          {peer.context?.label && (
            <div className="flex items-center gap-2 border-b border-brand-orange/20 bg-brand-orange/5 px-3 py-2 text-[11px] text-muted-foreground">
              {ctxFundraiser ? <HandHeart className="h-3.5 w-3.5 text-brand-orange" /> : <Flower2 className="h-3.5 w-3.5 text-brand-orange" />}
              <span className="truncate">
                About <span className="font-medium text-foreground">{peer.context.label}</span>
              </span>
            </div>
          )}
          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-3">

            {messages.length === 0 ? (
              <p className="mt-10 text-center text-xs text-muted-foreground">
                No messages yet. Start the conversation with {peer.name.split(" ")[0]}.
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.sender_id === user?.id;
                const pending = mine && m.id.startsWith("tmp-");
                const isImage = (m.attachment_type || "").startsWith("image/");
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] break-words rounded-2xl px-3 py-2 text-[13px] leading-snug ${
                        mine
                          ? "rounded-br-sm bg-brand-orange text-white"
                          : "rounded-bl-sm border border-border bg-background text-foreground"
                      }`}
                    >
                      {m.is_broadcast && (
                        <span className="mb-1 inline-block rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          Broadcast
                        </span>
                      )}
                      {m.attachment_url &&
                        (isImage ? (
                          <a href={m.attachment_url} target="_blank" rel="noreferrer">
                            <img src={m.attachment_url} alt={m.attachment_name || "attachment"} className="mb-1 max-h-56 rounded-lg object-cover" />
                          </a>
                        ) : (
                          <a
                            href={m.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className={`mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 ${mine ? "bg-white/20" : "bg-muted"}`}
                          >
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="truncate text-xs">{m.attachment_name || "Document"}</span>
                          </a>
                        ))}
                      {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                      <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${mine ? "opacity-90" : "text-muted-foreground"}`}>
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {mine &&
                          (pending ? (
                            <Clock className="h-3 w-3" />
                          ) : m.read_at ? (
                            <CheckCheck className="h-3.5 w-3.5 text-sky-200" />
                          ) : m.delivered_at ? (
                            <CheckCheck className="h-3.5 w-3.5" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 border-t border-border bg-card p-2"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx,.txt,.xls,.xlsx"
              className="hidden"
              onChange={handleFile}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-9 w-9 shrink-0 rounded-lg"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Attach file"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </Button>
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…" className="h-9 flex-1 rounded-lg" autoFocus />
            <Button type="submit" size="icon" disabled={!input.trim() || sending} className="h-9 w-9 shrink-0 rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </>
      )}
    </>
  );

  if (embedded) {
    return <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">{Body}</div>;
  }

  return createPortal(
    <div
      className="fixed bottom-3 right-3 z-[100] flex w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:bottom-4 sm:right-4 sm:w-[360px]"
      style={{ height: minimized ? 56 : "min(70vh, 540px)" }}
    >
      {Body}
    </div>,
    document.body
  );
}
