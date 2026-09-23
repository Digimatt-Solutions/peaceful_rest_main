import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookHeart, Plus, ArrowUpRight, Eye, EyeOff, Search } from "lucide-react";
import { format } from "date-fns";
import { NewMemorialDialog } from "@/components/dashboard/NewMemorialDialog";

const MyMemorials = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const isAdmin = role === "super_admin" || role === "memorial_admin";
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
      isAdmin ? q.eq("created_by", user.id) : q,
      supabase.from("memorial_followers").select("memorial_id").eq("user_id", user.id),
    ]);
    const followed = new Set((follows || []).map(f => f.memorial_id));
    setFollowing(followed);
    // Memorials the person follows come first so their saved list is easy to find.
    setMemorials((data || []).sort((a, b) => Number(followed.has(b.id)) - Number(followed.has(a.id))));
    setLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    document.title = isAdmin ? "My Memorials · Makiwa" : "Memorials · Makiwa";
    load();
  }, [load, isAdmin]);

  const visible = memorials.filter(m =>
    !query.trim() || m.full_name?.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <>
      <PageHeader
        title={isAdmin ? "My Memorials" : "Memorials"}
        subtitle={isAdmin ? "Memorials you've created and care for." : "Visit a memorial to leave a tribute or light a candle."}
        action={
          isAdmin ? (
            <NewMemorialDialog
              onCreated={(m) => { load(); if (m?.id) navigate(`/dashboard/obituary?id=${m.id}`); }}
            />
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((m) => (
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
                <p className="text-sm text-muted-foreground mt-1">
                  {m.date_of_birth && format(new Date(m.date_of_birth), "MMM d, yyyy")}
                  {m.date_of_death && ` - ${format(new Date(m.date_of_death), "MMM d, yyyy")}`}
                </p>
                <Link
                  to={isAdmin ? `/dashboard/obituary?id=${m.id}` : `/memorial/${m.id}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange"
                >
                  {isAdmin ? "Manage" : "View memorial"} <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
};

export default MyMemorials;
