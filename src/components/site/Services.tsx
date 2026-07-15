import {
  HeartHandshake,
  ScrollText,
  MessageCircle,
  Camera,
  Users,
  CalendarHeart,
  QrCode,
  Flame,
  ArrowUpRight,
} from "lucide-react";
import FEATURE_IMG from "@/assets/hero-memorial.jpg";

const features = [
  {
    icon: ScrollText,
    name: "Eulogy & Obituary Design",
    desc: "Beautifully crafted obituary pages with biography, photos, dates and a lasting tribute.",
  },
  {
    icon: HeartHandshake,
    name: "Fundraising",
    desc: "Raise contributions toward funeral, burial or family support with secure Stripe checkout.",
  },
  {
    icon: MessageCircle,
    name: "Official Condolences",
    desc: "Receive heartfelt messages from friends, family and community in one moderated space.",
  },
  {
    icon: Camera,
    name: "Life Moments Gallery",
    desc: "Preserve cherished photo memories in an elegant, scrollable timeline of their life.",
  },
  {
    icon: Users,
    name: "Family Tree",
    desc: "Map out the family connections that surrounded and shaped the life remembered.",
  },
  {
    icon: CalendarHeart,
    name: "Anniversary Reminders",
    desc: "Never forget important dates with automatic anniversary notices for the family.",
  },
  {
    icon: QrCode,
    name: "Shareable QR Codes",
    desc: "Every memorial generates a unique QR code so loved ones can visit with a single scan.",
  },
];

export const Services = () => {
  return (
    <section id="services" className="py-24 lg:py-32 bg-[#f1ece3]">
      <div className="container-luxe">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-end mb-14 lg:mb-20">
          <div className="lg:col-span-7">
            <span className="text-xs uppercase tracking-[0.3em] text-brand-orange font-semibold">
              What Makiwa Offers
            </span>
            <h2 className="mt-4 font-serif text-4xl lg:text-6xl font-medium leading-[1.05] tracking-tight">
              Every tool a family needs <br className="hidden sm:block" />
              to honor, gather and remember.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-muted-foreground text-lg leading-relaxed">
              From the first announcement to the lasting memorial, Makiwa brings
              everything together - eulogies, condolences, fundraising and
              shareable QR codes - in one calm, dignified place.
            </p>
          </div>
        </div>

        {/* Editorial feature row */}
        <div className="grid lg:grid-cols-12 gap-6 mb-6">
          <div className="lg:col-span-7 relative rounded-[2rem] overflow-hidden aspect-[16/10] lg:aspect-auto lg:h-[440px] group">
            <img
              src={FEATURE_IMG}
              alt="A memorial gathering"
              className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-black/90 via-brand-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-10 text-brand-white">
              <span className="text-[10px] uppercase tracking-[0.3em] text-brand-orange flex items-center gap-2">
                <Flame className="h-3 w-3" /> Featured
              </span>
              <h3 className="mt-3 font-serif text-3xl lg:text-4xl font-medium max-w-md leading-tight">
                A complete digital memorial, designed with grace.
              </h3>
              <p className="mt-3 max-w-md text-brand-white/75 text-sm leading-relaxed">
                Build a private or public tribute, invite the community, and
                keep their story alive across generations.
              </p>
              <a
                href="#memorials"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold tracking-wide hover:gap-3 transition-all"
              >
                Explore memorials <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 grid sm:grid-cols-2 lg:grid-cols-1 gap-6">
            {features.slice(0, 2).map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.name}
                  className="rounded-[2rem] bg-white p-7 lg:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_50px_-15px_rgba(249,115,22,0.25)] hover:-translate-y-1 transition-all duration-500 lg:flex-1 flex flex-col justify-between min-h-[210px]"
                >
                  <div className="h-12 w-12 rounded-xl bg-brand-orange flex items-center justify-center">
                    <Icon className="h-5 w-5 text-black" strokeWidth={2.25} />
                  </div>
                  <div className="mt-6">
                    <h3 className="font-serif text-2xl font-medium">{s.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          {features.slice(2).map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.name}
                className="group relative p-7 rounded-2xl bg-white shadow-[0_10px_30px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_45px_-15px_rgba(249,115,22,0.28)] hover:-translate-y-1 transition-all duration-500"
              >
                <div className="h-11 w-11 rounded-xl bg-brand-orange flex items-center justify-center group-hover:bg-brand-orange/80 transition-colors duration-500">
                  <Icon className="h-5 w-5 text-black" strokeWidth={2.25} />
                </div>
                <h3 className="mt-5 font-serif text-xl font-semibold">{s.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
