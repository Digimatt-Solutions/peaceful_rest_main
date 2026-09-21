import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Flame, Loader2 } from "lucide-react";
import { toast } from "sonner";

const DAY = 24 * 60 * 60 * 1000;

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading, signOut } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [deletedAt, setDeletedAt] = useState<string | null | undefined>(undefined);
  const [restoring, setRestoring] = useState(false);

  // An account in its 30-day restoration window cannot use the app until restored.
  useEffect(() => {
    if (!user) { setDeletedAt(undefined); return; }
    supabase.from("profiles").select("deleted_at").eq("id", user.id).maybeSingle()
      .then(({ data }) => setDeletedAt((data as any)?.deleted_at ?? null));
    // Clears out accounts whose restoration window has passed.
    supabase.rpc("purge_expired_deleted_accounts" as any).then(() => {});
  }, [user]);

  const restore = async () => {
    if (!user) return;
    setRestoring(true);
    const { error } = await supabase.from("profiles").update({ deleted_at: null } as any).eq("id", user.id);
    setRestoring(false);
    if (error) return toast.error("We couldn't restore your account. Please try again.");
    setDeletedAt(null);
    toast.success("Welcome back — your account has been restored");
  };

  // Hold the first paint until BOTH auth and role are resolved.
  // This prevents any flicker of the wrong role's UI during login/refresh.
  if (loading || (user && roleLoading) || (user && !role) || (user && deletedAt === undefined)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Flame className="h-8 w-8 text-brand-orange candle-flicker" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Preparing your space…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  if (deletedAt) {
    const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - new Date(deletedAt).getTime()) / DAY));
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="font-serif text-2xl">Your account is scheduled for deletion</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            You asked us to delete this account on {new Date(deletedAt).toLocaleDateString()}. You have{" "}
            <span className="font-medium text-foreground">{daysLeft} day{daysLeft === 1 ? "" : "s"}</span> left to bring
            it back. After that your personal details are permanently removed.
          </p>
          <Button onClick={restore} disabled={restoring}
            className="mt-6 w-full rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
            {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : "Restore my account"}
          </Button>
          <button onClick={() => signOut()} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
