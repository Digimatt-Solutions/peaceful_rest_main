import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { BookHeart, Plus, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

const MyMemorials = () => {
  const { user } = useAuth();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "My Memorials · Peaceful Rest";
    if (!user) return;
    supabase.from("memorials").select("*").eq("created_by", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setMemorials(data || []); setLoading(false); });
  }, [user]);

  return (
    <>
      <PageHeader
        title="My Memorials"
        subtitle="Memorials you've created and care for."
        action={
          <Button asChild className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
            <Link to="/dashboard/obituary"><Plus className="h-4 w-4 mr-1" /> New Memorial</Link>
          </Button>
        }
      />
      {loading ? <p className="text-muted-foreground">Loading…</p>
        : memorials.length === 0 ? (
          <EmptyState
            icon={BookHeart}
            title="No memorials yet"
            description="Create a beautiful, lasting tribute for someone you love."
            action={<Button asChild className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90"><Link to="/dashboard/obituary">Create memorial</Link></Button>}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {memorials.map((m) => (
              <article key={m.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-elegant transition-shadow">
                <div className="aspect-[5/4] bg-cream relative">
                  {m.profile_photo_url ? (
                    <img src={m.profile_photo_url} alt={m.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><BookHeart className="h-10 w-10 text-brand-orange/40" /></div>
                  )}
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-white/95 backdrop-blur">
                    {m.is_public ? <><Eye className="h-3 w-3" /> Public</> : <><EyeOff className="h-3 w-3" /> Private</>}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-xl">{m.full_name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {m.date_of_birth && format(new Date(m.date_of_birth), "MMM d, yyyy")}
                    {m.date_of_death && ` — ${format(new Date(m.date_of_death), "MMM d, yyyy")}`}
                  </p>
                  <Link to={`/dashboard/obituary?id=${m.id}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange">
                    Manage <ArrowUpRight className="h-4 w-4" />
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
