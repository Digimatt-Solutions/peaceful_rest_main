import banner from "@/assets/makiwa-banner.jpg";

export const Banner = () => {
  return (
    <section className="bg-cream py-12 sm:py-16">
      <div className="container-luxe">
      <div className="no-card overflow-hidden rounded-lg border border-brand-black/10 shadow-soft">
        <img
          src={banner}
          alt="Makiwa - Preserving life stories with care and respect."
          className="w-full h-auto object-cover"
          loading="lazy"
        />
      </div>
      </div>
    </section>
  );
};
