import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Heart,
  Users,
  ShieldCheck,
  Plus,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type MemorialItem = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  date_of_death: string | null;
  profile_photo_url: string | null;
  cover_photo_url: string | null;
};

const yearOf = (d: string | null) =>
  d ? new Date(d).getFullYear().toString() : "—";

const DotPattern = ({ className }: { className?: string }) => (
  <svg
    aria-hidden
    className={cn("text-brand-orange/30", className)}
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="currentColor"
  >
    {Array.from({ length: 8 }).map((_, r) =>
      Array.from({ length: 8 }).map((_, c) => (
        <circle key={`${r}-${c}`} cx={4 + c * 16} cy={4 + r * 16} r="2.2" />
      ))
    )}
  </svg>
);

export const Hero = () => {
  const [memorials, setMemorials] = useState<MemorialItem[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    supabase
      .from("memorials")
      .select("id,full_name,date_of_birth,date_of_death,profile_photo_url,cover_photo_url")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setMemorials((data as MemorialItem[]) || []));
  }, []);

  useEffect(() => {
    if (memorials.length < 2) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % memorials.length);
    }, 10000);
    return () => clearInterval(t);
  }, [memorials.length]);

  const current = memorials[index];

  return (
    <section
      id="home"
      className="relative flex min-h-[min(900px,100svh)] items-center overflow-hidden border-b border-brand-black/10 bg-cream pt-20"
    >
      {/* Dotted patterns */}
       <DotPattern className="absolute left-3 top-24 opacity-45 sm:left-10" />
       <DotPattern className="absolute bottom-8 right-3 opacity-35 sm:right-10" />
       <div aria-hidden className="absolute -right-28 top-24 h-72 w-72 rounded-full border border-brand-orange/15" />
       <div aria-hidden className="absolute -right-16 top-36 h-72 w-72 rounded-full border border-brand-black/10" />

      <div className="container-luxe relative z-10 w-full py-9 sm:py-14 lg:py-20">
        <div className="grid items-center gap-9 sm:gap-14 lg:grid-cols-12 lg:gap-8">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-6 lg:pr-8">
            <p className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase text-brand-orange sm:mb-6"><span className="h-px w-10 bg-brand-orange/60" />A place for every story</p>
            <h1 className="font-serif text-[2.65rem] font-medium leading-[0.94] text-brand-black sm:text-6xl lg:text-[5rem]">
              Honoring Lives.
              <br />
              Sharing Memories.
              <br />
              Keeping Love Alive.
            </h1>

             <p className="mt-5 max-w-lg text-base leading-7 text-brand-black/65 sm:mt-7 sm:text-lg">
              Makiwa is a compassionate online sanctuary where families and
              friends gather to celebrate lives, share stories, and preserve
              treasured memories for generations to come.
            </p>

            {/* CTA Buttons */}
            <div className="mt-6 flex flex-wrap gap-3 sm:mt-7 sm:gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-lg border border-brand-orange bg-brand-orange px-5 text-[15px] font-bold text-brand-white shadow-none hover:bg-brand-orange/90"
              >
                <Link to="/auth?tab=create-account">
                  <Plus className="h-5 w-5 stroke-[2.5]" />
                  Create a Memorial
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-lg border border-brand-black/20 bg-transparent px-5 text-[15px] font-bold text-brand-black hover:border-brand-orange hover:bg-brand-orange/5 hover:text-brand-orange"
              >
                <a href="#memorials">
                  <Clock className="h-5 w-5 stroke-[2.5]" />
                  Browse Memorials
                </a>
              </Button>
            </div>

            {/* Memorial Pillars */}
            <div className="mt-10 max-w-lg hidden sm:block">
              <div className="grid grid-cols-3 gap-8 border-t border-brand-black/10 pt-6">
                <div>
                  <Heart className="h-6 w-6 text-brand-orange mb-2" />
                  <h3 className="font-semibold text-brand-black">Honor</h3>
                  <p className="text-sm text-brand-black/60">With love</p>
                </div>
                <div>
                  <Users className="h-6 w-6 text-brand-orange mb-2" />
                  <h3 className="font-semibold text-brand-black">Share</h3>
                  <p className="text-sm text-brand-black/60">Memories</p>
                </div>
                <div>
                  <ShieldCheck className="h-6 w-6 text-brand-orange mb-2" />
                  <h3 className="font-semibold text-brand-black">Forever</h3>
                  <p className="text-sm text-brand-black/60">Remembered</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: circular memorial carousel */}
          <div className="relative flex flex-col items-center lg:col-span-6">
            <div aria-hidden className="absolute -left-4 top-10 hidden h-40 w-px bg-brand-orange/40 lg:block" />
            <div className="relative h-[235px] w-[235px] sm:h-[390px] sm:w-[390px] lg:h-[470px] lg:w-[470px]">
              <div className="absolute inset-0 overflow-hidden rounded-full border-[10px] border-card bg-brand-black shadow-elegant ring-1 ring-brand-black/10">
                {memorials.map((m, i) => {
                  const photo = m.profile_photo_url || m.cover_photo_url;
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "absolute inset-0 transition-opacity duration-1000",
                        i === index ? "opacity-100" : "opacity-0"
                      )}
                    >
                      {photo ? (
                        <img
                          src={photo}
                          alt={m.full_name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-orange to-brand-orange/70">
                          <span className="font-serif text-8xl text-white">
                            {m.full_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    </div>
                  );
                })}

                {/* Overlay text */}
                {current && (
                   <div className="absolute inset-x-0 bottom-0 p-5 text-center text-brand-white sm:p-10">
                    <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-brand-orange font-semibold">
                      Latest Memorial
                    </p>
                     <h3 className="mt-1 font-serif text-2xl leading-tight sm:mt-2 sm:text-4xl lg:text-5xl">
                      {current.full_name}
                    </h3>
                    <p className="mt-2 text-base sm:text-lg text-white/85">
                      {yearOf(current.date_of_birth)} –{" "}
                      {yearOf(current.date_of_death)}
                    </p>
                     <p className="mt-1.5 text-xs italic text-brand-white/90 sm:mt-3 sm:text-base">
                      Forever in our hearts.
                    </p>
                  </div>
                )}

                {!memorials.length && (
                  <div className="absolute inset-0 flex items-center justify-center text-white/80 text-center px-8">
                    <div>
                      <p className="font-serif text-3xl">Makiwa</p>
                      <p className="mt-2 text-sm text-white/70">
                        Memorials will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dots */}
            {memorials.length > 1 && (
                 <div className="mt-7 flex items-center gap-2" role="tablist" aria-label="Latest memorials">
                {memorials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    aria-label={`Show memorial ${i + 1}`}
                    className={cn(
                      "h-2.5 rounded-full transition-all",
                      i === index
                        ? "w-8 bg-brand-orange"
                        : "w-2.5 bg-brand-black/25 hover:bg-brand-black/50"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
