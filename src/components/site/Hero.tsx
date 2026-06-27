import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  HeartHandshake,
  BookHeart,
  Heart,
  Users,
  ShieldCheck,
  Quote,
} from "lucide-react";

import HERO_BG from "@/assets/bg2.png";

export const Hero = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden pt-24"
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_BG}
          alt="Makiwa Memorial Platform"
          className="w-full h-full object-cover"
        />

        {/* Light overlay matching #fbeae0 */}
        <div/>
      </div>

      {/* Soft orange ambient glow */}
      <div className="absolute -top-24 -left-24 h-[24rem] w-[24rem] rounded-full bg-brand-orange/10 blur-[140px]" />

      <div className="container-luxe relative z-10 w-full py-20 lg:py-28">
        <div className="grid lg:grid-cols-12 items-center gap-12">

          {/* LEFT CONTENT */}
          <div className="lg:col-span-7">

            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-black">
              Honoring Lives.
              <br />
              Sharing Memories.
              <br />
              <span className="text-black">
                Keeping Love Alive.
              </span>
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-black/75">
              Makiwa is a compassionate online sanctuary where families and
              friends gather to celebrate lives, share stories, and preserve
              treasured memories for generations to come.
            </p>

            {/* CTA Buttons */}
            <div className="mt-7 flex flex-wrap gap-4">

              <Button
                asChild
                size="lg"
                className="h-12 px-4 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold shadow-lg"
              >
                <Link to="/auth">
                  <HeartHandshake className="mr-2 h-5 w-5" />
                  Create a Memorial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-4 rounded-xl border-black/55 bg-white/40 backdrop-blur-md text-black hover:bg-white"
              >
                <a href="#memorials">
                  <Users className="mr-2 h-5 w-5" />
                  Browse Memorials
                </a>
              </Button>

            </div>

            {/* Memorial Pillars */}
            <div className="mt-8 max-w-lg">
              <div className="flex items-start gap-20 border-t border-black/10 pt-6">

                <div className="text-center lg:text-left">
                  <Heart className="h-6 w-6 text-brand-orange mb-2" />
                  <h3 className="font-semibold text-black">
                    Honor
                  </h3>
                  <p className="text-sm text-black/60">
                    with love
                  </p>
                </div>

                <div className="text-center lg:text-left">
                  <Users className="h-6 w-6 text-brand-orange mb-2" />
                  <h3 className="font-semibold text-black">
                    Share
                  </h3>
                  <p className="text-sm text-black/60">
                    memories
                  </p>
                </div>

                <div className="text-center lg:text-left">
                  <ShieldCheck className="h-6 w-6 text-brand-orange mb-2" />
                  <h3 className="font-semibold text-black">
                    Forever
                  </h3>
                  <p className="text-sm text-black/60">
                    remembered
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="lg:col-span-5 flex justify-end">

            <div className="mt-80 max-w-sm mr-20 rounded-3xl border border-brand-orange/20 bg-black/30 backdrop-blur-xl p-5 shadow-2xl">

              <Quote className="h-5 w-5 text-brand-orange " />

              <blockquote className="font-serif text-xl leading-relaxed text-white italic">
                "Those we love don't go away -
                they walk beside us every day."
              </blockquote>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
};