import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Sparkles, Flame, Quote, Star, ArrowRight } from "lucide-react";
import PORTRAIT_IMG from "@/assets/flowerr.png";
import HERO_BG from "@/assets/hero-memorial.jpg";

// const HERO_BG =
//   "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=2400&q=85";

const AVATARS = [
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1581382575275-97901c2635b7?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1539701938214-0d9736e1c16b?auto=format&fit=crop&w=120&q=80",
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
          src={HERO_BG}
          alt="African candlelight memorial"
          className="w-full h-full object-cover animate-slow-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-black/10 via-brand-black/25 to-brand-black/35" />
      </div>

      {/* Soft orange glow blob */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand-orange/5 blur-[120px] z-0" />

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
                <p className="text-brand-white/60 text-xs mt-0.5">from 10+ families worldwide</p>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-brand-white/10 grid grid-cols-3 gap-6 max-w-xl animate-fade-up-delay-3">
              <div>
                <div className="font-serif text-3xl text-brand-white">5+</div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-brand-white/55 mt-1">Lives Honored</div>
              </div>
              <div>
                <div className="font-serif text-3xl text-brand-white">300+</div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-brand-white/55 mt-1">Tributes Shared</div>
              </div>
              <div>
                <div className="font-serif text-3xl text-brand-white">10+</div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-brand-white/55 mt-1">Communities</div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-5 relative animate-fade-up-delay-1">


            {/* Floating quote card */}
            <div className="absolute -bottom-6 -left-6 lg:-left-10 max-w-[18rem] rounded-2xl bg-brand-black/5 backdrop-blur-xl p-5 border border-brand-orange/20 shadow-glow hidden sm:block">
              <Quote className="h-5 w-5 text-brand-orange" />
              <blockquote className="mt-2 font-serif text-base leading-snug text-brand-white italic">
                "Those we love don't go away - they walk beside us every day."
              </blockquote>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-b from-transparent to-brand-black pointer-events-none" />
    </section>
  );
};
