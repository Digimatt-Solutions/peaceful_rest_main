import { ShieldCheck, Globe2, Users, Sparkles, Quote } from "lucide-react";
import elderImg from "@/assets/why-sunset-reflection.jpg";
import familyImg from "@/assets/why-african-family.jpg";
import candleImg from "@/assets/why-african-candle.jpg";

const features = [
  { icon: ShieldCheck, title: "Private & secure", desc: "Bank-grade security with full control over who sees each memorial." },
  { icon: Globe2, title: "Global reach", desc: "Family scattered across continents can gather in one shared space." },
  { icon: Users, title: "Built for community", desc: "Moderation tools, role-based access, and gentle defaults." },
  { icon: Sparkles, title: "Beautifully designed", desc: "A respectful, ad-free experience that honors every life." },
];

export const WhyUs = () => {
  return (
    <section id="about" className="relative py-24 lg:py-32 bg-cream overflow-hidden">
      {/* Editorial backdrop accents */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-orange/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-32 h-96 w-96 rounded-full bg-brand-black/5 blur-3xl" />

      <div className="container-luxe relative grid lg:grid-cols-12 gap-14 lg:gap-20 items-center">
        {/* Image collage */}
        <div className="lg:col-span-6">
          <div className="grid grid-cols-6 grid-rows-6 gap-4 lg:gap-5 h-[560px] lg:h-[640px]">
            {/* Main portrait - spans tall */}
            <div className="col-span-4 row-span-6 relative rounded-[28px] overflow-hidden shadow-elegant group">
              <img
                src={elderImg}
                alt="A person gazing at a warm African sunset in quiet reflection"
                loading="lazy"
                width={896}
                height={1152}
                className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-7 text-brand-white">
                <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-brand-orange font-semibold">
                  <Quote className="h-3 w-3" /> Remembered
                </span>
                <p className="mt-2 font-serif text-lg lg:text-xl leading-snug max-w-[260px]">
                  “When we speak of them, they are near.”
                </p>
              </div>
            </div>

            {/* Family embrace - top right */}
            <div className="col-span-2 row-span-3 rounded-[24px] overflow-hidden shadow-soft">
              <img
                src={familyImg}
                alt="An African family embracing at golden hour"
                loading="lazy"
                width={768}
                height={1024}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Stat card - middle right */}
            <div className="col-span-2 row-span-2 rounded-[24px] bg-brand-black text-brand-white p-5 lg:p-6 shadow-elegant flex flex-col justify-between">
              <span className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-semibold">Impact</span>
              <div>
                <div className="font-serif text-4xl lg:text-5xl text-brand-orange leading-none">98%</div>
                <p className="mt-1.5 text-[11px] lg:text-xs text-brand-white/75 leading-relaxed">
                  of families say Makiwa helped them feel less alone.
                </p>
              </div>
            </div>

            {/* Candle - bottom right */}
            <div className="col-span-2 row-span-1 rounded-[20px] overflow-hidden shadow-soft">
              <img
                src={candleImg}
                alt="A hand holding a lit memorial candle at dusk"
                loading="lazy"
                width={768}
                height={768}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Copy */}
        <div className="lg:col-span-6">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-brand-orange font-semibold">
            <span className="h-px w-8 bg-brand-orange" /> Why Makiwa
          </span>
          <h2 className="mt-5 font-serif text-4xl lg:text-6xl font-medium leading-[1.03] tracking-tight">
            A thoughtful home <br className="hidden lg:block" />
            for the stories <em className="not-italic text-brand-orange">that matter most.</em>
          </h2>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-xl">
            Built with bereavement counselors, funeral directors, and grieving
            families across Africa and beyond - every feature has a purpose: to
            make remembering easier, and grief a little less lonely.
          </p>

          <div className="mt-10 grid sm:grid-cols-2 gap-x-8 gap-y-7">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="group flex gap-4">
                  <div className="shrink-0 h-12 w-12 rounded-2xl bg-brand-black flex items-center justify-center group-hover:bg-brand-orange transition-colors duration-500">
                    <Icon className="h-5 w-5 text-brand-orange group-hover:text-brand-white transition-colors duration-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
