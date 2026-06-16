import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FamilyTreeView } from "@/components/family/FamilyTreeView";
import { MasonryGallery } from "@/components/gallery/MasonryGallery";
import { Flame, MapPin, Calendar, Users, MessageCircle, Camera, Megaphone, Loader2, Heart, Share2, HeartHandshake } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format } from "date-fns";
import { z } from "zod";

const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : "—";

const condolenceSchema = z.object({
  name: z.string().trim().min(2, "Please share your name").max(80),
  relationship: z.string().trim().max(60).optional(),
  message: z.string().trim().min(10, "Please share at least a sentence").max(1500),
});

const MemorialDetail = () => {
  const { id } = useParams();
  const [memorial, setMemorial] = useState<any>(null);
  const [family, setFamily] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [condolences, setCondolences] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [fundraisers, setFundraisers] = useState<any[]>([]);
  const [donateOpen, setDonateOpen] = useState<string | null>(null);
  const [donateForm, setDonateForm] = useState({ donor_name: "", amount: "", message: "", is_anonymous: false });
  const [donating, setDonating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [candleLit, setCandleLit] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      supabase.from("memorials").select("*").eq("id", id).maybeSingle(),
      supabase.from("family_members").select("*").eq("memorial_id", id),
      supabase.from("memories").select("*").eq("memorial_id", id).order("memory_date", { ascending: false }),
      supabase.from("condolences").select("*").eq("memorial_id", id).in("status", ["approved", "pinned"]).order("is_pinned", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("announcements").select("*").eq("memorial_id", id).order("created_at", { ascending: false }),
      supabase.from("fundraisers").select("*").eq("memorial_id", id).eq("is_active", true).order("created_at", { ascending: false }),
    ]).then(([m, f, mm, c, a, fr]) => {
      setMemorial(m.data);
      setFamily(f.data || []);
      setMemories(mm.data || []);
      setCondolences(c.data || []);
      setAnnouncements(a.data || []);
      setFundraisers(fr.data || []);
      setLoading(false);
      if (m.data) {
        document.title = `${m.data.full_name} · Makiwa`;
        supabase.from("memorials").update({ visitor_count: (m.data.visitor_count || 0) + 1 }).eq("id", id).then(() => {});
      }
    });
  }, [id]);

  const submitCondolence = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = condolenceSchema.safeParse({
      name: fd.get("name"),
      relationship: fd.get("relationship") || undefined,
      message: fd.get("message"),
    });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setSubmitting(true);
    const { data, error } = await supabase.from("condolences").insert({
      memorial_id: id,
      name: parsed.data.name,
      relationship: parsed.data.relationship,
      message: parsed.data.message,
      status: "approved",
    }).select().maybeSingle();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setCondolences([data, ...condolences]);
    (e.target as HTMLFormElement).reset();
    toast.success("Your message was shared. Thank you.");
  };

  const donate = async (fundraiserId: string) => {
    const amt = Number(donateForm.amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    setDonating(true);
    const { error } = await supabase.from("donations").insert({
      fundraiser_id: fundraiserId,
      donor_name: donateForm.is_anonymous ? null : (donateForm.donor_name || null),
      amount: amt,
      message: donateForm.message || null,
      is_anonymous: donateForm.is_anonymous,
    });
    if (!error) {
      const fr = fundraisers.find(f => f.id === fundraiserId);
      const newRaised = Number(fr.raised_amount) + amt;
      await supabase.from("fundraisers").update({ raised_amount: newRaised }).eq("id", fundraiserId);
      setFundraisers(fs => fs.map(f => f.id === fundraiserId ? { ...f, raised_amount: newRaised } : f));
      setDonateForm({ donor_name: "", amount: "", message: "", is_anonymous: false });
      setDonateOpen(null);
      toast.success("Thank you for your contribution");
    } else toast.error(error.message);
    setDonating(false);
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: memorial.full_name, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-orange" />
      </main>
    );
  }
  if (!memorial) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container-luxe py-32 text-center">
          <h1 className="font-serif text-4xl">Memorial not found</h1>
          <p className="text-muted-foreground mt-3">This memorial may be private or no longer available.</p>
          <Button asChild className="mt-6 rounded-full bg-brand-orange text-brand-black"><Link to="/">Return home</Link></Button>
        </div>
        <Footer />
      </main>
    );
  }

  const cover = memorial.cover_photo_url || memorial.profile_photo_url;
  const upcomingEvents = announcements.filter(a => a.event_date && new Date(a.event_date) >= new Date());

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-20">
  
  {/* BACKGROUND (always stays behind) */}
  <div className="absolute inset-0 z-0 h-[70vh] overflow-hidden">
    {cover ? (
      <img
        src={cover}
        alt={memorial.full_name}
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-foreground to-foreground/80" />
    )}

    {/* overlay (kept subtle so image is visible) */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/60" />
  </div>

  {/* CONTENT (always above background) */}
  <div className="relative z-10 container-luxe pt-24 pb-12 text-white">
    
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-xs uppercase tracking-[0.2em]">
      <Flame className="h-3.5 w-3.5 text-orange-400" /> 
      In Loving Memory
    </div>

    <h1 className="mt-6 font-serif text-5xl sm:text-6xl lg:text-7xl font-medium leading-[1.05]">
      {memorial.full_name}
    </h1>

    <p className="mt-4 text-lg text-white/80 font-light tracking-wide">
      {fmt(memorial.date_of_birth)} 
      <span className="mx-2 text-orange-400">—</span> 
      {fmt(memorial.date_of_death)}
    </p>

    {memorial.location && (
      <p className="mt-2 inline-flex items-center gap-2 text-white/70 text-sm">
        <MapPin className="h-4 w-4 text-orange-400" /> 
        {memorial.location}
      </p>
    )}

    {memorial.short_tribute && (
      <p className="mt-6 max-w-2xl italic text-white/85 text-lg leading-relaxed font-serif">
        "{memorial.short_tribute}"
      </p>
    )}

    <div className="mt-8 flex flex-wrap gap-3">
      <Button
        onClick={() => { setCandleLit(true); toast.success("A candle has been lit."); }}
        className="rounded-full bg-orange-400 text-black hover:bg-orange-500 h-12 px-6"
      >
        <Flame className="h-4 w-4 mr-2" />
        {candleLit ? "Candle lit" : "Light a candle"}
      </Button>

      <Button
        onClick={share}
        variant="outline"
        className="rounded-full h-12 px-6 border-white/30 text-black hover:bg-white hover:text-black"
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share memorial
      </Button>

      <a
        href="#condolence"
        className="inline-flex items-center gap-2 rounded-full h-12 px-6 border border-white/30 text-white hover:bg-white hover:text-black transition-colors text-sm font-medium"
      >
        <Heart className="h-4 w-4" />
        Send condolences
      </a>
    </div>

    <div className="mt-10 flex items-center gap-8 text-xs text-white/70">
      <span>
        <strong className="text-white text-base font-serif">
          {(memorial.visitor_count || 0).toLocaleString()}
        </strong> visits
      </span>
      <span>
        <strong className="text-white text-base font-serif">
          {condolences.length}
        </strong> condolences
      </span>
      <span>
        <strong className="text-white text-base font-serif">
          {memories.length}
        </strong> memories
      </span>
    </div>

  </div>
</section>

      <div className="container-luxe py-16 lg:py-24 grid lg:grid-cols-[1fr_320px] gap-12">
        {/* Main column */}
        <div className="space-y-20 min-w-0">
          {/* Biography */}
          {memorial.biography && (
            <section>
              <SectionTitle icon={Heart} eyebrow="Their Story" title="A life remembered" />
              <div className="mt-8 max-w-3xl">
                <p className="whitespace-pre-line text-foreground/85 leading-[1.8] text-lg font-serif">
                  {memorial.biography}
                </p>
              </div>
            </section>
          )}

          {/* Family tree */}
          <section>
            <SectionTitle icon={Users} eyebrow="Family" title="The family tree" />
            <div className="mt-8">
              <FamilyTreeView
                deceasedName={memorial.full_name}
                deceasedPhoto={memorial.profile_photo_url}
                members={family}
              />
            </div>
          </section>

          {/* Memories gallery */}
          {memories.length > 0 && (
            <section>
              <SectionTitle icon={Camera} eyebrow="Life Moments" title="A gallery of cherished memories" />
              <div className="mt-8">
                <MasonryGallery
                  items={memories.filter(m => m.photo_url).map(m => ({
                    id: m.id,
                    src: m.photo_url,
                    title: m.title,
                    description: m.description,
                    date: m.memory_date ? format(new Date(m.memory_date), "MMMM d, yyyy") : undefined,
                  }))}
                />
              </div>
            </section>
          )}

          {/* Service / events */}
          {(memorial.service_schedule || memorial.venue || upcomingEvents.length > 0) && (
            <section>
              <SectionTitle icon={Calendar} eyebrow="Services & Events" title="Gathering to remember" />
              <div className="mt-8 grid gap-4">
                {memorial.service_schedule && (
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <h4 className="font-serif text-xl">Service Schedule</h4>
                    <p className="mt-2 text-foreground/80 whitespace-pre-line">{memorial.service_schedule}</p>
                    {memorial.venue && <p className="mt-2 text-sm text-muted-foreground inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {memorial.venue}</p>}
                  </div>
                )}
                {upcomingEvents.map(ev => (
                  <div key={ev.id} className="rounded-2xl border border-border bg-card p-6">
                    <p className="text-xs uppercase tracking-widest text-brand-orange font-semibold">{ev.category}</p>
                    <h4 className="font-serif text-xl mt-1">{ev.title}</h4>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {format(new Date(ev.event_date), "EEEE, MMMM d, yyyy · h:mm a")}
                      {ev.venue ? ` · ${ev.venue}` : ""}
                    </p>
                    {ev.body && <p className="mt-3 text-foreground/85 whitespace-pre-line">{ev.body}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Announcements */}
          {announcements.length > 0 && (
            <section>
              <SectionTitle icon={Megaphone} eyebrow="Announcements" title="Notices from the family" />
              <div className="mt-8 space-y-3">
                {announcements.slice(0, 6).map(a => (
                  <div key={a.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <h5 className="font-medium">{a.title}</h5>
                      <span className="text-xs text-muted-foreground shrink-0">{format(new Date(a.created_at), "MMM d")}</span>
                    </div>
                    <p className="mt-2 text-sm text-foreground/80 whitespace-pre-line">{a.body}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Fundraising */}
          {fundraisers.length > 0 && (
            <section id="contribute">
              <SectionTitle icon={HeartHandshake} eyebrow="Contribute" title="Support the family" />
              <div className="mt-8 grid gap-5">
                {fundraisers.map(f => {
                  const pct = f.goal_amount > 0 ? Math.min(100, (Number(f.raised_amount) / Number(f.goal_amount)) * 100) : 0;
                  const open = donateOpen === f.id;
                  return (
                    <div key={f.id} className="rounded-2xl border border-border bg-card p-6">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <span className="text-xs uppercase tracking-widest text-brand-orange font-semibold">{f.category?.replace(/_/g, " ")}</span>
                          <h4 className="mt-1 font-serif text-2xl">{f.title}</h4>
                          {f.description && <p className="mt-2 text-foreground/80 leading-relaxed">{f.description}</p>}
                        </div>
                        <Button onClick={() => setDonateOpen(open ? null : f.id)} className="rounded-full bg-brand-orange text-brand-black hover:bg-brand-orange/90 h-11 px-5">
                          <HeartHandshake className="h-4 w-4 mr-2" /> Contribute
                        </Button>
                      </div>
                      <div className="mt-5">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-semibold">KSh {Number(f.raised_amount).toLocaleString()} raised</span>
                          <span className="text-muted-foreground">of KSh {Number(f.goal_amount).toLocaleString()}</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                      {open && (
                        <div className="mt-6 grid sm:grid-cols-2 gap-3 pt-5 border-t border-border">
                          <div className="space-y-2"><Label>Your name</Label><Input value={donateForm.donor_name} onChange={(e) => setDonateForm({ ...donateForm, donor_name: e.target.value })} disabled={donateForm.is_anonymous} className="rounded-xl" /></div>
                          <div className="space-y-2"><Label>Amount (KSh)</Label><Input type="number" min="1" value={donateForm.amount} onChange={(e) => setDonateForm({ ...donateForm, amount: e.target.value })} className="rounded-xl" /></div>
                          <div className="space-y-2 sm:col-span-2"><Label>Message <span className="text-muted-foreground font-normal">(optional)</span></Label><Textarea rows={2} value={donateForm.message} onChange={(e) => setDonateForm({ ...donateForm, message: e.target.value })} className="rounded-xl" /></div>
                          <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={donateForm.is_anonymous} onChange={(e) => setDonateForm({ ...donateForm, is_anonymous: e.target.checked })} />
                            Contribute anonymously
                          </label>
                          <div className="sm:col-span-2 flex gap-2">
                            <Button onClick={() => donate(f.id)} disabled={donating} className="rounded-full bg-brand-orange text-brand-black hover:bg-brand-orange/90">
                              {donating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit contribution"}
                            </Button>
                            <Button variant="outline" onClick={() => setDonateOpen(null)} className="rounded-full">Cancel</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}


          {/* Condolences */}
          <section id="condolence">
            <SectionTitle icon={MessageCircle} eyebrow="Condolences" title="Messages from those who loved them" />

            <form onSubmit={submitCondolence} className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4">
              <h4 className="font-serif text-xl">Leave a message</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="c-name">Your name</Label><Input id="c-name" name="name" required className="rounded-xl" /></div>
                <div className="space-y-2"><Label htmlFor="c-rel">Relationship <span className="text-muted-foreground font-normal">(optional)</span></Label><Input id="c-rel" name="relationship" placeholder="Friend, colleague, neighbor…" className="rounded-xl" /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="c-msg">Your message</Label><Textarea id="c-msg" name="message" rows={4} required className="rounded-xl" placeholder="Share a memory or word of comfort…" /></div>
              <Button type="submit" disabled={submitting} className="rounded-full bg-brand-orange text-brand-black hover:bg-brand-orange/90 h-12 px-7">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send condolences"}
              </Button>
            </form>

            <div className="mt-8 space-y-4">
              {condolences.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Be the first to share a message of comfort.</p>
              ) : condolences.map(c => (
                <div key={c.id} className={`rounded-2xl border p-6 ${c.is_pinned ? "border-brand-orange/40 bg-brand-orange/[0.03]" : "border-border bg-card"}`}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center font-serif text-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.relationship ? `${c.relationship} · ` : ""}{format(new Date(c.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    {c.is_pinned && <span className="text-[10px] uppercase tracking-widest text-brand-orange font-semibold">Pinned</span>}
                  </div>
                  <p className="mt-4 text-foreground/85 leading-relaxed whitespace-pre-line">{c.message}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 self-start space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">At a glance</p>
            <dl className="mt-4 space-y-3 text-sm">
              {memorial.gender && <Row label="Gender" value={memorial.gender} />}
              <Row label="Born" value={fmt(memorial.date_of_birth)} />
              <Row label="Passed" value={fmt(memorial.date_of_death)} />
              {memorial.location && <Row label="Location" value={memorial.location} />}
              {memorial.venue && <Row label="Venue" value={memorial.venue} />}
            </dl>
          </div>

          {memorial.burial_details && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h4 className="font-serif text-lg">Burial details</h4>
              <p className="mt-2 text-sm text-foreground/80 whitespace-pre-line">{memorial.burial_details}</p>
            </div>
          )}

          <div className="rounded-2xl border border-brand-orange/30 bg-gradient-to-b from-brand-orange/5 to-transparent p-6 text-center">
            <Flame className="h-6 w-6 mx-auto text-brand-orange candle-flicker" />
            <p className="mt-3 font-serif text-lg leading-tight">May their memory be a blessing.</p>
            <Button onClick={share} className="mt-4 w-full rounded-full bg-brand-orange text-brand-black hover:bg-brand-orange/90">
              <Share2 className="h-4 w-4 mr-2" /> Share this memorial
            </Button>
          </div>
        </aside>
      </div>

      <Footer />
    </main>
  );
};

const SectionTitle = ({ icon: Icon, eyebrow, title }: { icon: any; eyebrow: string; title: string }) => (
  <div>
    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-brand-orange font-semibold">
      <Icon className="h-3.5 w-3.5" /> {eyebrow}
    </div>
    <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-medium">{title}</h2>
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="font-medium text-right">{value}</dd>
  </div>
);

export default MemorialDetail;
