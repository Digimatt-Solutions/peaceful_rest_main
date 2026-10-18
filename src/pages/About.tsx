import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  BookOpen, MessageCircleHeart, Images, HandHeart, Printer, CalendarCheck,
  GitBranch, BellRing, HeartHandshake, ShieldCheck, Globe2, Users, Sparkles,
  Flame, ArrowRight, ChevronDown, Target, Eye,
} from "lucide-react";
import { useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";
import { MAKIWA_DESCRIPTION } from "@/lib/memorialSharing";
import elderImg from "@/assets/why-african-elder.jpg";
import familyImg from "@/assets/why-african-family.jpg";
import candleImg from "@/assets/why-african-candle.jpg";
import sunsetImg from "@/assets/why-sunset-reflection.jpg";

const services = [
  { icon: BookOpen, title: "Digital obituaries & memorial pages", desc: "Create a dignified online memorial with the life story, service details, and portrait of your loved one, shared through a single link." },
  { icon: MessageCircleHeart, title: "Condolences, tributes & shared memories", desc: "Friends and relatives can leave condolences, reply to tributes, and share their own memories, all gently moderated before they go live." },
  { icon: Images, title: "Photo & video galleries", desc: "Preserve photographs and short video moments in a lasting gallery that family and community can revisit for years." },
  { icon: HandHeart, title: "Memorial fundraising", desc: "Receive contributions through M-Pesa, Paystack, or card, with verified payment records and receipts the family can rely on." },
  { icon: Printer, title: "Funeral program design & printing", desc: "Design a hardcopy eulogy or funeral program and coordinate printing, with clear per-page design and printing rates." },
  { icon: CalendarCheck, title: "Funeral service coordination", desc: "Browse funeral service providers and coordinate bookings where supported, all from one place." },
  { icon: GitBranch, title: "Family trees", desc: "Map parents, siblings, spouses, and descendants around the deceased so the family's story stays connected." },
  { icon: BellRing, title: "Anniversary reminders", desc: "Gentle reminders help family and friends remember anniversaries and continue honouring a life well lived." },
];

const steps = [
  { n: "01", title: "Create a memorial", desc: "A family member opens a memorial page with the life story, photo, and service arrangements." },
  { n: "02", title: "Share the link", desc: "Invite relatives and friends through WhatsApp, Facebook, or a printed QR code." },
  { n: "03", title: "Receive tributes & support", desc: "Condolences, memories, and contributions arrive from near and far, reviewed before going live." },
  { n: "04", title: "Preserve the legacy", desc: "Photos, stories, and the family tree remain as a permanent place of remembrance." },
];

const values = [
  { icon: HeartHandshake, title: "Compassion", desc: "Every detail is designed for families in their most tender moments." },
  { icon: Flame, title: "Remembrance", desc: "We believe every life deserves to be remembered with warmth." },
  { icon: Users, title: "Family connection", desc: "Bringing scattered families together in one shared space." },
  { icon: Globe2, title: "Accessibility", desc: "Simple to use on any phone, anywhere in the world." },
  { icon: ShieldCheck, title: "Trust & dignity", desc: "Verified memorials, moderated tributes, and respect for every life." },
];

const faqs = [
  { q: "What is Makiwa?", a: "Makiwa is a digital memorial platform that helps families honour loved ones through obituaries, condolences, tributes, fundraising, funeral programs, and lasting memories." },
  { q: "How does a memorial page work?", a: "A family member creates a memorial with the life story, photos, and service details. The page gets a unique link that can be shared with relatives and friends, who can then leave condolences, share memories, and follow updates." },
  { q: "Can visitors share condolences without an account?", a: "Yes. Visitors can leave a condolence, like and reply to tributes, and even attach a photo or short video. Guest contributions stay hidden until the memorial's family administrator or a Makiwa administrator approves them." },
  { q: "How does memorial fundraising work?", a: "Families can open a fundraiser on the memorial page. Contributions are made through M-Pesa, Paystack, or card, and only verified payments count toward the total. Every verified contribution generates a receipt." },
  { q: "Do I need to sign in to view a shared memorial?", a: "No. Public memorials can be opened by anyone who has the link. Signing in is only needed to create a memorial, manage one, or use dashboard features." },
  { q: "How can our family get assistance?", a: "Reach the Makiwa team at info@makiwa.ke or +254 116 797979. We are glad to help you set up a memorial, design a funeral program, or answer any question." },
];

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-brand-black/10 bg-card shadow-soft overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-semibold text-base">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-brand-orange transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground">{a}</p>}
    </div>
  );
};

const About = () => (
  <main className="paper-ink-theme min-h-screen bg-background">
    <Helmet>
      <title>About Makiwa - Honouring Lives, Preserving Memories</title>
      <meta name="description" content={MAKIWA_DESCRIPTION} />
      <link rel="canonical" href="/about" />
      <meta property="og:title" content="About Makiwa - Honouring Lives, Preserving Memories" />
      <meta property="og:description" content={MAKIWA_DESCRIPTION} />
      <meta property="og:site_name" content="Makiwa" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="/about" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="About Makiwa - Honouring Lives, Preserving Memories" />
      <meta name="twitter:description" content={MAKIWA_DESCRIPTION} />
    </Helmet>
    <Navbar />

    {/* Hero */}
    <section className="paper-section relative overflow-hidden pt-36 pb-24 lg:pt-44 lg:pb-32 border-b border-brand-black/10">
      <div aria-hidden className="absolute -left-32 top-10 h-96 w-96 rounded-full border border-brand-black/10" />
      <div aria-hidden className="absolute -right-24 bottom-0 h-72 w-72 rounded-full border border-brand-orange/20" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand-orange/10 to-transparent" />
      <div className="container-luxe relative grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-brand-orange font-semibold">
            <span className="h-2 w-2 rounded-full bg-brand-orange" /> About Makiwa
          </span>
          <h1 className="mt-6 font-serif text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.05] tracking-tight">
            Honouring Lives. Preserving Memories. <em className="not-italic text-brand-orange">Keeping Legacies Alive.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {MAKIWA_DESCRIPTION}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button asChild className="rounded-full bg-brand-orange px-7 text-brand-white hover:bg-brand-orange/90 shadow-glow border border-brand-orange/40">
              <Link to="/memorials">Explore Memorials <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-7 border-brand-black/20 hover:border-brand-orange hover:text-brand-orange">
              <Link to="/funeral-services">Discover Our Services</Link>
            </Button>
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="relative mx-auto max-w-sm">
            <div aria-hidden className="absolute -inset-4 rounded-full border border-brand-orange/25" />
            <div className="overflow-hidden rounded-full border-4 border-card shadow-elegant">
              <img src={candleImg} alt="A hand holding a lit memorial candle at dusk" className="aspect-square w-full object-cover" loading="eager" />
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Our story */}
    <section className="paper-section py-24 lg:py-32 border-b border-brand-black/10">
      <div className="container-luxe grid lg:grid-cols-12 gap-14 items-center">
        <div className="lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-brand-black/10 shadow-elegant">
            <img src={familyImg} alt="An African family embracing at golden hour" className="aspect-[4/5] w-full object-cover" loading="lazy" />
          </div>
        </div>
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-brand-orange font-semibold">
            <span className="h-2 w-2 rounded-full bg-brand-orange" /> Our story & purpose
          </span>
          <h2 className="mt-5 font-serif text-3xl lg:text-5xl font-medium leading-[1.08] tracking-tight">
            Because every life deserves a place to be remembered.
          </h2>
          <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed max-w-2xl">
            <p>
              When a loved one passes, families face so much at once: spreading the word, coordinating the service,
              gathering contributions, and holding on to the stories and photographs that keep a person close.
              Too often, those memories scatter across chat threads and fade with time.
            </p>
            <p>
              Makiwa exists to change that. We give each family a meaningful digital space for remembrance,
              connection, and support: one place where the obituary lives, where condolences gather, where
              contributions are recorded with care, and where memories remain long after the farewell.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Mission & vision */}
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div aria-hidden className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-brand-orange/15" />
      <div className="container-luxe">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-brand-orange font-semibold">
            <span className="h-2 w-2 rounded-full bg-brand-orange" /> Mission & vision
          </span>
          <h2 className="mt-5 font-serif text-3xl lg:text-5xl font-medium leading-[1.08] tracking-tight">
            What guides every page we help a family create.
          </h2>
        </div>
        <div className="mt-14 grid md:grid-cols-2 gap-8">
          <div className="group rounded-2xl border border-brand-black/10 bg-card p-8 lg:p-10 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-elegant hover:border-brand-orange/40">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange/10 transition-colors duration-500 group-hover:bg-brand-orange">
              <Target className="h-6 w-6 text-brand-orange transition-colors duration-500 group-hover:text-brand-white" />
            </div>
            <span className="mt-6 block text-xs uppercase tracking-[0.3em] text-brand-orange font-semibold">Our mission</span>
            <p className="mt-4 font-serif text-2xl lg:text-3xl leading-snug">
              To help every family honour their loved ones with dignity and preserve their legacies for the generations that follow.
            </p>
          </div>
          <div className="group rounded-2xl border border-brand-black/10 bg-card p-8 lg:p-10 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-elegant hover:border-brand-orange/40">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange/10 transition-colors duration-500 group-hover:bg-brand-orange">
              <Eye className="h-6 w-6 text-brand-orange transition-colors duration-500 group-hover:text-brand-white" />
            </div>
            <span className="mt-6 block text-xs uppercase tracking-[0.3em] text-brand-orange font-semibold">Our vision</span>
            <p className="mt-4 font-serif text-2xl lg:text-3xl leading-snug">
              A world where meaningful digital remembrance is accessible to every family, and no life story is ever lost.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* What Makiwa offers */}
    <section className="paper-section py-24 lg:py-32 border-b border-brand-black/10">
      <div className="container-luxe">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-brand-orange font-semibold">
            <span className="h-2 w-2 rounded-full bg-brand-orange" /> What Makiwa offers
          </span>
          <h2 className="mt-5 font-serif text-3xl lg:text-5xl font-medium leading-[1.08] tracking-tight">
            Everything a family needs, in one gentle place.
          </h2>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="group rounded-2xl border border-brand-black/10 bg-card p-6 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-elegant hover:border-brand-orange/40">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange/10 transition-colors duration-500 group-hover:bg-brand-orange">
                  <Icon className="h-5 w-5 text-brand-orange transition-colors duration-500 group-hover:text-brand-white" />
                </div>
                <h3 className="mt-5 font-semibold text-base leading-snug">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    {/* How it works */}
    <section className="py-24 lg:py-32">
      <div className="container-luxe">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-brand-orange font-semibold">
            <span className="h-2 w-2 rounded-full bg-brand-orange" /> How it works
          </span>
          <h2 className="mt-5 font-serif text-3xl lg:text-5xl font-medium leading-[1.08] tracking-tight">
            From the first announcement to a lasting legacy.
          </h2>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-brand-black/10 bg-card p-6 shadow-soft">
              <span className="font-serif text-5xl text-brand-orange/25 leading-none">{s.n}</span>
              <h3 className="mt-4 font-semibold text-base">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Why choose Makiwa */}
    <section className="paper-section py-24 lg:py-32 border-y border-brand-black/10">
      <div className="container-luxe grid lg:grid-cols-12 gap-14 items-center">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-brand-orange font-semibold">
            <span className="h-2 w-2 rounded-full bg-brand-orange" /> Why choose Makiwa
          </span>
          <h2 className="mt-5 font-serif text-3xl lg:text-5xl font-medium leading-[1.08] tracking-tight">
            A dedicated space for remembrance, built with care.
          </h2>
          <ul className="mt-8 space-y-5 max-w-xl">
            {[
              { icon: Sparkles, text: "A dignified, dedicated remembrance space, free of clutter and distraction." },
              { icon: Globe2, text: "Accessible sharing: one link reaches family across towns and continents." },
              { icon: Users, text: "Family and community connection through tributes, groups, and shared memories." },
              { icon: BookOpen, text: "Organised memorial information: service details, programs, and fundraising in one place." },
              { icon: Flame, text: "Memories preserved beyond the funeral period, for the years of remembrance that follow." },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-black/15 bg-card">
                  <Icon className="h-4 w-4 text-brand-orange" />
                </div>
                <p className="pt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-brand-black/10 shadow-elegant">
            <img src={sunsetImg} alt="A person gazing at a warm African sunset in quiet reflection" className="aspect-[4/5] w-full object-cover" loading="lazy" />
          </div>
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div aria-hidden className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full border border-brand-orange/15" />
      <div className="container-luxe">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-brand-orange font-semibold">
            <span className="h-2 w-2 rounded-full bg-brand-orange" /> Our values
          </span>
          <h2 className="mt-5 font-serif text-3xl lg:text-5xl font-medium leading-[1.08] tracking-tight">
            The principles behind every page.
          </h2>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="group rounded-2xl border border-brand-black/10 bg-card p-6 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-elegant hover:border-brand-orange/40">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-orange/10 transition-colors duration-500 group-hover:bg-brand-orange">
                  <Icon className="h-5 w-5 text-brand-orange transition-colors duration-500 group-hover:text-brand-white" />
                </div>
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    {/* A lasting legacy */}
    <section className="paper-section py-24 lg:py-32 border-b border-brand-black/10">
      <div className="container-luxe grid lg:grid-cols-12 gap-14 items-center">
        <div className="lg:col-span-5 order-2 lg:order-1">
          <div className="overflow-hidden rounded-2xl border border-brand-black/10 shadow-elegant">
            <img src={elderImg} alt="An elder whose life story lives on through family memories" className="aspect-[4/5] w-full object-cover" loading="lazy" />
          </div>
        </div>
        <div className="lg:col-span-7 order-1 lg:order-2">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-brand-orange font-semibold">
            <span className="h-2 w-2 rounded-full bg-brand-orange" /> A lasting legacy
          </span>
          <h2 className="mt-5 font-serif text-3xl lg:text-5xl font-medium leading-[1.08] tracking-tight">
            So future generations know the people who shaped their lives.
          </h2>
          <p className="mt-6 max-w-2xl text-muted-foreground leading-relaxed">
            A photograph, a story told at the graveside, a tribute from an old friend: these fragments become a family's
            inheritance. Makiwa gathers them into one permanent place, so a grandchild not yet born can one day read
            the condolences, see the photographs, and understand the life that came before them.
          </p>
        </div>
      </div>
    </section>

    {/* FAQ */}
    <section className="py-24 lg:py-32">
      <div className="container-luxe grid lg:grid-cols-12 gap-14">
        <div className="lg:col-span-4">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-brand-orange font-semibold">
            <span className="h-2 w-2 rounded-full bg-brand-orange" /> FAQ
          </span>
          <h2 className="mt-5 font-serif text-3xl lg:text-4xl font-medium leading-[1.08] tracking-tight">
            Questions families often ask.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Still unsure about something? Write to us at{" "}
            <a href="mailto:info@makiwa.ke" className="text-brand-orange hover:underline">info@makiwa.ke</a>.
          </p>
        </div>
        <div className="lg:col-span-8 space-y-4">
          {faqs.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </div>
    </section>

    <Footer />
    <ScrollToTop />
  </main>
);

export default About;
