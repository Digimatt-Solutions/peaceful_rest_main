import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Follow / unfollow a memorial. Signed-out visitors are sent to sign in and
 * brought back with ?follow=1 so the follow completes on return.
 */
export const FollowMemorialButton = ({ memorialId, className = "" }: { memorialId: string; className?: string }) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refreshCount = async () => {
    const { data } = await supabase.rpc("memorial_follower_count", { _memorial_id: memorialId });
    if (typeof data === "number") setCount(data);
  };

  const follow = async (uid: string) => {
    const { error } = await supabase.from("memorial_followers").insert({ memorial_id: memorialId, user_id: uid });
    // 23505 = already following (duplicate prevented by the unique constraint)
    if (error && error.code !== "23505") { toast.error("We couldn't update that. Please try again."); return false; }
    setFollowing(true);
    toast.success("You are now following this memorial");
    return true;
  };

  useEffect(() => {
    let cancelled = false;
    refreshCount();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (cancelled) return;
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      const { data } = await supabase.from("memorial_followers")
        .select("id").eq("memorial_id", memorialId).eq("user_id", user.id).maybeSingle();
      if (cancelled) return;
      setFollowing(!!data);
      setLoading(false);
      const params = new URLSearchParams(window.location.search);
      if (params.get("follow") === "1") {
        params.delete("follow");
        window.history.replaceState({}, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
        if (!data && (await follow(user.id))) refreshCount();
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memorialId]);

  const toggle = async () => {
    if (!userId) {
      toast("Please sign in to follow this memorial");
      navigate(`/auth?redirect=${encodeURIComponent(`/memorial/${memorialId}?follow=1`)}`);
      return;
    }
    setBusy(true);
    if (following) {
      const { error } = await supabase.from("memorial_followers").delete()
        .eq("memorial_id", memorialId).eq("user_id", userId);
      if (error) toast.error("We couldn't update that. Please try again.");
      else { setFollowing(false); toast.success("You will no longer receive updates for this memorial"); }
    } else {
      await follow(userId);
    }
    await refreshCount();
    setBusy(false);
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
      {count !== null && count > 0 && <span className="ml-1 rounded-full bg-white/20 px-2 text-xs">{count}</span>}
    </Button>
  );
};
