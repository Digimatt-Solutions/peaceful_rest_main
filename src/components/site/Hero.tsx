import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Sparkles, Quote, ArrowRight } from "lucide-react";
import FLORAL_IMG from "@/assets/floral.png";

export const Hero = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden pt-24 bg-white"
    >
      {/* Subtle orange wash */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand-orange/10 blur-[120px] z-0" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[26rem] w-[26rem] rounded-full bg-brand-orange/5 blur-[120px] z-0" />

      <div className="container-luxe relative z-10 py-20 lg:py-28 w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* LEFT CONTENT */}
          <div className="lg:col-span-7 text-slate-900 text-left animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/5 px-3 py-1 text-xs font-medium text-brand-orange tracking-wide uppercase">
              <Sparkles className="h-3 w-3" /> Honor. Remember. Connect.
            </span>

            <h1 className="mt-6 font-sans font-semibold leading-[1.05] text-4xl sm:text-5xl lg:text-6xl tracking-tight text-slate-900">
              Helping families
              <br />
              <span className="text-brand-orange font-medium">honor & remember</span>
              <br />
              the lives they love.
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-600 leading-relaxed font-light">
              A compassionate online sanctuary where families and friends gather
              to celebrate lives well lived - share memories, light candles,
              and keep their stories alive, forever.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full h-13 px-6 bg-brand-orange text-white hover:bg-brand-orange/90 shadow-glow font-medium text-base group"
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
                className="rounded-full h-13 px-6 border-slate-300 bg-white text-slate-900 hover:bg-slate-50 font-medium text-base"
              >
                <a href="#memorials">
                  Browse Memorials
                </a>
              </Button>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-end gap-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-brand-orange/15 blur-3xl scale-110" />
              <img
                src={FLORAL_IMG}
                alt="Memorial candle and flowers"
                className="relative z-10 w-[300px] sm:w-[360px] lg:w-[420px] h-auto object-contain drop-shadow-[0_20px_50px_rgba(255,107,43,0.2)]"
              />
            </div>

            <div className="max-w-sm rounded-3xl bg-white border border-brand-orange/20 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
              <Quote className="h-6 w-6 text-brand-orange mb-3" />
              <blockquote className="font-serif text-lg leading-relaxed italic text-slate-800">
                "Those we love don't go away - they walk beside us every day."
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
