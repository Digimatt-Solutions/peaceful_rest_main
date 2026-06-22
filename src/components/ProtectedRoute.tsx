import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Flame } from "lucide-react";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  // Hold the first paint until BOTH auth and role are resolved.
  // This prevents any flicker of the wrong role's UI during login/refresh.
  if (loading || (user && roleLoading) || (user && !role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Flame className="h-8 w-8 text-brand-orange candle-flicker" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Preparing your space…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};
