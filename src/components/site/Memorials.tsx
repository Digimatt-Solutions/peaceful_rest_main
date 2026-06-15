import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, MapPin, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Memorial = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  date_of_death: string | null;
  location: string | null;
  short_tribute: string | null;
  cover_photo_url: string | null;
  profile_photo_url: string | null;
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
};

export const Memorials = () => {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("memorials")
      .select("id,full_name,date_of_birth,date_of_death,location,short_tribute,cover_photo_url,profile_photo_url")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        setMemorials((data as Memorial[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <section id="memorials" className="py-20 sm:py-24 lg:py-32 bg-cream">
      <div className="container-luxe">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-12 lg:mb-14">
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-[0.25em] text-brand-orange font-semibold">In Loving Memory</span>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight">
              Recently shared memorials
            </h2>
            <p className="mt-4 text-muted-foreground text-base sm:text-lg">
              Visit a memorial to leave a candle, share a story, or send condolences to the family.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full h-12 px-6 border-foreground/20 hover:bg-foreground hover:text-background">
            <Link to="/auth">
              View All Memorials
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl bg-card overflow-hidden shadow-soft">
                <div className="aspect-[4/5] bg-muted animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : memorials.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-10 sm:p-16 text-center shadow-soft">
            <div className="h-16 w-16 mx-auto rounded-full bg-brand-orange/10 flex items-center justify-center mb-5">
              <Flame className="h-7 w-7 text-brand-orange candle-flicker" />
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl">A space ready to be filled with memory</h3>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Be among the first to create a memorial on Makiwa. Honor a life, gather loved ones, and keep their story alive.
            </p>
            <Button asChild className="mt-7 rounded-full h-12 px-7 bg-brand-orange text-brand-white hover:bg-brand-orange/90 shadow-glow">
              <Link to="/auth">Create the first memorial</Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
            {memorials.map((m, i) => {
              const photo = m.cover_photo_url || m.profile_photo_url;
              return (
                <article
                  key={m.id}
                  className="group relative bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-500 hover:-translate-y-1"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    {photo ? (
                      <img
                        src={photo}
                        alt={`Portrait of ${m.full_name}`}
                        loading="lazy"
                        className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-foreground/90 to-foreground">
                        <span className="font-serif text-6xl text-brand-white/80">{m.full_name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    {m.location && (
                      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-brand-white/90 backdrop-blur text-xs font-medium tracking-wide flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-brand-orange" />
                        {m.location}
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 p-6 text-brand-white">
                      <h3 className="font-serif text-2xl font-semibold leading-tight">{m.full_name}</h3>
                      <p className="text-sm text-brand-white/80 mt-1 tracking-wide">
                        {formatDate(m.date_of_birth)} — {formatDate(m.date_of_death)}
                      </p>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-foreground/80 italic leading-relaxed line-clamp-3">
                      "{m.short_tribute || "A life remembered with love."}"
                    </p>
                    <Link
                      to={`/memorial/${m.id}`}
                      className="mt-5 inline-flex items-center border-2 border-brand-white rounded-lg p-2 gap-2 text-sm font-semibold text-white bg-brand-orange hover:gap-3 transition-all"
                    >
                      View Memorial
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
