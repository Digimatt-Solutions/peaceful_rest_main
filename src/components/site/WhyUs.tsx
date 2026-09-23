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
    <section id="about" className="paper-section relative overflow-hidden border-b border-brand-black/10 py-24 lg:py-32">
      {/* Editorial backdrop accents */}
       <div className="pointer-events-none absolute -right-28 top-16 h-80 w-80 rounded-full border border-brand-orange/15" />
       <div className="pointer-events-none absolute -right-16 top-28 h-80 w-80 rounded-full border border-brand-black/10" />

      <div className="container-luxe relative grid lg:grid-cols-12 gap-14 lg:gap-20 items-center">
        {/* Image collage */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-1 lg:grid-cols-6 lg:grid-rows-6 gap-4 lg:gap-5 h-[500px] lg:h-[640px]">

              {/* Main portrait - visible on all screens */}
              <div className="no-card group relative col-span-1 overflow-hidden rounded-lg border border-brand-black/10 shadow-elegant lg:col-span-4 lg:row-span-6">
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
                    <Quote className="h-3 w-3" />
                    Remembered
                  </span>

                  <p className="mt-2 font-serif text-lg lg:text-xl leading-snug max-w-[260px]">
                    “When we speak of them, they are near.”
                  </p>
                </div>
              </div>

              {/* Family embrace - hidden on small screens */}
              <div className="no-card hidden overflow-hidden rounded-lg border border-brand-black/10 shadow-soft lg:col-span-2 lg:row-span-3 lg:block">
                <img
                  src={familyImg}
                  alt="An African family embracing at golden hour"
                  loading="lazy"
                  width={768}
                  height={1024}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Stat card - hidden on small screens */}
              <div className="no-card hidden flex-col justify-between rounded-lg border border-brand-white/10 bg-brand-black p-5 text-brand-white shadow-elegant lg:col-span-2 lg:row-span-2 lg:flex lg:p-6">
                <span className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-semibold">
                  Impact
                </span>

                <div>
                  <div className="font-serif text-4xl lg:text-5xl text-brand-orange leading-none">
                    98%
                  </div>

                  <p className="mt-1.5 text-[11px] lg:text-xs text-brand-white/75 leading-relaxed">
                    of families say Makiwa helped them feel less alone.
                  </p>
                </div>
              </div>

              {/* Candle - hidden on small screens */}
              <div className="no-card hidden overflow-hidden rounded-lg border border-brand-black/10 shadow-soft lg:col-span-2 lg:row-span-1 lg:block">
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
            <span className="h-2 w-2 rounded-full  bg-brand-orange" /> Why Makiwa
          </span>
          <h2 className="mt-5 font-serif text-4xl lg:text-6xl font-medium leading-[1.03] tracking-tight">
            A thoughtful home <br className="hidden lg:block" />
            for the stories <em className="not-italic text-brand-orange">that matter most.</em>
          </h2>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-xl">
            Built for Kenyan families and communities, 
            Makiwa makes it easier to honour loved ones, bring people together, 
            and keep their memories alive, from the first announcement to the final farewell 
            and the years of remembrance that follow.

          </p>

          <div className="mt-10 grid sm:grid-cols-2 gap-x-8 gap-y-7">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="group flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand-black/15 bg-card transition-colors duration-500 group-hover:border-brand-orange/50">
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
