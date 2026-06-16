import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame, Heart, HeartHandshake, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type ActionType = "candle" | "condolence" | "donation" | "rsvp";

interface Participation {
  id: string;
  user_id: string;
  action_type: ActionType;
  display_name: string;
  avatar_url: string | null;
  message: string | null;
  amount: number | null;
  created_at: string;
}

const actionMeta: Record<ActionType, { icon: any; label: string; verb: string; color: string }> = {
  candle: { icon: Flame, label: "Light a candle", verb: "lit a candle", color: "text-brand-orange" },
  condolence: { icon: Heart, label: "Send condolence", verb: "sent condolences", color: "text-rose-500" },
  donation: { icon: HeartHandshake, label: "Pledge support", verb: "pledged support", color: "text-emerald-500" },
  rsvp: { icon: Calendar, label: "RSVP", verb: "is attending", color: "text-sky-500" },
};

interface Props {
  announcementId: string;
  /** restrict actions, e.g. only candle + condolence on regular announcement, or include rsvp on event */
  actions?: ActionType[];
}

export const ParticipationPanel = ({ announcementId, actions = ["candle", "condolence", "donation"] }: Props) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Participation[]>([]);
  const [busy, setBusy] = useState<ActionType | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    supabase
      .from("announcement_participations")
      .select("*")
      .eq("announcement_id", announcementId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data as Participation[]) || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`ap-${announcementId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "announcement_participations", filter: `announcement_id=eq.${announcementId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcementId]);

  const myParticipations = new Set(items.filter(i => i.user_id === user?.id).map(i => i.action_type));

  const join = async (action: ActionType) => {
    if (!user) {
      toast.error("Please sign in to take part");
      return;
    }
    if (myParticipations.has(action)) {
      // toggle off
      setBusy(action);
      const { error } = await supabase.from("announcement_participations").delete().eq("announcement_id", announcementId).eq("user_id", user.id).eq("action_type", action);
      setBusy(null);
      if (error) return toast.error(error.message);
      return;
    }

    let amount: number | null = null;
    let message: string | null = null;
    if (action === "donation") {
      const v = window.prompt("Enter pledge amount (USD)");
      if (!v) return;
      amount = parseFloat(v);
      if (!amount || amount <= 0) return toast.error("Invalid amount");
    }
    if (action === "condolence") {
      message = window.prompt("Share a brief message of condolence") || null;
      if (!message) return;
    }

    setBusy(action);
    const { data: profile } = await supabase.from("profiles").select("full_name,avatar_url,email").eq("id", user.id).maybeSingle();
    const display_name = profile?.full_name || profile?.email?.split("@")[0] || "Anonymous";
    const { error } = await supabase.from("announcement_participations").insert({
      announcement_id: announcementId,
      user_id: user.id,
      action_type: action,
      display_name,
      avatar_url: profile?.avatar_url || null,
      message,
      amount,
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Thank you for taking part");
  };

  const counts = actions.reduce((acc, a) => {
    acc[a] = items.filter(i => i.action_type === a).length;
    return acc;
  }, {} as Record<ActionType, number>);

  return (
    <div className="mt-5 pt-5 border-t border-border space-y-5">
      {/* action buttons */}
      <div className="flex flex-wrap gap-2">
        {actions.map(a => {
          const Meta = actionMeta[a];
          const Icon = Meta.icon;
          const active = myParticipations.has(a);
          return (
            <Button
              key={a}
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => join(a)}
              disabled={busy === a}
              className={`rounded-full h-9 ${active ? "bg-brand-orange text-brand-white hover:bg-brand-orange/90" : ""}`}
            >
              {busy === a ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Icon className={`h-3.5 w-3.5 mr-1.5 ${active ? "" : Meta.color}`} fill={a === "candle" && active ? "currentColor" : "none"} />}
              {Meta.label}
              <span className="ml-2 text-xs opacity-70">{counts[a] || 0}</span>
            </Button>
          );
        })}
      </div>

      {/* avatar list */}
      {!loading && items.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {items.slice(0, 8).map(p => (
              <Avatar key={p.id} className="h-8 w-8 ring-2 ring-card">
                {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.display_name} />}
                <AvatarFallback className="text-xs bg-brand-orange/15 text-brand-orange">
                  {p.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "person has" : "people have"} taken part
          </span>
        </div>
      )}

      {/* recent activity feed */}
      {items.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Recent activity</div>
          <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {items.slice(0, 6).map(p => {
              const Meta = actionMeta[p.action_type];
              const Icon = Meta.icon;
              return (
                <li key={p.id} className="flex items-start gap-2.5 text-sm">
                  <Icon className={`h-3.5 w-3.5 mt-1 shrink-0 ${Meta.color}`} fill={p.action_type === "candle" ? "currentColor" : "none"} />
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground/90">
                      <span className="font-medium">{p.display_name}</span>
                      <span className="text-muted-foreground"> {Meta.verb}</span>
                      {p.amount && <span className="text-emerald-600 font-semibold"> · KSh {p.amount.toFixed(0)}</span>}
                      <span className="text-muted-foreground"> · {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                    </div>
                    {p.message && <div className="text-xs text-muted-foreground italic mt-0.5 line-clamp-2">"{p.message}"</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
