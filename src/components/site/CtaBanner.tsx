import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Flame } from "lucide-react";

const CTA_BG =
  "https://images.unsplash.com/photo-1509909756405-be0199881695?auto=format&fit=crop&w=2000&q=80";

export const CtaBanner = () => {
  return (
    <section className="py-24 lg:py-32 bg-brand-black text-brand-white relative overflow-hidden">
      <img
        src={CTA_BG}
        alt=""
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-black/85 via-brand-black/70 to-brand-black/95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,hsl(19_90%_54%/0.18),transparent_60%)]" />

      <div className="container-luxe relative text-center max-w-3xl">
        <Flame className="h-12 w-12 text-brand-orange candle-flicker mx-auto" fill="currentColor" />
        <h2 className="mt-6 font-serif text-4xl lg:text-6xl font-medium leading-tight text-balance">
          Light a candle. Tell their story. <span className="text-brand-orange italic">Keep them close.</span>
        </h2>
        <p className="mt-6 text-brand-white/75 text-lg">
          Create a beautiful, lasting memorial in just a few minutes — completely free to start.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="rounded-full h-14 px-8 bg-brand-orange text-brand-white hover:bg-brand-orange/90 shadow-glow">
            <Link to="/auth">Create a Memorial</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-8 bg-transparent border-brand-white/30 text-brand-white hover:bg-brand-white hover:text-brand-black">
            <a href="#contact">Talk to our team</a>
          </Button>
        </div>
      </div>
    </section>
  );
};
