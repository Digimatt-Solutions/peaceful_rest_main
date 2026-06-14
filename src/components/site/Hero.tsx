import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Sparkles, Flame, Quote, Star, ShieldCheck, ArrowRight } from "lucide-react";
import heroCandles from "@/assets/hero-candles.jpg";

const PORTRAIT_IMG =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85";

const AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
];

export const Hero = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden pt-24 bg-brand-black"
    >
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroCandles}
          alt="Candlelight memorial"
          className="w-full h-full object-cover animate-slow-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-black/85 via-brand-black/60 to-brand-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,hsl(19_95%_62%/0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,hsl(19_95%_62%/0.12),transparent_60%)]" />
      </div>

      {/* Soft orange glow blob */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand-orange/20 blur-[120px] z-0" />

      {/* Content */}
      <div className="container-luxe relative z-10 py-20 lg:py-28 w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* LEFT */}
          <div className="lg:col-span-7 text-brand-white text-left animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-orange/30 bg-brand-orange/10 backdrop-blur-md text-[11px] uppercase tracking-[0.25em] text-brand-orange">
              <Flame className="h-3.5 w-3.5" fill="currentColor" />
              <span>A Sanctuary for Remembrance</span>
            </div>

            <h1 className="mt-7 font-serif font-medium leading-[1.02] text-5xl sm:text-6xl lg:text-7xl tracking-tight text-balance">
              Helping families
              <br />
              <span className="italic text-brand-orange">honor & remember</span>
              <br />
              the lives they love.
            </h1>

            <p className="mt-7 max-w-xl text-lg text-brand-white/75 leading-relaxed font-light">
              A compassionate online sanctuary where families and friends gather to
              celebrate lives well lived — share memories, light candles, and keep
              their stories alive, forever.
            </p>

            <div className="mt-10 flex flex-wrap gap-4 animate-fade-up-delay-1">
              <Button asChild size="lg" className="rounded-full h-14 px-7 bg-brand-orange text-brand-white hover:bg-brand-orange/90 shadow-glow font-medium text-base group">
                <Link to="/auth">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create a Memorial
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full h-14 px-7 border-brand-white/25 bg-brand-white/5 backdrop-blur-md text-brand-white hover:bg-brand-white hover:text-brand-black font-medium text-base"
              >
                <a href="#memorials">
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Browse Memorials
                </a>
              </Button>
            </div>

            {/* Trust strip */}
            <div className="mt-12 flex flex-wrap items-center gap-6 animate-fade-up-delay-2">
              <div className="flex -space-x-3">
                {AVATARS.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    loading="lazy"
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-brand-black"
                  />
                ))}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1 text-brand-orange">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                  ))}
                  <span className="ml-2 text-brand-white font-semibold">4.9/5</span>
                </div>
                <p className="text-brand-white/60 text-xs mt-0.5">from 12,400+ families worldwide</p>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-brand-white/10 grid grid-cols-3 gap-6 max-w-xl animate-fade-up-delay-3">
              <div>
                <div className="font-serif text-3xl text-brand-white">12.4k+</div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-brand-white/55 mt-1">Lives Honored</div>
              </div>
              <div>
                <div className="font-serif text-3xl text-brand-white">86k</div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-brand-white/55 mt-1">Tributes Shared</div>
              </div>
              <div>
                <div className="font-serif text-3xl text-brand-white">120+</div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-brand-white/55 mt-1">Communities</div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-5 relative animate-fade-up-delay-1">
            {/* Portrait card */}
            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/5] shadow-elegant ring-1 ring-brand-white/10">
              <img
                src={PORTRAIT_IMG}
                alt="A loved one remembered"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/30 to-transparent" />

              {/* Memorial caption */}
              <div className="absolute top-5 left-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-black/60 backdrop-blur-md border border-brand-white/15 text-[10px] uppercase tracking-[0.2em] text-brand-white/85">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-orange animate-pulse" />
                Live memorial
              </div>

              <div className="absolute bottom-0 inset-x-0 p-6 text-brand-white">
                <div className="text-[10px] uppercase tracking-[0.25em] text-brand-orange">In loving memory</div>
                <div className="mt-1.5 font-serif text-2xl font-medium">Margaret Eleanor Hayes</div>
                <div className="text-sm text-brand-white/70 mt-0.5">1942 — 2024 · Chicago, IL</div>
              </div>
            </div>

            {/* Floating quote card */}
            <div className="absolute -bottom-6 -left-6 lg:-left-10 max-w-[18rem] rounded-2xl bg-brand-black/85 backdrop-blur-xl p-5 border border-brand-orange/20 shadow-glow hidden sm:block">
              <Quote className="h-5 w-5 text-brand-orange" />
              <blockquote className="mt-2 font-serif text-base leading-snug text-brand-white italic">
                "Those we love don't go away — they walk beside us every day."
              </blockquote>
            </div>

            {/* Floating candle stat */}
            <div className="absolute -top-4 -right-4 lg:-right-6 rounded-2xl bg-brand-white/95 backdrop-blur p-4 shadow-elegant hidden sm:flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-orange/15 flex items-center justify-center">
                <Flame className="h-5 w-5 text-brand-orange candle-flicker" fill="currentColor" />
              </div>
              <div>
                <div className="text-xs text-foreground/60 font-medium">Today</div>
                <div className="text-sm font-semibold text-foreground">2,184 candles lit</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom badges row */}
        <div className="mt-20 lg:mt-28 pt-8 border-t border-brand-white/10 flex flex-wrap items-center justify-between gap-6 text-brand-white/55">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em]">
            <ShieldCheck className="h-4 w-4 text-brand-orange" />
            Trusted by funeral directors worldwide
          </div>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-3 font-serif text-lg text-brand-white/45 tracking-wide">
            <span>Forbes</span>
            <span>NY Times</span>
            <span>The Guardian</span>
            <span>Wired</span>
            <span>Vogue</span>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-b from-transparent to-brand-black pointer-events-none" />
    </section>
  );
};
