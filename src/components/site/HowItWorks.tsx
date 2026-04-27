import candle from "@/assets/candle.jpg";

const steps = [
  { n: "01", title: "Create the memorial", desc: "Add their photo, story, and the people they loved. Free to start, ready in minutes." },
  { n: "02", title: "Invite the community", desc: "Share a private link or QR code so family and friends can gather, near or far." },
  { n: "03", title: "Honor & remember", desc: "Collect tributes, light candles, plan services, and keep their legacy alive — always." },
];

export const HowItWorks = () => {
  return (
    <section className="py-24 lg:py-32 bg-brand-black text-brand-white relative overflow-hidden">
      <img
        src={candle}
        alt=""
        loading="lazy"
        className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-30 mix-blend-screen pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/95 to-transparent" />

      <div className="container-luxe relative">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-[0.25em] text-brand-orange font-semibold">How it works</span>
          <h2 className="mt-3 font-serif text-4xl lg:text-5xl font-medium leading-tight">
            Three gentle steps to begin
          </h2>
          <p className="mt-4 text-brand-white/70 text-lg">
            We made it simple, because we know now isn't the time to wrestle with technology.
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.n} className="relative">
              <div className="font-serif text-7xl text-brand-orange/80 leading-none">{s.n}</div>
              <h3 className="mt-6 font-serif text-2xl font-medium">{s.title}</h3>
              <p className="mt-3 text-brand-white/70 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
