import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { BookHeart, Plus, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { NewMemorialDialog } from "@/components/dashboard/NewMemorialDialog";

const MyMemorials = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [memorials, setMemorials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) return;
    setLoading(true);
    supabase.from("memorials").select("*").eq("created_by", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setMemorials(data || []); setLoading(false); });
  };
  useEffect(() => { document.title = "My Memorials · Makiwa"; load(); }, [user]);

  return (
    <>
      <PageHeader
        title="My Memorials"
        subtitle="Memorials you've created and care for."
        action={
          <NewMemorialDialog
            onCreated={(m) => { load(); if (m?.id) navigate(`/dashboard/obituary?id=${m.id}`); }}
          />
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
      )

        : memorials.length === 0 ? (
          <EmptyState
            icon={BookHeart}
            title="No memorials yet"
            description="Create a beautiful, lasting tribute for someone you love."
            action={<NewMemorialDialog onCreated={(m) => { load(); if (m?.id) navigate(`/dashboard/obituary?id=${m.id}`); }} trigger={<Button className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90"><Plus className="h-4 w-4 mr-1" /> Create memorial</Button>} />}
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
                    {m.date_of_death && ` - ${format(new Date(m.date_of_death), "MMM d, yyyy")}`}
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
