const HOW_BG =
  "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=2000&q=80";

const steps = [
  { n: "01", title: "Create the memorial", desc: "Add their photo, story, and the people they loved. Free to start, ready in minutes." },
  { n: "02", title: "Invite the community", desc: "Share a private link or QR code so family and friends can gather, near or far." },
  { n: "03", title: "Honor & remember", desc: "Collect tributes, light candles, plan services, and keep their legacy alive - always." },
];

export const HowItWorks = () => {
  return (
    <section className="relative overflow-hidden border-b border-brand-white/10 bg-brand-black py-24 text-brand-white lg:py-32">
      <img
        src={HOW_BG}
        alt=""
        loading="lazy"
        className="pointer-events-none absolute right-0 top-0 h-full w-2/3 object-cover opacity-20 grayscale"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/95 to-brand-black/55" />
      <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-brand-white/10" />

      <div className="container-luxe relative">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-[0.3em] text-brand-orange font-semibold">How it works</span>
          <h2 className="mt-3 font-serif text-4xl lg:text-6xl font-medium leading-[1.05]">
            Three gentle steps to begin.
          </h2>
          <p className="mt-5 text-brand-white/70 text-lg max-w-xl leading-relaxed">
            We made it simple, because we know now isn't the time to wrestle with technology.
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((s, i) => (
            <div key={s.n} className="relative pt-8">
              <div className="font-serif text-7xl text-brand-orange/85 leading-none">{s.n}</div>
              <h3 className="mt-6 font-serif text-2xl font-medium">{s.title}</h3>
              <p className="mt-3 text-brand-white/70 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
