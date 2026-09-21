import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

type Follower = { id: string; user_id: string; created_at: string; name: string; avatar_url: string | null };

/** Shows the people following this memorial. Only its admins can read these rows. */
export const MemorialFollowers = ({ memorialId }: { memorialId: string }) => {
  const [rows, setRows] = useState<Follower[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("memorial_followers")
        .select("id, user_id, created_at").eq("memorial_id", memorialId).order("created_at", { ascending: false });
      const ids = (data || []).map((r) => r.user_id);
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", ids)
        : { data: [] as any[] };
      const map = new Map((profs || []).map((p: any) => [p.id, p]));
      if (cancelled) return;
      setRows((data || []).map((r) => {
        const p: any = map.get(r.user_id);
        return {
          id: r.id, user_id: r.user_id, created_at: r.created_at,
          name: p?.full_name || p?.email?.split("@")[0] || "Follower",
          avatar_url: p?.avatar_url || null,
        };
      }));
    })();
    return () => { cancelled = true; };
  }, [memorialId]);

  return (
    <section className="rounded-2xl border border-border bg-card p-7 space-y-4">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-orange/15 text-brand-orange">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-serif text-xl">Followers</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            People who chose to receive updates about this memorial.
          </p>
        </div>
      </div>

      {rows === null ? (
        <div className="h-10 animate-pulse rounded-xl bg-muted" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No one is following this memorial yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={f.avatar_url || undefined} />
                <AvatarFallback className="bg-brand-orange/10 text-xs text-brand-orange">
                  {f.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="text-xs text-muted-foreground">Following since {new Date(f.created_at).toLocaleDateString()}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
