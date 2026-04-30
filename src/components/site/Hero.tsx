import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Sparkles, Flame, Quote } from "lucide-react";
import heroCandles from "@/assets/hero-candles.jpg";

export const Hero = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden pt-20"
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroCandles}
          alt="Candlelight memorial"
          className="w-full h-full object-cover"
        />

        {/* Softer overlays (so image is visible) */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />
      </div>

      {/* Content */}
      <div className="container-luxe relative z-10 py-16 lg:py-24 w-full">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* LEFT */}
          <div className="lg:col-span-7 text-white text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-xs uppercase tracking-widest">
              <Flame className="h-3.5 w-3.5 text-orange-400" fill="currentColor" />
              <span>A Sanctuary for Remembrance</span>
            </div>

            <h1 className="mt-6 font-serif leading-tight text-4xl sm:text-5xl lg:text-6xl">
              Helping Families
              <br />
              <span className="text-orange-400">
                Honor & Remember
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-white/80">
              A compassionate online space where families and friends can honor
              loved ones, share memories, and celebrate lives well lived.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-full bg-orange-400 text-black hover:bg-orange-500">
                <Link to="/auth">
                  <Plus className="mr-2 h-4 w-4" />
                  Send Obituary
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/40 text-white hover:bg-white hover:text-black"
              >
                <a href="#memorials">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Browse Memorials
                </a>
              </Button>
            </div>

            <div className="mt-12 flex gap-10 text-white/70">
              <div>
                <div className="text-2xl">12,400+</div>
                <div className="text-xs uppercase">Lives Honored</div>
              </div>
              <div>
                <div className="text-2xl">86k</div>
                <div className="text-xs uppercase">Tributes Shared</div>
              </div>
              <div>
                <div className="text-2xl">120+</div>
                <div className="text-xs uppercase">Communities</div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-black/60 backdrop-blur-lg p-8 text-white shadow-lg">
              <Quote className="h-8 w-8 text-orange-400" />
              
              <blockquote className="mt-4 text-2xl leading-snug">
                “Those we love don't go away — they walk beside us every day.”
              </blockquote>

              <div className="mt-6 flex justify-between items-center">
                <div>
                  <div className="text-xs uppercase text-white/60">
                    Today's tributes
                  </div>
                  <div className="text-lg">2,184 candles lit</div>
                </div>

                <Button asChild size="sm" className="rounded-full bg-orange-400 text-black">
                  <Link to="/auth">
                    <Flame className="mr-1 h-4 w-4" />
                    Light one
                  </Link>
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-b from-transparent to-black pointer-events-none" />
    </section>
  );
};