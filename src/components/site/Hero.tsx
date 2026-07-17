import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  HeartHandshake,
  Heart,
  Users,
  ShieldCheck,
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
    }, 30000);
    return () => clearInterval(t);
  }, [memorials.length]);

  const current = memorials[index];

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden pt-24 bg-white"
    >
      {/* Dotted patterns – top-left & bottom-left */}
      <DotPattern className="absolute top-24 left-4 sm:left-10 opacity-80" />
      <DotPattern className="absolute bottom-10 left-4 sm:left-10 opacity-80" />

      <div className="container-luxe relative z-10 w-full py-16 lg:py-24">
        <div className="grid lg:grid-cols-12 items-center gap-12">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-6">
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-brand-black font-medium leading-[0.98] tracking-tight">
              Honoring Lives.
              <br />
              Sharing Memories.
              <br />
              Keeping Love Alive.
            </h1>

            <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-brand-black/70">
              Makiwa is a compassionate online sanctuary where families and
              friends gather to celebrate lives, share stories, and preserve
              treasured memories for generations to come.
            </p>

            {/* CTA Buttons */}
            <div className="mt-7 flex flex-wrap gap-3 sm:gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 px-5 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white border-2 border-brand-orange font-semibold shadow-lg"
              >
                <Link to="/auth">
                  <HeartHandshake className="mr-2 h-5 w-5" />
                  Create a Memorial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-5 rounded-xl border-2 border-brand-black bg-white text-brand-black font-semibold hover:bg-brand-black hover:text-white"
              >
                <a href="#memorials">
                  <Users className="mr-2 h-5 w-5" />
                  Browse Memorials
                </a>
              </Button>
            </div>

            {/* Memorial Pillars */}
            <div className="mt-10 max-w-lg hidden sm:block">
              <div className="flex items-start gap-16 border-t border-brand-black/10 pt-6">
                <div>
                  <Heart className="h-6 w-6 text-brand-orange mb-2" />
                  <h3 className="font-semibold text-brand-black">Honor</h3>
                  <p className="text-sm text-brand-black/60">with love</p>
                </div>
                <div>
                  <Users className="h-6 w-6 text-brand-orange mb-2" />
                  <h3 className="font-semibold text-brand-black">Share</h3>
                  <p className="text-sm text-brand-black/60">memories</p>
                </div>
                <div>
                  <ShieldCheck className="h-6 w-6 text-brand-orange mb-2" />
                  <h3 className="font-semibold text-brand-black">Forever</h3>
                  <p className="text-sm text-brand-black/60">remembered</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: circular memorial carousel */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="relative w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] lg:w-[520px] lg:h-[520px]">
              <div className="absolute inset-0 rounded-full ring-8 ring-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] overflow-hidden bg-brand-black">
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
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 text-center text-white">
                    <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-brand-orange font-semibold">
                      Latest Memorial
                    </p>
                    <h3 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight">
                      {current.full_name}
                    </h3>
                    <p className="mt-2 text-base sm:text-lg text-white/85">
                      {yearOf(current.date_of_birth)} –{" "}
                      {yearOf(current.date_of_death)}
                    </p>
                    <p className="mt-3 italic text-sm sm:text-base text-white/90">
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
              <div className="mt-6 flex items-center gap-2">
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
