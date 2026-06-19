import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "super_admin" | "memorial_admin" | "mourner" | "admin" | "user";

const cacheKey = (uid: string) => `pr-role:${uid}`;

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const cached = user ? (typeof window !== "undefined" ? localStorage.getItem(cacheKey(user.id)) : null) : null;
  const [role, setRole] = useState<AppRole | null>(cached as AppRole | null);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setRole(null); setLoading(false); return; }

    // hydrate from cache immediately
    const c = localStorage.getItem(cacheKey(user.id));
    if (c) { setRole(c as AppRole); setLoading(false); }

    let cancelled = false;
    supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const r = (data?.role as AppRole) || "mourner";
        setRole(r);
        setLoading(false);
        try { localStorage.setItem(cacheKey(user.id), r); } catch {}
      });
    return () => { cancelled = true; };
  }, [user, authLoading]);

  return {
    role,
    loading,
    isSuperAdmin: role === "super_admin" || role === "admin",
    isMemorialAdmin: role === "memorial_admin",
    isMourner: role === "mourner" || role === "user",
  };
};
