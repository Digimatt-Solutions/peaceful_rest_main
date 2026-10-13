import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookHeart, Plus, ArrowUpRight, Eye, EyeOff, Search, BellRing } from "lucide-react";
import { format } from "date-fns";
import { NewMemorialDialog } from "@/components/dashboard/NewMemorialDialog";

const MyMemorials = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const isAdmin = role === "super_admin" || role === "memorial_admin";
  const isSuper = role === "super_admin" || role === "admin";
  const [owners, setOwners] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Admins care for their own memorials; everyone else can browse all published ones.
    const q = supabase.from("memorials").select("*").order("created_at", { ascending: false });
    const [{ data }, { data: follows }] = await Promise.all([
      // Super admins see every memorial (their own plus other memorial admins').
      isAdmin && !isSuper ? q.eq("created_by", user.id) : q,
      supabase.from("memorial_followers").select("memorial_id").eq("user_id", user.id),
    ]);
    const followed = new Set((follows || []).map(f => f.memorial_id));
    setFollowing(followed);
    // Memorials the person follows come first so their saved list is easy to find.
    setMemorials((data || []).sort((a, b) => Number(followed.has(b.id)) - Number(followed.has(a.id))));
    if (isSuper) {
      const ids = [...new Set((data || []).map((m: any) => m.created_by).filter((o: string) => o !== user.id))];
      if (ids.length) {
        const { data: ps } = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
        setOwners(Object.fromEntries((ps || []).map((p: any) => [p.id, p.full_name || p.email || "Memorial admin"])));
      }
    }
    setLoading(false);
  }, [user, isAdmin, isSuper]);

  useEffect(() => {
    document.title = isAdmin ? "My Memorials · Makiwa" : "Memorials · Makiwa";
    load();
  }, [load, isAdmin]);

  const visible = memorials.filter(m =>
    !query.trim() || m.full_name?.toLowerCase().includes(query.trim().toLowerCase())
  );
  const mine = isSuper ? visible.filter(m => m.created_by === user?.id) : visible;
  const others = isSuper ? visible.filter(m => m.created_by !== user?.id) : [];

  const renderGrid = (list: any[]) => (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((m) => (
            <article key={m.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-elegant transition-shadow">
              <div className="aspect-[5/4] bg-cream relative">
                {m.profile_photo_url ? (
                  <img src={m.profile_photo_url} alt={m.full_name} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><BookHeart className="h-10 w-10 text-brand-orange/40" /></div>
                )}
                {isAdmin ? (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-white/95 backdrop-blur">
                    {m.is_public ? <><Eye className="h-3 w-3" /> Public</> : <><EyeOff className="h-3 w-3" /> Private</>}
                  </span>
                ) : following.has(m.id) ? (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-orange text-brand-white">
                    <BellRing className="h-3 w-3" /> Following
                  </span>
                ) : null}
              </div>
              <div className="p-5">
                <h3 className="font-serif text-xl">{m.full_name}</h3>
                {isSuper && m.created_by !== user?.id && (
                  <p className="text-xs text-muted-foreground mt-1">Managed by {owners[m.created_by] || "a memorial admin"}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  {m.date_of_birth && format(new Date(m.date_of_birth), "MMM d, yyyy")}
                  {m.date_of_death && ` - ${format(new Date(m.date_of_death), "MMM d, yyyy")}`}
                </p>
                <Link
                  to={isAdmin ? `/dashboard/obituary?id=${m.id}` : `/memorial/${m.id}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange"
                >
                  {isAdmin ? (isSuper && m.created_by !== user?.id ? "Edit details" : "Manage") : "View memorial"} <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
  );

  return (
    <>
      <PageHeader
        title={isAdmin ? "My Memorials" : "Memorials"}
        subtitle={isSuper ? "Your memorials, and every memorial created by other memorial admins." : isAdmin ? "Memorials you've created and care for." : "Visit a memorial to leave a tribute or light a candle."}
        action={
          isAdmin ? (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {isSuper && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search memorials…" className="pl-9 rounded-xl" />
              </div>
            )}
            <NewMemorialDialog
              onCreated={(m) => { load(); if (m?.id) navigate(`/dashboard/obituary?id=${m.id}`); }}
            />
            </div>
          ) : (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search memorials…" className="pl-9 rounded-xl" />
            </div>
          )
        }
      />
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border overflow-hidden">
              <div className="aspect-[5/4] bg-muted animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-muted/70 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        isAdmin ? (
          <EmptyState
            icon={BookHeart}
            title="No memorials yet"
            description="Create a beautiful, lasting tribute for someone you love."
            action={<NewMemorialDialog onCreated={(m) => { load(); if (m?.id) navigate(`/dashboard/obituary?id=${m.id}`); }} trigger={<Button className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90"><Plus className="h-4 w-4 mr-1" /> Create memorial</Button>} />}
          />
        ) : (
          <EmptyState icon={BookHeart} title="No memorials found" description="Try a different name, or check back soon." />
        )
      ) : (
        isSuper ? (
          <div className="space-y-10">
            <section>
              <h2 className="font-serif text-2xl mb-4">My memorials</h2>
              {mine.length === 0 ? <p className="text-sm text-muted-foreground">You haven't created any memorials yet.</p> : renderGrid(mine)}
            </section>
            <section>
              <h2 className="font-serif text-2xl mb-1">All memorials</h2>
              <p className="text-sm text-muted-foreground mb-4">Memorials created by other memorial admins. You can edit them and add more details.</p>
              {others.length === 0 ? <p className="text-sm text-muted-foreground">No memorials from other admins yet.</p> : renderGrid(others)}
            </section>
          </div>
        ) : renderGrid(visible)
      )}
    </>
  );
};

export default MyMemorials;
