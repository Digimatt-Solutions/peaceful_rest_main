import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Lets a signed-in visitor follow a memorial so they receive its updates.
 * Follows are per-user rows guarded by row-level security.
 */
export const FollowMemorialButton = ({ memorialId, className = "" }: { memorialId: string; className?: string }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (cancelled) return;
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      const { data } = await supabase.from("memorial_followers")
        .select("id").eq("memorial_id", memorialId).eq("user_id", user.id).maybeSingle();
      if (!cancelled) { setFollowing(!!data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [memorialId]);

  const toggle = async () => {
    if (!userId) return toast.error("Please sign in to follow this memorial");
    setBusy(true);
    if (following) {
      const { error } = await supabase.from("memorial_followers").delete()
        .eq("memorial_id", memorialId).eq("user_id", userId);
      setBusy(false);
      if (error) return toast.error("We couldn't update that. Please try again.");
      setFollowing(false);
      toast.success("You will no longer receive updates for this memorial");
    } else {
      const { error } = await supabase.from("memorial_followers").insert({ memorial_id: memorialId, user_id: userId });
      setBusy(false);
      if (error) return toast.error("We couldn't update that. Please try again.");
      setFollowing(true);
      toast.success("You are now following this memorial");
    }
  };

  if (loading) return null;

  return (
    <Button
      onClick={toggle}
      disabled={busy}
      className={`h-11 rounded-xl px-4 text-sm font-bold sm:h-12 ${
        following
          ? "border-2 border-brand-orange bg-transparent text-brand-orange hover:bg-brand-orange hover:text-white"
          : "border-2 border-brand-orange bg-brand-orange text-white hover:bg-brand-orange/90"
      } ${className}`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : following ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {following ? "Following" : "Follow updates"}
    </Button>
  );
};
