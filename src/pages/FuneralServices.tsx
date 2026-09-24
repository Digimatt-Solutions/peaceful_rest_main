import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Camera, Video, Music, Flower2, Phone, Check, Loader2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { trackVisit } from "@/lib/trackVisit";
import eulogyImg from "@/assets/ph6.jpg";
import photoImg from "@/assets/ph.jpg";
import streamImg from "@/assets/ph2.jpg";
import candleImg from "@/assets/ph4.png";

const ksh = (n: number) => `KSh ${Number(n || 0).toLocaleString()}`;

const DESIGNS = [
  { id: "glossy", name: "Glossy", desc: "Shiny, vibrant finish." },
  { id: "matte", name: "Matte", desc: "Smooth, non-reflective finish." },
];

const PAGE_CHOICES = [8, 12, 16, 20];

// From the price list: design = KSh 1,000 per page (8 pages = 8,000 … 20 pages = 20,000)
const DESIGN_PER_PAGE = 1000;
// Printing per copy: [100–400, 500–1000, 2000–5000]
const PRINT_RATES: Record<number, [number, number, number]> = {
  8: [160, 101.4, 51.8],
  12: [240, 153.2, 138.2],
  16: [320, 193.4, 175],
  20: [400, 234.6, 211.8],
};
const printRate = (pages: number, qty: number) => {
  const r = PRINT_RATES[pages];
  if (qty >= 100 && qty <= 400) return r[0];
  if (qty >= 500 && qty <= 1000) return r[1];
  if (qty >= 2000 && qty <= 5000) return r[2];
  return null;
};

const EXTRAS = [
  { id: "delivery", label: "Delivery" },
];

const SERVICES = [
  { icon: BookOpen, title: "Hardcopy Eulogy Design", img: eulogyImg,
    desc: "Printed funeral programs and eulogy booklets designed, proofread and delivered on time.",
    points: ["Cover and inside page design", "Photo layout and restoration", "Proofreading before print", "Delivery to the venue"] },
  { icon: Camera, title: "Funeral Photography", img: photoImg,
    desc: "Respectful coverage of the service, burial and family gatherings.",
    points: ["Half-day or full-day cover", "Edited digital album", "Printed photo options", "Discreet, experienced crew"] },
  { icon: Video, title: "Live Streaming", img: streamImg,
    desc: "Family abroad can join the service in real time, with a recording kept afterwards.",
    points: ["HD multi-camera stream", "Private or public link", "Recording shared after", "Backup internet on site"] },
  { icon: Music, title: "Sound & PA Setup", img: candleImg,
    desc: "Clear sound for the service, from speeches to hymns, indoors or at the homestead.",
    points: ["Speakers and microphones", "Technician on site", "Generator backup", "Music playback"] },
];

const EXTRA_SERVICES = [
  { icon: Flower2, title: "Flowers & Décor", desc: "Wreaths, casket sprays and tasteful venue décor." },
  { icon: BookOpen, title: "Obituary Writing", desc: "A written tribute prepared with the family, ready for print or press." },
  { icon: Camera, title: "Memorial Portraits", desc: "Framed enlargements of the portrait used at the service." },
];

const FuneralServices = () => {
  const { user } = useAuth();
  const [design, setDesign] = useState(DESIGNS[0].id);
  const [pages, setPages] = useState(16);
  const [quantity, setQuantity] = useState(100);
  const [extras, setExtras] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_name: "", phone: "", email: "", memorial_name: "", expected_date: "", notes: "",
  });

  useEffect(() => {
    document.title = "Funeral Program Services · Makiwa";
    const desc = "Hardcopy eulogy design, funeral photography, live streaming, sound and flowers - book Makiwa's funeral program services online.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.appendChild(meta); }
    meta.setAttribute("content", desc);
    trackVisit("/funeral-services");
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name,phone,email").eq("id", user.id).maybeSingle()
      .then(({ data }) => setForm(f => ({
        ...f,
        customer_name: f.customer_name || data?.full_name || "",
        phone: f.phone || data?.phone || "",
        email: f.email || data?.email || user.email || "",
      })));
  }, [user]);

  const chosenDesign = DESIGNS.find(d => d.id === design)!;

  const pricing = useMemo(() => {
    const qty = Math.max(0, Number(quantity) || 0);
    const rate = printRate(pages, qty);
    const design = DESIGN_PER_PAGE * pages;
    const printing = rate ? Math.round(rate * qty * 100) / 100 : 0;
    return { qty, rate, design, printing, unit: rate || 0, total: design + printing };
  }, [pages, quantity]);

  const toggleExtra = (id: string) =>
    setExtras(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const submit = async () => {
    if (!form.customer_name.trim()) return toast.error("Please enter your name");
    if (!/^[0-9+\s-]{9,15}$/.test(form.phone.trim())) return toast.error("Please enter a valid phone number");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return toast.error("Please enter a valid email");
    if (!pricing.rate) return toast.error("Please choose 100–400, 500–1,000 or 2,000–5,000 copies");
    setSaving(true);
    const { error } = await supabase.from("service_bookings").insert({
      user_id: user?.id ?? null,
      service: "hardcopy_eulogy",
      design: chosenDesign.name,
      pages,
      quantity: pricing.qty,
      options: {
        extras: EXTRAS.filter(e => extras.includes(e.id)).map(e => `${e.label} (depending on location)`),
        design_charge: pricing.design,
        printing_cost: pricing.printing,
      },
      unit_price: pricing.unit,
      total_amount: pricing.total,
      customer_name: form.customer_name.trim().slice(0, 120),
      phone: form.phone.trim().slice(0, 20),
      email: form.email.trim().slice(0, 160) || null,
      memorial_name: form.memorial_name.trim().slice(0, 160) || null,
      expected_date: form.expected_date || null,
      notes: form.notes.trim().slice(0, 1000) || null,
    });
    setSaving(false);
    if (error) return toast.error("We could not send your booking. Please try again.");
    setOpen(false);
    setForm({ customer_name: form.customer_name, phone: form.phone, email: form.email, memorial_name: "", expected_date: "", notes: "" });
    toast.success("Booking received. Our team will call you shortly to confirm.");
  };

  return (
    <main className="paper-ink-theme min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-brand-black/10 bg-secondary">
        <div className="container-luxe grid items-center gap-10 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-orange">Makiwa Services</span>
            <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.05] tracking-tight lg:text-6xl">
              Funeral program services, handled with care.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              From printed eulogy booklets to photography, live streaming and sound, our team
              takes the practical work off the family's shoulders.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="h-12 rounded-full bg-brand-orange px-7 text-brand-black hover:bg-brand-orange/90">
                <a href="#eulogy">Book a hardcopy eulogy</a>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-full px-7">
                <a href="tel:+254116797979"><Phone className="mr-2 h-4 w-4" /> +254 116 797979</a>
              </Button>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-brand-black/10">
            <img src={eulogyImg} alt="Printed funeral programs arranged with flowers" className="h-full w-full object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="border-b border-brand-black/10 pb-16 lg:pb-20">
        {/* Welcome marquee */}
        <div className="mb-12 overflow-hidden border-y border-white/10 bg-gradient-to-r from-black via-zinc-950 to-black py-4 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
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
        <div className="container-luxe">
          <h2 className="font-serif text-3xl font-medium lg:text-5xl">What we offer</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {SERVICES.map(s => (
              <article key={s.title} className="overflow-hidden rounded-lg border border-brand-black/10 bg-cream shadow-soft">
                <div className="aspect-[16/9] overflow-hidden">
                  <img src={s.img} alt={s.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="p-7">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-orange/35 bg-brand-orange/10">
                    <s.icon className="h-5 w-5 text-brand-black" />
                  </div>
                  <h3 className="mt-4 font-serif text-2xl font-medium">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                  <ul className="mt-4 space-y-2">
                    {s.points.map(p => (
                      <li key={p} className="flex items-start gap-2 text-sm text-foreground/80">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {EXTRA_SERVICES.map(s => (
              <div key={s.title} className="rounded-lg border border-brand-black/10 bg-cream p-6 shadow-soft">
                <s.icon className="h-5 w-5 text-brand-orange" />
                <h3 className="mt-3 font-serif text-xl">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hardcopy eulogy builder */}
      <section id="eulogy" className="bg-secondary py-20 lg:py-28">
        <div className="container-luxe">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-orange">Hardcopy Eulogy</span>
            <h2 className="mt-4 font-serif text-3xl font-medium lg:text-5xl">Build your booklet and see the price instantly.</h2>
            <p className="mt-4 text-muted-foreground">
              Choose a design, the number of pages and the extras you need. The total updates as you go.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-8 rounded-lg border border-brand-black/10 bg-cream p-6 shadow-soft lg:p-8">
              <div>
                <h3 className="font-serif text-xl">1. Choose a finish design</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {DESIGNS.map(d => (
                    <button key={d.id} type="button" onClick={() => setDesign(d.id)}
                      className={`rounded-xl border-2 p-4 text-left transition ${design === d.id ? "border-brand-orange bg-brand-orange/5" : "border-brand-black/10 hover:border-brand-orange/40"}`}>
                      <p className="font-semibold">{d.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{d.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-serif text-xl">2. Design charge per page</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {ksh(DESIGN_PER_PAGE)} per page — {pages} pages = <span className="font-semibold text-foreground">{ksh(pricing.design)}</span>
                </p>
              </div>

              <div>
                <h3 className="font-serif text-xl">3. Number of pages</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {PAGE_CHOICES.map(p => (
                    <button key={p} type="button" onClick={() => setPages(p)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${pages === p ? "border-brand-orange bg-brand-orange text-brand-black" : "border-brand-black/15 hover:border-brand-orange/50"}`}>
                      {p} pages
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-serif text-xl">4. Copies needed</h3>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Input type="number" min={100} max={5000} step={50} value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-36 rounded-xl" />
                  <div className="flex flex-wrap gap-2">
                    {[100, 200, 300, 400, 500, 1000, 2000].map(q => (
                      <button key={q} type="button" onClick={() => setQuantity(q)}
                        className="rounded-full border border-brand-black/15 px-3 py-1.5 text-xs hover:border-brand-orange/50">{q}</button>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Printing per copy for {pages} pages: 100–400 copies {ksh(PRINT_RATES[pages][0])} · 500–1,000 copies {ksh(PRINT_RATES[pages][1])} · 2,000–5,000 copies {ksh(PRINT_RATES[pages][2])}
                </p>
              </div>

              <div>
                <h3 className="font-serif text-xl">5. Optional extras</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {EXTRAS.map(e => (
                    <label key={e.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 text-sm transition ${extras.includes(e.id) ? "border-brand-orange bg-brand-orange/5" : "border-brand-black/10 hover:border-brand-orange/40"}`}>
                      <input type="checkbox" className="mt-1" checked={extras.includes(e.id)} onChange={() => toggleExtra(e.id)} />
                      <span>
                        <span className="block font-medium">{e.label}</span>
                        <span className="text-xs text-muted-foreground">Depending on location</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-lg border border-brand-orange/30 bg-cream p-6 shadow-soft">
                <h3 className="font-serif text-xl">Your estimate</h3>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Finish</dt><dd className="font-medium">{chosenDesign.name}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Pages</dt><dd className="font-medium">{pages}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Copies</dt><dd className="font-medium">{pricing.qty}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Design charge</dt><dd className="font-medium">{ksh(pricing.design)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Printing per copy</dt><dd className="font-medium">{pricing.rate ? ksh(pricing.rate) : "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Printing cost</dt><dd className="font-medium">{pricing.rate ? ksh(pricing.printing) : "—"}</dd></div>
                  {extras.includes("delivery") && (
                    <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="font-medium">Depending on location</dd></div>
                  )}
                </dl>
                {!pricing.rate && (
                  <p className="mt-3 text-xs text-destructive">Printing prices are available for 100–400, 500–1,000 and 2,000–5,000 copies.</p>
                )}
                <div className="mt-5 border-t border-brand-black/10 pt-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Final total</p>
                  <p className="font-serif text-3xl">{ksh(pricing.total)}</p>
                  {extras.includes("delivery") && <p className="text-xs text-muted-foreground">plus delivery, depending on location</p>}
                </div>
                <Button onClick={() => setOpen(true)}
                  className="mt-5 h-12 w-full rounded-full bg-brand-orange text-brand-black hover:bg-brand-orange/90">
                  Book this eulogy
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  This is an estimate. Our team confirms the final cost with you before printing.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Book your hardcopy eulogy</DialogTitle>
          </DialogHeader>
          <p className="-mt-2 text-sm text-muted-foreground">
            {chosenDesign.name} · {pages} pages · {pricing.qty} copies · <span className="font-semibold text-foreground">{ksh(pricing.total)}</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Your name</Label>
              <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Email <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Name of the departed</Label>
              <Input value={form.memorial_name} onChange={(e) => setForm({ ...form, memorial_name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Date needed</Label>
              <Input type="date" value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Anything else we should know?</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl" />
            </div>
          </div>
          <Button onClick={submit} disabled={saving}
            className="h-12 w-full rounded-full bg-brand-orange text-brand-black hover:bg-brand-orange/90">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : <><CalendarDays className="mr-2 h-4 w-4" /> Send booking request</>}
          </Button>
          <p className="text-xs text-muted-foreground">
            No payment is taken now. Our team calls you to confirm details and payment.
          </p>
        </DialogContent>
      </Dialog>

      <Footer />
      <ScrollToTop />
    </main>
  );
};

export default FuneralServices;
