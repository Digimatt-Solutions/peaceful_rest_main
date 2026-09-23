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
import { Link } from "react-router-dom";
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
    desc: "Raise contributions toward funeral, burial or family support with secure Mpesa checkout.",
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
    <section
      id="services"
      className="organic-divider relative overflow-hidden border-b border-brand-black/10 bg-secondary py-14 lg:pt-32"
    >
      <div className="container-luxe">
        {/* Section Header */}
        <div className="mb-14 grid items-end gap-12 lg:mb-20 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-orange">
              What Makiwa Offers
            </span>

            <h2 className="mt-4 font-serif text-4xl font-medium leading-[1.05] tracking-tight lg:text-6xl">
              Every tool a family needs
              <br className="hidden sm:block" />
              to honor, gather and remember.
            </h2>
          </div>

          <div className="lg:col-span-5">
            <p className="text-lg leading-relaxed text-muted-foreground">
              From the first announcement to the lasting memorial, Makiwa brings
              everything together - eulogies, condolences, fundraising and
              shareable QR codes - in one calm, dignified place.
            </p>

            <Link
              to="/funeral-services"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-orange px-6 py-3 text-sm font-semibold text-brand-black transition-all hover:gap-3 hover:bg-brand-orange/90"
            >
              Funeral program services
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Featured Editorial Row */}
        <div className="mb-6 grid gap-6 lg:grid-cols-12">
          <div className="no-card group relative aspect-[16/10] overflow-hidden rounded-lg border border-brand-black/10 lg:col-span-7 lg:aspect-auto lg:h-[440px]">
            <img
              src={FEATURE_IMG}
              alt="A memorial gathering"
              className="h-full w-full object-cover transition-transform duration-[1500ms] group-hover:scale-105"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-brand-black/90 via-brand-black/30 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-8 text-brand-white lg:p-10">
              <div className="hidden lg:block">
                <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-brand-orange">
                  <Flame className="h-3 w-3" />
                  Featured
                </span>

                <h3 className="mt-3 max-w-md font-serif text-3xl font-medium leading-tight lg:text-4xl">
                  A complete digital memorial, designed with grace.
                </h3>

                <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-white/75">
                  Build a private or public tribute, invite the community, and
                  keep their story alive across generations.
                </p>
              </div>

              <a
                href="#memorials"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold tracking-wide transition-all hover:gap-3"
              >
                Explore memorials
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Featured Services */}
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            {features.slice(0, 2).map((service) => {
              const Icon = service.icon;

              return (
                <div
                  key={service.name}
                  className="no-card flex min-h-[210px] flex-col justify-between rounded-lg border border-brand-black/10 bg-cream p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-brand-orange/30 lg:flex-1 lg:p-8"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-orange/35 bg-brand-orange/10">
                    <Icon
                      className="h-5 w-5 text-brand-black"
                      strokeWidth={2}
                    />
                  </div>

                  <div className="mt-6">
                    <h3 className="font-serif text-2xl font-medium">
                      {service.name}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {service.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Remaining Services */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {features.slice(2).map((service) => {
            const Icon = service.icon;

            return (
              <div
                key={service.name}
                className="no-card group relative rounded-lg border border-brand-black/10 bg-cream p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-brand-orange/30"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-orange/35 bg-brand-orange/10 transition-colors duration-500 group-hover:bg-brand-orange/15">
                  <Icon
                    className="h-5 w-5 text-brand-black"
                    strokeWidth={2}
                  />
                </div>

                <h3 className="mt-5 font-serif text-xl font-semibold">
                  {service.name}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {service.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Premium Marquee */}
        <div className="mt-16 overflow-hidden rounded-md border-y border-white/10 bg-gradient-to-r from-black via-zinc-950 to-black py-4 shadow-[0_8px_30px_rgba(0,0,0,0.25)] lg:mt-20">
          <div className="relative">
            {/* Subtle glossy highlight */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />

            <div className="flex w-max animate-marquee-x whitespace-nowrap hover:[animation-play-state:paused] motion-reduce:animate-none">
              {[0, 1].map((i) => (
                <p
                  key={i}
                  className="px-6 font-sans text-sm font-extrabold uppercase tracking-[0.08em] text-white sm:px-8 sm:text-base"
                >
                  WELCOME TO MAKIWA

                  <span className="mx-4 text-white/50">•</span>

                  WHERE FAMILIES HONOR THEIR LOVED ONES AND REMEMBER WITH GRACE

                  <span className="mx-4 text-white/50">•</span>

                  HARDCOPY EULOGY DESIGN

                  <span className="mx-4 text-white/50">•</span>

                  PHOTOGRAPHY & LIVE STREAMING

                  <span className="mx-4 text-white/50">•</span>

                  DEATH ANNOUNCEMENTS & OFFICIAL CONDOLENCES

                  <span className="mx-4 text-white/50">•</span>

                  LIFE MOMENTS GALLERY

                  <span className="mx-4 text-white/50">•</span>

                  ANNIVERSARY REMINDERS

                  <span className="mx-4 text-white/50">•</span>

                  FAMILY TREE

                  <span className="mx-4 text-white/50">•</span>

                  EASY SHARING VIA QR CODES
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};