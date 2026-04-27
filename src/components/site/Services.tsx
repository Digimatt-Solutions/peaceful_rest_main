import { Building2, Flower2, Camera, Car, Tent, Printer, HeartPulse, Shield, UtensilsCrossed } from "lucide-react";

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
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.25em] text-brand-orange font-semibold">Trusted Services</span>
          <h2 className="mt-3 font-serif text-4xl lg:text-5xl font-medium leading-tight">
            Everything families need, in one place
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            From the first call to the final ceremony — connect with verified professionals
            who understand what matters during difficult moments.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.name}
                className="group relative p-7 rounded-2xl border border-border bg-card hover:border-brand-orange/40 hover:shadow-elegant transition-all duration-500"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-warm opacity-0 group-hover:opacity-[0.04] transition-opacity" />
                <div className="relative">
                  <div className="h-12 w-12 rounded-xl bg-brand-black flex items-center justify-center group-hover:bg-brand-orange transition-colors duration-500">
                    <Icon className="h-5 w-5 text-brand-white" />
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-semibold">{s.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
