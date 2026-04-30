import { ShieldCheck, Globe2, Users, Sparkles } from "lucide-react";

const COMMUNITY_IMG =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=85";
const SECONDARY_IMG =
  "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?auto=format&fit=crop&w=900&q=85";

const features = [
  { icon: ShieldCheck, title: "Private & secure", desc: "Bank-grade security with full control over who sees each memorial." },
  { icon: Globe2, title: "Global reach", desc: "Family scattered across continents can gather in one shared space." },
  { icon: Users, title: "Built for community", desc: "Moderation tools, role-based access, and gentle defaults." },
  { icon: Sparkles, title: "Beautifully designed", desc: "A respectful, ad-free experience that honors every life." },
];

export const WhyUs = () => {
  return (
    <section id="about" className="py-24 lg:py-32 bg-cream">
      <div className="container-luxe grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        <div className="lg:col-span-6 relative">
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-3">
              <img
                src={COMMUNITY_IMG}
                alt="Hands held together in support"
                loading="lazy"
                className="rounded-3xl shadow-elegant aspect-[4/5] object-cover w-full"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-4 pt-12">
              <img
                src={SECONDARY_IMG}
                alt="A peaceful candle moment"
                loading="lazy"
                className="rounded-3xl shadow-soft aspect-[3/4] object-cover w-full"
              />
              <div className="rounded-3xl bg-brand-black text-brand-white p-5 lg:p-6 shadow-elegant">
                <div className="font-serif text-3xl lg:text-4xl text-brand-orange leading-none">98%</div>
                <p className="mt-2 text-xs lg:text-sm text-brand-white/75 leading-relaxed">
                  of families say Peaceful Rest helped them feel less alone.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <span className="text-xs uppercase tracking-[0.3em] text-brand-orange font-semibold">Why Peaceful Rest</span>
          <h2 className="mt-4 font-serif text-4xl lg:text-6xl font-medium leading-[1.05] tracking-tight">
            A thoughtful home for the stories that matter most.
          </h2>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
            We built Peaceful Rest with bereavement counselors, funeral directors, and grieving
            families. Every feature has a purpose: to make remembering easier, and grief a
            little less lonely.
          </p>

          <div className="mt-10 grid sm:grid-cols-2 gap-7">
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
