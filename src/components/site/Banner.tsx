import banner from "@/assets/makiwa-banner.jpg";

export const Banner = () => {
  return (
    <section className="container-luxe py-10 sm:py-14">
      <div className="rounded-2xl overflow-hidden shadow-elegant ring-1 ring-border">
        <img
          src={banner}
          alt="Makiwa — Preserving life stories with care and respect."
          className="w-full h-auto object-cover"
          loading="lazy"
        />
      </div>
    </section>
  );
};
