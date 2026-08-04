import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import ChatPopup, { ChatPeer } from "@/components/chat/ChatPopup";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Search, LifeBuoy, ShieldCheck, Clock3, Send, Users, Megaphone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";

interface ConvRow {
  key: string;
  peer_id: string;
  peer_name: string;
  peer_avatar: string | null;
  memorial_id: string | null;
  fundraiser_id: string | null;
  context_label: string | null;
  last_content: string;
  last_at: string;
  last_sender_id: string;
  unread: number;
}

interface ContextOption {
  value: string;
  label: string;
  memorialId: string | null;
  fundraiserId: string | null;
}


interface DirectoryUser {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Super Admin",
  memorial_admin: "Memorial Admin",
  mourner: "Mourner",
  user: "Mourner",
};

const initialsOf = (name: string) =>
  (name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

export default function Messages() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const isAdmin = role === "super_admin" || role === "admin";

  const [convs, setConvs] = useState<ConvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [active, setActive] = useState<ChatPeer | null>(null);

  // memorial / fundraiser context
  const [contextOptions, setContextOptions] = useState<ContextOption[]>([]);
  const [contextValue, setContextValue] = useState("general");

  // mourner / memorial admin support box
  const [supportMsg, setSupportMsg] = useState("");
  const [supportSending, setSupportSending] = useState(false);

  // admin directory + broadcast
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [dirLoading, setDirLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);

  const selectedContext = useMemo(
    () => contextOptions.find((o) => o.value === contextValue) || null,
    [contextOptions, contextValue]
  );

  // Load memorial + fundraiser context options
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: mems }, { data: funds }] = await Promise.all([
        supabase.from("memorials").select("id, full_name").order("created_at", { ascending: false }).limit(200),
        supabase.from("fundraisers").select("id, title, memorial_id").order("created_at", { ascending: false }).limit(200),
      ]);
      const memName = new Map((mems || []).map((m) => [m.id, m.full_name]));
      setContextOptions([
        ...(mems || []).map((m) => ({
          value: `m:${m.id}`,
          label: `Memorial · ${m.full_name}`,
          memorialId: m.id,
          fundraiserId: null,
        })),
        ...(funds || []).map((f) => ({
          value: `f:${f.id}`,
          label: `Fundraiser · ${f.title}${memName.get(f.memorial_id) ? ` (${memName.get(f.memorial_id)})` : ""}`,
          memorialId: null,
          fundraiserId: f.id,
        })),
      ]);
    })();
  }, [user]);

  const load = async () => {
    if (!user) return;
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, sender_id, recipient_id, content, attachment_name, created_at, read_at, memorial_id, fundraiser_id")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(500);

    const map = new Map<string, ConvRow>();
    (msgs || []).forEach((m) => {
      const peerId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const key = `${peerId}|${m.memorial_id || ""}|${m.fundraiser_id || ""}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          peer_id: peerId,
          peer_name: "",
          peer_avatar: null,
          memorial_id: m.memorial_id ?? null,
          fundraiser_id: m.fundraiser_id ?? null,
          context_label: null,
          last_content: m.content || m.attachment_name || "Attachment",
          last_at: m.created_at,
          last_sender_id: m.sender_id,
          unread: m.recipient_id === user.id && !m.read_at ? 1 : 0,
        });
      } else if (m.recipient_id === user.id && !m.read_at) {
        existing.unread += 1;
      }
    });

    const rows = Array.from(map.values());
    const peerIds = Array.from(new Set(rows.map((r) => r.peer_id)));
    if (peerIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", peerIds);
      const profMap = new Map((profs || []).map((p) => [p.id, p]));
      rows.forEach((r) => {
        const p = profMap.get(r.peer_id);
        if (p) {
          r.peer_name = p.full_name || p.email?.split("@")[0] || "User";
          r.peer_avatar = p.avatar_url;
        }
      });
    }

    const memIds = Array.from(new Set(rows.map((r) => r.memorial_id).filter(Boolean))) as string[];
    const fundIds = Array.from(new Set(rows.map((r) => r.fundraiser_id).filter(Boolean))) as string[];
    const [memRes, fundRes] = await Promise.all([
      memIds.length ? supabase.from("memorials").select("id, full_name").in("id", memIds) : Promise.resolve({ data: [] as any[] }),
      fundIds.length ? supabase.from("fundraisers").select("id, title").in("id", fundIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const memMap = new Map((memRes.data || []).map((m: any) => [m.id, m.full_name]));
    const fundMap = new Map((fundRes.data || []).map((f: any) => [f.id, f.title]));
    rows.forEach((r) => {
      if (r.fundraiser_id) r.context_label = fundMap.get(r.fundraiser_id) || "Fundraiser";
      else if (r.memorial_id) r.context_label = memMap.get(r.memorial_id) || "Memorial";
    });

    setConvs(rows.sort((a, b) => +new Date(b.last_at) - +new Date(a.last_at)));
    setLoading(false);
  };


  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel(`chat-list-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Admin directory
  useEffect(() => {
    if (!isAdmin || !user) return;
    setDirLoading(true);
    (async () => {
      const [{ data: profs }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, avatar_url").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const roleMap = new Map((roles || []).map((r) => [r.user_id, r.role as string]));
      setDirectory(
        (profs || [])
          .filter((p) => p.id !== user.id)
          .map((p) => ({ ...p, role: roleMap.get(p.id) || "mourner" }))
      );
      setDirLoading(false);
    })();
  }, [isAdmin, user]);

  const filteredConvs = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return convs;
    return convs.filter((c) => c.peer_name.toLowerCase().includes(s) || c.last_content.toLowerCase().includes(s));
  }, [convs, q]);

  const filteredUsers = useMemo(() => {
    const s = userSearch.trim().toLowerCase();
    if (!s) return directory;
    return directory.filter(
      (u) => (u.full_name || "").toLowerCase().includes(s) || (u.email || "").toLowerCase().includes(s)
    );
  }, [directory, userSearch]);

  const groupedUsers = useMemo(() => {
    const groups: Record<string, DirectoryUser[]> = {};
    filteredUsers.forEach((u) => {
      const key = roleLabels[u.role] || "Mourner";
      (groups[key] ||= []).push(u);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredUsers]);

  const sendSupport = async () => {
    if (!user || !supportMsg.trim()) return;
    setSupportSending(true);
    const { data: adminId, error: rpcErr } = await supabase.rpc("get_support_admin_id");
    if (rpcErr || !adminId) {
      toast.error("Support is unavailable right now");
      setSupportSending(false);
      return;
    }
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: adminId as string,
      content: `[Support] ${supportMsg.trim()}`,
    });
    if (error) toast.error("Could not reach support");
    else {
      toast.success("Support has been notified");
      logActivity("support_message", { entity_type: "message", description: "Contacted support via chat" });
      setSupportMsg("");
      load();
    }
    setSupportSending(false);
  };

  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setBroadcastSending(true);
    const { data, error } = await supabase.functions.invoke("admin-broadcast-message", {
      body: { target: broadcastTarget, content: broadcastMsg.trim() },
    });
    setBroadcastSending(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Broadcast failed");
      return;
    }
    toast.success(`Broadcast delivered to ${data.sent} recipient${data.sent === 1 ? "" : "s"}`);
    setBroadcastMsg("");
    load();
  };

  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle={isAdmin ? "Direct messages, support requests and broadcasts" : "Chat with the Makiwa support team"}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations…" className="pl-9 rounded-xl" />
          </div>

          {active ? (
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setActive(null)}>
                ← Back to conversations
              </Button>
              <div className="h-[540px]">
                <ChatPopup peer={active} onClose={() => setActive(null)} embedded />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden divide-y divide-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4">
                    <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
                      <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                ))
              ) : filteredConvs.length === 0 ? (
                <EmptyState
                  icon={MessageCircle}
                  title="No conversations yet"
                  description={isAdmin ? "Pick a user from the directory to start a direct message." : "Send a message to support and we'll reply here."}
                />
              ) : (
                filteredConvs.map((c) => {
                  const fromMe = c.last_sender_id === user?.id;
                  return (
                    <button
                      key={c.peer_id}
                      onClick={() => setActive({ id: c.peer_id, name: c.peer_name || "User", avatar_url: c.peer_avatar })}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50"
                    >
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={c.peer_avatar || undefined} />
                        <AvatarFallback className="bg-brand-orange/10 text-brand-orange font-semibold">
                          {initialsOf(c.peer_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-medium">{c.peer_name || "User"}</p>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {new Date(c.last_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`truncate text-sm ${c.unread > 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                            {fromMe ? "You: " : ""}{c.last_content}
                          </p>
                          {c.unread > 0 && (
                            <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-brand-orange px-1.5 text-[10px] font-bold text-white">
                              {c.unread > 99 ? "99+" : c.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {!isAdmin ? (
            <div className="rounded-2xl border border-brand-orange/30 bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Need help?</h3>
                  <p className="text-xs text-muted-foreground">Our support team is here for you</p>
                </div>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                Questions about a memorial, a contribution or your account? Send us a message and we'll respond here.
              </p>
              <div className="mb-3 flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-brand-orange" /> Verified support</span>
                <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-brand-orange" /> Fast replies</span>
              </div>
              <Textarea
                value={supportMsg}
                onChange={(e) => setSupportMsg(e.target.value)}
                rows={4}
                placeholder="Describe your issue…"
                className="rounded-xl resize-none"
              />
              <Button
                onClick={sendSupport}
                disabled={!supportMsg.trim() || supportSending}
                className="mt-3 w-full rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90"
              >
                {supportSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Contact support
              </Button>
            </div>
          ) : (
            <>
              {/* Broadcast */}
              <div className="rounded-2xl border border-brand-orange/30 bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Broadcast message</h3>
                    <p className="text-xs text-muted-foreground">Message a whole role at once</p>
                  </div>
                </div>
                <Select value={broadcastTarget} onValueChange={setBroadcastTarget}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="memorial_admins">Memorial admins</SelectItem>
                    <SelectItem value="mourners">Mourners</SelectItem>
                    <SelectItem value="super_admins">Super admins</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  rows={4}
                  placeholder="Write your announcement…"
                  className="mt-2 rounded-xl resize-none"
                />
                <Button
                  onClick={sendBroadcast}
                  disabled={!broadcastMsg.trim() || broadcastSending}
                  className="mt-3 w-full rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90"
                >
                  {broadcastSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Megaphone className="mr-2 h-4 w-4" />}
                  Send broadcast
                </Button>
              </div>

              {/* Directory */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">All users</h3>
                    <p className="text-xs text-muted-foreground">Start a direct message</p>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search users…" className="pl-9 rounded-xl" />
                </div>
                <div className="mt-3 max-h-96 overflow-y-auto rounded-xl border border-border">
                  {dirLoading ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">Loading users…</p>
                  ) : groupedUsers.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">No users found.</p>
                  ) : (
                    groupedUsers.map(([group, users]) => (
                      <div key={group}>
                        <p className="sticky top-0 bg-muted/80 backdrop-blur px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {group} · {users.length}
                        </p>
                        {users.map((u) => (
                          <button
                            key={u.id}
                            onClick={() =>
                              setActive({
                                id: u.id,
                                name: u.full_name || u.email?.split("@")[0] || "User",
                                avatar_url: u.avatar_url,
                                subtitle: roleLabels[u.role] || "Mourner",
                              })
                            }
                            className="flex w-full items-center gap-3 border-t border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                          >
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={u.avatar_url || undefined} />
                              <AvatarFallback className="bg-brand-orange/10 text-brand-orange text-xs">
                                {initialsOf(u.full_name || u.email || "U")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{u.full_name || "Unnamed user"}</p>
                              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                            </div>
                            <MessageCircle className="h-4 w-4 shrink-0 text-brand-orange" />
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
