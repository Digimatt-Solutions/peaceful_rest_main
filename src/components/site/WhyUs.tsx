import { ShieldCheck, Globe2, Users, Sparkles } from "lucide-react";
import community from "@/assets/community.jpg";

const features = [
  { icon: ShieldCheck, title: "Private & secure", desc: "Bank-grade security with full control over who sees each memorial." },
  { icon: Globe2, title: "Global reach", desc: "Family scattered across continents can gather in one shared space." },
  { icon: Users, title: "Built for community", desc: "Moderation tools, role-based access, and gentle defaults." },
  { icon: Sparkles, title: "Beautifully designed", desc: "A respectful, ad-free experience that honors every life." },
];

export const WhyUs = () => {
  return (
    <section id="about" className="py-24 lg:py-32 bg-cream">
      <div className="container-luxe grid lg:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <img
            src={community}
            alt="Hands held together in support"
            loading="lazy"
            className="rounded-3xl shadow-elegant aspect-[4/5] object-cover w-full"
          />
          <div className="absolute -bottom-8 -right-4 lg:-right-8 bg-brand-white p-6 rounded-2xl shadow-elegant max-w-xs">
            <div className="font-serif text-3xl text-brand-orange">98%</div>
            <p className="text-sm text-muted-foreground mt-1">of families say Peaceful Rest helped them feel less alone.</p>
          </div>
        </div>

        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-brand-orange font-semibold">Why Peaceful Rest</span>
          <h2 className="mt-3 font-serif text-4xl lg:text-5xl font-medium leading-tight">
            A thoughtful home for the stories that matter most.
          </h2>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
            We built Peaceful Rest with bereavement counselors, funeral directors, and grieving
            families. Every feature has a purpose: to make remembering easier, and grief a little
            less lonely.
          </p>

          <div className="mt-10 grid sm:grid-cols-2 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex gap-4">
                  <div className="shrink-0 h-11 w-11 rounded-xl bg-brand-black flex items-center justify-center">
                    <Icon className="h-5 w-5 text-brand-orange" />
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
