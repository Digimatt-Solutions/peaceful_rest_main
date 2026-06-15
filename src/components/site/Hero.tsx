import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Sparkles, Flame, Quote, Star, ShieldCheck, ArrowRight } from "lucide-react";
import heroCandles from "@/assets/hero-candles.jpg";
import PORTRAIT_IMG from "@/assets/flowerr.png";


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
        <div className="absolute inset-0 bg-gradient-to-b from-brand-black/25 via-brand-black/30 to-brand-black/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,hsl(19_95%_62%/0.12),transparent_60%)]" />
      </div>

      {/* Soft orange glow blob */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand-orange/20 blur-[120px] z-0" />

      {/* Content */}
      <div className="container-luxe relative z-10 py-20 lg:py-28 w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* LEFT */}
          <div className="lg:col-span-7 text-brand-white text-left animate-fade-up">

            <h1 className="mt-7 font-serif font-medium leading-[1.02] text-5xl sm:text-6xl lg:text-7xl tracking-tight text-balance">
              Helping families
              <br />
              <span className="italic text-brand-orange">honor & remember</span>
              <br />
              the lives they love.
            </h1>

            <p className="mt-7 max-w-xl text-lg text-brand-white/75 leading-relaxed font-light">
              A compassionate online sanctuary where families and friends gather to
              celebrate lives well lived - share memories, light candles, and keep
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
            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/5] shadow-elegant ">
              <img
                src={PORTRAIT_IMG}
                alt="A loved one remembered"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black/5 via-brand-black/20 to-transparent" />
            </div>

            {/* Floating quote card */}
            <div className="absolute -bottom-6 -left-6 lg:-left-10 max-w-[18rem] rounded-2xl bg-brand-black/85 backdrop-blur-xl p-5 border border-brand-orange/20 shadow-glow hidden sm:block">
              <Quote className="h-5 w-5 text-brand-orange" />
              <blockquote className="mt-2 font-serif text-base leading-snug text-brand-white italic">
                "Those we love don't go away - they walk beside us every day."
              </blockquote>
            </div>

            {/* Floating candle stat */}
            <div className="absolute -top-4 -right-4 lg:-right-6 rounded-2xl bg-brand-white/95 backdrop-blur p-4 shadow-elegant hidden sm:flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-orange/15 flex items-center justify-center">
                <Flame className="h-5 w-5 text-brand-orange candle-flicker" fill="currentColor" />
              </div>
              <div>
                <div className="text-xs text-foreground/60 font-medium">Today</div>
                <div className="text-sm font-semibold text-foreground">candles lit</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-b from-transparent to-brand-black pointer-events-none" />
    </section>
  );
};
