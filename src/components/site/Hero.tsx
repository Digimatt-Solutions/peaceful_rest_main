import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Sparkles, Quote, ArrowRight } from "lucide-react";
import FLORAL_IMG from "@/assets/floral.png";
import HERO_BG from "@/assets/hero-memorial.jpg";

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
        <div className="absolute inset-0 bg-gradient-to-b from-brand-black/5 via-brand-black/20 to-brand-black/15" />
      </div>

      {/* Orange glow */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand-orange/5 blur-[120px] z-0" />

      <div className="container-luxe relative z-10 py-20 lg:py-28 w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* LEFT CONTENT */}
          <div className="lg:col-span-7 text-brand-white text-left animate-fade-up">
            <h1 className="mt-7 font-serif font-medium leading-[1.02] text-5xl sm:text-6xl lg:text-7xl tracking-tight text-balance">
              Helping families
              <br />
              <span className="italic text-brand-orange">
                honor & remember
              </span>
              <br />
              the lives they love.
            </h1>

            <p className="mt-7 max-w-xl text-lg text-brand-white/85 leading-relaxed font-light">
              A compassionate online sanctuary where families and friends gather
              to celebrate lives well lived - share memories, light candles,
              and keep their stories alive, forever.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full h-14 px-7 bg-brand-orange text-brand-white hover:bg-brand-orange/90 shadow-glow font-medium text-base group"
              >
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

            <div className="mt-10 pt-8 border-t border-brand-white/40 grid grid-cols-3 gap-6 max-w-xl">
              <div>
                <div className="font-serif text-3xl text-brand-white">5+</div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-brand-white/55 mt-1">
                  Lives Honored
                </div>
              </div>

              <div>
                <div className="font-serif text-3xl text-brand-white">
                  300+
                </div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-brand-white/55 mt-1">
                  Tributes Shared
                </div>
              </div>

              <div>
                <div className="font-serif text-3xl text-brand-white">10+</div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-brand-white/55 mt-1">
                  Communities
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-end">

            {/* Circular Floral Image */}
            <div className="relative">
              {/* Soft glow behind image */}
              <div className="absolute inset-0 rounded-full bg-brand-orange/20 blur-3xl scale-110" />

              <img
                src={FLORAL_IMG}
                alt="Memorial candle and flowers"
                className="relative z-10 w-[320px] sm:w-[380px] lg:w-[430px] h-auto object-contain drop-shadow-[0_20px_60px_rgba(255,107,43,0.25)]"
              />
            </div>

            {/* Quote Card Below */}
            <div className="max-w-sm rounded-3xl bg-brand-black/15 backdrop-blur-xl border border-brand-orange/20 p-6 shadow-[0_0_40px_rgba(255,107,43,0.12)]">
              <Quote className="h-6 w-6 text-brand-orange mb-3" />

              <blockquote className="font-serif text-xl leading-relaxed italic text-brand-white">
                "Those we love don't go away - they walk beside us every day."
              </blockquote>

              {/* <div className="mt-4 h-px w-16 bg-brand-orange/40" />

              <p className="mt-3 text-sm text-brand-white/60">
                Honoring memories. Preserving legacies. Connecting generations.
              </p> */}
            </div>

          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-b from-transparent to-brand-black pointer-events-none" />
    </section>
  );
};