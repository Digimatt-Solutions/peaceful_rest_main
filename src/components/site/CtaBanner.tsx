import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Flame, ArrowRight, ShieldCheck } from "lucide-react";

const CTA_BG =
  "https://images.unsplash.com/photo-1509909756405-be0199881695?auto=format&fit=crop&w=2400&q=85";

export const CtaBanner = () => {
  return (
    <section className="relative py-28 lg:py-40 bg-brand-black text-brand-white overflow-hidden">
      <img
        src={CTA_BG}
        alt=""
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      {/* Layered overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-black via-brand-black/80 to-brand-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,hsl(19_95%_62%/0.30),transparent_55%)]" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[26rem] w-[26rem] rounded-full bg-brand-orange/20 blur-[120px]" />

      <div className="container-luxe relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-orange/30 bg-brand-orange/10 backdrop-blur-md text-[11px] uppercase tracking-[0.25em] text-brand-orange mb-8">
            <Flame className="h-3.5 w-3.5 candle-flicker" fill="currentColor" />
            Begin Today — Free Forever Plan
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-medium leading-[1.02] tracking-tight text-balance">
            Light a candle. Tell their story.
            <br />
            <span className="italic text-brand-orange">Keep them close.</span>
          </h2>

          <p className="mt-7 text-brand-white/75 text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto font-light">
            Create a beautiful, lasting memorial in just a few minutes —
            no credit card, no ads, no pressure. Just space to remember.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full h-14 px-8 bg-brand-orange text-brand-white hover:bg-brand-orange/90 shadow-glow font-medium text-base group"
            >
              <Link to="/auth">
                Create a Memorial
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full h-14 px-8 bg-brand-white/5 backdrop-blur-md border-brand-white/25 text-brand-white hover:bg-brand-white hover:text-brand-black font-medium text-base"
            >
              <a href="#contact">Talk to our team</a>
            </Button>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-brand-white/55">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-orange" />
              <span className="uppercase tracking-[0.2em]">GDPR & SOC 2</span>
            </div>
            <span className="h-1 w-1 rounded-full bg-brand-white/30" />
            <span className="uppercase tracking-[0.2em]">No credit card</span>
            <span className="h-1 w-1 rounded-full bg-brand-white/30" />
            <span className="uppercase tracking-[0.2em]">Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
};
