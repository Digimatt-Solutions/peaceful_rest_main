import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Peaceful Rest gave my mother's life the tribute it deserved. Family from three continents lit candles together — it felt like we were all in the same room.",
    name: "Amara Johnson",
    role: "Daughter",
  },
  {
    quote: "As a funeral director, I recommend Peaceful Rest to every family. It's the most respectful platform I've ever used.",
    name: "Rev. James Carter",
    role: "Funeral Director",
  },
  {
    quote: "The fundraising tools helped us cover unexpected costs without ever feeling awkward asking. Beautifully done.",
    name: "Lerato Khumalo",
    role: "Family Coordinator",
  },
];

export const Testimonials = () => {
  return (
    <section id="community" className="py-24 lg:py-32 bg-background">
      <div className="container-luxe">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase tracking-[0.25em] text-brand-orange font-semibold">Voices of comfort</span>
          <h2 className="mt-3 font-serif text-4xl lg:text-5xl font-medium leading-tight">
            Words from the families we serve
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="relative p-8 rounded-2xl border border-border bg-card hover:shadow-elegant transition-shadow duration-500"
            >
              <Quote className="h-8 w-8 text-brand-orange/30 mb-4" />
              <blockquote className="font-serif text-xl leading-snug text-foreground/90">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 pt-6 border-t border-border">
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
