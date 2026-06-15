import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "Makiwa gave my mother's life the tribute it deserved. Family from three continents lit candles together — it felt like we were all in the same room.",
    name: "Amara Johnson",
    role: "Daughter",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
  },
  {
    quote:
      "As a funeral director, I recommend Makiwa to every family. It's the most respectful and well-built platform I've ever used.",
    name: "Rev. James Carter",
    role: "Funeral Director",
    avatar:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80",
  },
  {
    quote:
      "The fundraising tools helped us cover unexpected costs without ever feeling awkward asking. Beautifully done, beautifully done.",
    name: "Lerato Khumalo",
    role: "Family Coordinator",
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80",
  },
];

export const Testimonials = () => {
  return (
    <section
      id="community"
      className="relative py-24 lg:py-32 bg-cream overflow-hidden"
    >
      {/* Subtle backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(19_95%_62%/0.08),transparent_55%)] pointer-events-none" />
      <div className="absolute -top-32 -left-20 h-80 w-80 rounded-full bg-brand-orange/10 blur-[120px] pointer-events-none" />

      <div className="container-luxe relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.3em] text-brand-orange font-semibold">
            Voices of comfort
          </span>
          <h2 className="mt-4 font-serif text-4xl lg:text-6xl font-medium leading-[1.05] tracking-tight">
            Words from the families <span className="italic text-brand-orange/90">we serve</span>
          </h2>
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-0.5 text-brand-orange">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4" fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <span className="font-semibold text-foreground">4.9 out of 5</span>
            <span className="text-muted-foreground/70">· 2,800+ reviews</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t, i) => (
            <figure
              key={t.name}
              className={`group relative p-8 lg:p-10 rounded-3xl border border-border bg-card hover:shadow-elegant hover:-translate-y-1 transition-all duration-500 ${
                i === 1 ? "md:mt-0 lg:mt-10" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <Quote className="h-9 w-9 text-brand-orange/40" />
                <div className="flex items-center gap-0.5 text-brand-orange">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
              </div>
              <blockquote className="font-serif text-xl lg:text-[1.4rem] leading-snug text-foreground/90">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-8 pt-6 border-t border-border flex items-center gap-4">
                <img
                  src={t.avatar}
                  alt={t.name}
                  loading="lazy"
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-orange/20"
                />
                <div>
                  <div className="font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                    {t.role}
                  </div>
                </div>
              </figcaption>
              {/* Hover accent line */}
              <div className="absolute bottom-0 left-1/2 h-0.5 w-0 bg-gradient-to-r from-brand-orange/0 via-brand-orange to-brand-orange/0 group-hover:w-full group-hover:left-0 transition-all duration-700" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
