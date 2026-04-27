import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Sparkles, Flame } from "lucide-react";
import heroBg from "@/assets/hero-memorial.jpg";

export const Hero = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16"
    >
      {/* Cinematic background */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroBg}
          alt="Peaceful candlelit memorial garden at twilight with white lilies and roses"
          width={1920}
          height={1280}
          fetchPriority="high"
          className="w-full h-full object-cover animate-slow-zoom"
        />
        {/* Layered cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-black/85 via-brand-black/70 to-brand-black/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(0_0%_0%/0.55)_70%,hsl(0_0%_0%/0.95)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,hsl(19_90%_54%/0.18),transparent_60%)]" />
      </div>

      {/* Subtle grain / vignette */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05] mix-blend-overlay [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')]" />

      <div className="container-luxe relative z-10 w-full">
        <div className="mx-auto max-w-4xl text-center text-brand-white flex flex-col items-center">
          {/* Eyebrow */}
          <div className="animate-fade-up inline-flex items-center gap-3 px-5 py-2 rounded-full border border-brand-white/15 bg-brand-white/[0.04] backdrop-blur-md text-[11px] sm:text-xs tracking-[0.3em] uppercase">
            <Flame className="h-3.5 w-3.5 text-brand-orange candle-flicker" fill="currentColor" />
            <span className="font-medium text-brand-white/85">A Sanctuary for Remembrance</span>
            <span className="h-1 w-1 rounded-full bg-brand-orange/80" />
            <span className="text-brand-white/60">Est. 2024</span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up-delay-1 mt-8 font-serif font-light leading-[1.02] tracking-tight text-balance text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
            Every Life Deserves
            <br />
            <span className="italic font-medium text-transparent bg-clip-text bg-gradient-to-r from-[hsl(28_95%_70%)] via-brand-orange to-[hsl(28_95%_70%)]">
              an Eternal Story
            </span>
          </h1>

          {/* Ornamental divider */}
          <div className="animate-fade-up-delay-2 mt-8 flex items-center gap-4 text-brand-orange/80">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-brand-orange/60" />
            <Flame className="h-3.5 w-3.5 candle-flicker" fill="currentColor" />
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-brand-orange/60" />
          </div>

          {/* Subhead */}
          <p className="animate-fade-up-delay-2 mt-8 max-w-2xl text-base sm:text-lg text-brand-white/70 leading-relaxed font-light">
            A compassionate online sanctuary where families gather to honor loved ones,
            share cherished memories, and preserve legacies with the dignity and grace
            they so deeply deserve.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up-delay-3 mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full h-14 px-8 text-base bg-brand-orange text-brand-white hover:bg-brand-orange/90 shadow-glow transition-transform hover:-translate-y-0.5"
            >
              <Link to="/auth">
                <Plus className="mr-1 h-4 w-4" />
                Create a Memorial
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full h-14 px-8 text-base bg-brand-white/[0.04] backdrop-blur-md border-brand-white/25 text-brand-white hover:bg-brand-white hover:text-brand-black transition-transform hover:-translate-y-0.5"
            >
              <a href="#memorials">
                <Sparkles className="mr-2 h-4 w-4" />
                Browse Memorials
              </a>
            </Button>
          </div>

          {/* Stats — refined editorial row */}
          <div className="animate-fade-up-delay-3 mt-16 w-full max-w-3xl">
            <div className="grid grid-cols-3 divide-x divide-brand-white/10 border-y border-brand-white/10 py-6">
              <div className="px-4">
                <div className="font-serif text-3xl sm:text-4xl text-brand-white">12,400+</div>
                <div className="text-[10px] uppercase tracking-[0.3em] mt-2 text-brand-white/55">Lives Honored</div>
              </div>
              <div className="px-4">
                <div className="font-serif text-3xl sm:text-4xl text-brand-white">86k</div>
                <div className="text-[10px] uppercase tracking-[0.3em] mt-2 text-brand-white/55">Tributes Shared</div>
              </div>
              <div className="px-4">
                <div className="font-serif text-3xl sm:text-4xl text-brand-white">
                  2,184
                  <span className="ml-1 text-brand-orange text-base align-middle">✦</span>
                </div>
                <div className="text-[10px] uppercase tracking-[0.3em] mt-2 text-brand-white/55">Candles Lit Today</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade into page */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-b from-transparent to-background pointer-events-none" />

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-brand-white/50 animate-fade-up-delay-3">
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <div className="h-10 w-px bg-gradient-to-b from-brand-white/40 to-transparent" />
      </div>
    </section>
  );
};
