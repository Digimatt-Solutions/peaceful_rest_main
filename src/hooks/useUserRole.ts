import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "super_admin" | "memorial_admin" | "mourner" | "admin" | "user";

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setRole(null); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setRole((data?.role as AppRole) || "mourner");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [user]);

  return {
    role,
    loading,
    isSuperAdmin: role === "super_admin" || role === "admin",
    isMemorialAdmin: role === "memorial_admin",
    isMourner: role === "mourner" || role === "user",
  };
};
