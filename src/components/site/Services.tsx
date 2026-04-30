import { Building2, Flower2, Camera, Car, Tent, Printer, HeartPulse, Shield, UtensilsCrossed, ArrowUpRight } from "lucide-react";

const FEATURE_IMG =
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1600&q=80";

const services = [
  { icon: Building2, name: "Funeral Homes", desc: "Vetted partners offering dignified ceremonies." },
  { icon: Flower2, name: "Floral Tributes", desc: "Wreaths, bouquets, and arrangements delivered." },
  { icon: UtensilsCrossed, name: "Catering", desc: "Receptions and post-service gatherings." },
  { icon: Tent, name: "Tents & Chairs", desc: "Outdoor service setup and rentals." },
  { icon: Car, name: "Transport", desc: "Hearse, family cars, and group buses." },
  { icon: Printer, name: "Printing", desc: "Programs, banners, and obituary booklets." },
  { icon: Camera, name: "Photographers", desc: "Professional service photography & video." },
  { icon: HeartPulse, name: "Counselors", desc: "Bereavement support for families." },
  { icon: Shield, name: "Insurance Partners", desc: "Funeral cover and family protection plans." },
];

export const Services = () => {
  return (
    <section id="services" className="py-24 lg:py-32 bg-background">
      <div className="container-luxe">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-end mb-14 lg:mb-20">
          <div className="lg:col-span-7">
            <span className="text-xs uppercase tracking-[0.3em] text-brand-orange font-semibold">Trusted Services</span>
            <h2 className="mt-4 font-serif text-4xl lg:text-6xl font-medium leading-[1.05] tracking-tight">
              Everything families<br className="hidden sm:block" /> need, in one place.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-muted-foreground text-lg leading-relaxed">
              From the first call to the final ceremony — connect with verified
              professionals who understand what truly matters during difficult
              moments.
            </p>
          </div>
        </div>

        {/* Editorial showcase row */}
        <div className="grid lg:grid-cols-12 gap-6 mb-6">
          <div className="lg:col-span-7 relative rounded-[2rem] overflow-hidden aspect-[16/10] lg:aspect-auto lg:h-[440px] group">
            <img
              src={FEATURE_IMG}
              alt="Soft white florals on a memorial table"
              className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-black/90 via-brand-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-10 text-brand-white">
              <span className="text-[10px] uppercase tracking-[0.3em] text-brand-orange">Featured</span>
              <h3 className="mt-3 font-serif text-3xl lg:text-4xl font-medium max-w-md leading-tight">
                Floral arrangements as gentle as the goodbye.
              </h3>
              <a href="#" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold tracking-wide hover:gap-3 transition-all">
                Browse florists <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 grid sm:grid-cols-2 lg:grid-cols-1 gap-6">
            {services.slice(0, 2).map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.name} className="rounded-[2rem] border border-border bg-card p-7 lg:p-8 hover:border-brand-orange/40 hover:shadow-elegant transition-all duration-500 lg:flex-1 flex flex-col justify-between min-h-[210px]">
                  <div className="h-12 w-12 rounded-xl bg-brand-black flex items-center justify-center">
                    <Icon className="h-5 w-5 text-brand-white" />
                  </div>
                  <div className="mt-6">
                    <h3 className="font-serif text-2xl font-medium">{s.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.slice(2).map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.name}
                className="group relative p-7 rounded-2xl border border-border bg-card hover:border-brand-orange/40 hover:shadow-elegant transition-all duration-500"
              >
                <div className="h-11 w-11 rounded-xl bg-brand-black flex items-center justify-center group-hover:bg-brand-orange transition-colors duration-500">
                  <Icon className="h-5 w-5 text-brand-white" />
                </div>
                <h3 className="mt-5 font-serif text-lg font-semibold">{s.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
