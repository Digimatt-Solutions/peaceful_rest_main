import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({ user: null, session: null, loading: true, signOut: async () => {} });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastLoggedUser = useRef<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (event === "SIGNED_IN" && s?.user && lastLoggedUser.current !== s.user.id) {
        lastLoggedUser.current = s.user.id;
        setTimeout(() => logActivity("login", { description: `${s.user.email} signed in` }), 0);
      }
      if (event === "SIGNED_OUT") {
        lastLoggedUser.current = null;
      }
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) lastLoggedUser.current = s.user.id;
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const u = (await supabase.auth.getUser()).data.user;
    if (u) await logActivity("logout", { description: `${u.email} signed out` });
    // clear cached role
    try { Object.keys(localStorage).filter(k => k.startsWith("pr-role:")).forEach(k => localStorage.removeItem(k)); } catch {}
    await supabase.auth.signOut();
  };

  return <AuthContext.Provider value={{ user, session, loading, signOut }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
