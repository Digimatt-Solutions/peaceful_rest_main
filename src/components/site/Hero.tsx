import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Sparkles, Flame } from "lucide-react";
import heroBg from "@/assets/hero-memorial.jpg";
import heroPortrait from "@/assets/hero-portrait.jpg";

export const Hero = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden pt-20"
    >
      {/* HD background */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroBg}
          alt="Peaceful candlelit memorial garden at twilight with white lilies and roses"
          width={1920}
          height={1280}
          fetchPriority="high"
          className="w-full h-full object-cover animate-slow-zoom"
        />
        {/* cinematic dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-black/95 via-brand-black/85 to-brand-black/65" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-black/40 via-transparent to-brand-black/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,hsl(19_90%_54%/0.18),transparent_55%)]" />
      </div>

      <div className="container-luxe relative z-10 py-16 lg:py-24 w-full">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* LEFT — content */}
          <div className="lg:col-span-7 text-brand-white text-left">
            <div className="animate-fade-up inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-brand-white/15 bg-brand-white/[0.05] backdrop-blur-md text-[11px] sm:text-xs tracking-[0.2em] uppercase">
              <Flame className="h-3.5 w-3.5 text-brand-orange candle-flicker" fill="currentColor" />
              <span className="font-medium">A Sanctuary for Remembrance</span>
            </div>

            <h1 className="animate-fade-up-delay-1 mt-6 font-serif font-medium leading-[1.05] tracking-tight text-balance text-4xl sm:text-5xl lg:text-6xl xl:text-7xl">
              Helping Families
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange via-[hsl(28_95%_64%)] to-brand-orange">
                Honor &amp; Remember
              </span>
            </h1>

            <p className="animate-fade-up-delay-2 mt-6 max-w-xl text-base sm:text-lg text-brand-white/75 leading-relaxed font-light">
              At PeacefulRest, we provide a compassionate online space where
              families and friends can honor their loved ones, share memories,
              and celebrate lives well lived. Our comprehensive obituary
              directory ensures that every life story is preserved with dignity
              and respect.
            </p>

            <div className="animate-fade-up-delay-3 mt-8 flex flex-wrap gap-3 sm:gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full h-13 sm:h-14 px-7 sm:px-8 text-base bg-brand-orange text-brand-white hover:bg-brand-orange/90 shadow-glow group"
              >
                <Link to="/auth">
                  <Plus className="mr-1 h-4 w-4" />
                  Send Obituary
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full h-13 sm:h-14 px-7 sm:px-8 text-base bg-brand-white/5 backdrop-blur-md border-brand-white/30 text-brand-white hover:bg-brand-white hover:text-brand-black"
              >
                <a href="#memorials">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Browse Memorials
                </a>
              </Button>
            </div>

            <div className="animate-fade-up-delay-3 mt-12 flex flex-wrap items-center gap-x-8 sm:gap-x-10 gap-y-5 text-brand-white/70">
              <div>
                <div className="font-serif text-2xl sm:text-3xl text-brand-white">12,400+</div>
                <div className="text-[10px] uppercase tracking-[0.25em] mt-1.5 text-brand-white/55">Lives Honored</div>
              </div>
              <div className="h-10 w-px bg-brand-white/20" />
              <div>
                <div className="font-serif text-2xl sm:text-3xl text-brand-white">86k</div>
                <div className="text-[10px] uppercase tracking-[0.25em] mt-1.5 text-brand-white/55">Tributes Shared</div>
              </div>
              <div className="hidden sm:block h-10 w-px bg-brand-white/20" />
              <div className="hidden sm:block">
                <div className="font-serif text-2xl sm:text-3xl text-brand-white">120+</div>
                <div className="text-[10px] uppercase tracking-[0.25em] mt-1.5 text-brand-white/55">Communities</div>
              </div>
            </div>
          </div>

          {/* RIGHT — portrait */}
          <div className="lg:col-span-5 relative animate-fade-up-delay-2">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* glow */}
              <div className="absolute -inset-6 bg-gradient-to-br from-brand-orange/30 via-transparent to-transparent blur-3xl rounded-full" />

              {/* portrait card */}
              <div className="relative rounded-[2rem] overflow-hidden shadow-elegant ring-1 ring-brand-white/15 aspect-[4/5] bg-brand-black/40">
                <img
                  src={heroPortrait}
                  alt="Loving tribute portrait of a remembered family member"
                  width={896}
                  height={1152}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black/85 via-brand-black/10 to-transparent" />

                {/* floating tribute badge */}
                <div className="absolute top-5 left-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-black/60 backdrop-blur-md border border-brand-white/15 text-[10px] uppercase tracking-[0.2em] text-brand-white/90">
                  <Flame className="h-3 w-3 text-brand-orange candle-flicker" fill="currentColor" />
                  In Loving Memory
                </div>

                {/* bottom caption */}
                <div className="absolute bottom-0 inset-x-0 p-6 text-brand-white">
                  <div className="font-serif text-2xl sm:text-3xl leading-tight">Margaret Anne</div>
                  <div className="text-xs text-brand-white/70 mt-1 tracking-wide">1948 — 2024 · Forever in our hearts</div>
                </div>
              </div>

              {/* decorative floating chip */}
              <div className="hidden md:flex absolute -bottom-5 -left-5 items-center gap-3 px-4 py-3 rounded-2xl bg-brand-black/70 backdrop-blur-xl border border-brand-white/10 shadow-elegant">
                <div className="h-9 w-9 rounded-full bg-brand-orange/15 flex items-center justify-center">
                  <Flame className="h-4 w-4 text-brand-orange" fill="currentColor" />
                </div>
                <div>
                  <div className="text-xs text-brand-white/60 uppercase tracking-widest">Candles lit</div>
                  <div className="font-serif text-lg text-brand-white leading-none mt-0.5">2,184</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-b from-transparent to-background pointer-events-none" />
    </section>
  );
};
