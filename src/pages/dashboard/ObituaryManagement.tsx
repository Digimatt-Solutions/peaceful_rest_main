import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Trash2, FileUp, Sparkles, BookOpen, Camera, Video, Music, Flower2, Phone } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";
import { MemorialQR } from "@/components/MemorialQR";
import { MemorialValidators } from "@/components/dashboard/MemorialValidators";

const empty = {
  full_name: "", national_id: "", gender: "", date_of_birth: "", date_of_death: "",
  cover_photo_url: "", profile_photo_url: "", biography: "",
  burial_details: "", service_schedule: "", venue: "", location: "",
  map_url: "", program_pdf_url: "", short_tribute: "", is_public: false, verification_status: "pending",
};

const ObituaryManagement = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const id = params.get("id");
  const [form, setForm] = useState<any>(empty);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [readFile, setReadFile] = useState<string | null>(null);

  const readDocument = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("Please upload a document under 10MB"); return; }
    setReading(true);
    setReadFile(file.name);
    try {
      const isText = /\.(txt|md|csv)$/i.test(file.name) || file.type.startsWith("text/");
      let body: any;
      if (isText) {
        body = { text: await file.text() };
      } else {
        const dataUrl: string = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = () => reject(new Error("read failed"));
          r.readAsDataURL(file);
        });
        body = { file_data: dataUrl, mime: file.type, filename: file.name };
      }
      const { data, error } = await supabase.functions.invoke("extract-obituary", { body });
      if (error || !data?.fields) {
        toast.error(data?.error || "We couldn't read that document. Please fill the form in manually.");
        return;
      }
      const f = data.fields as Record<string, string>;
      setForm((prev: any) => {
        const next = { ...prev };
        Object.entries(f).forEach(([k, v]) => {
          if (v && String(v).trim() && !String(prev[k] || "").trim()) next[k] = String(v).trim();
        });
        return next;
      });
      toast.success("Details filled in from your document. Please review before saving.");
    } catch {
      toast.error("We couldn't read that document. Please fill the form in manually.");
    } finally {
      setReading(false);
    }
  };


  useEffect(() => {
    document.title = "Obituary Management · Makiwa";
    if (id) {
      supabase.from("memorials").select("*").eq("id", id).maybeSingle().then(({ data }) => {
        if (data) setForm({ ...data, date_of_birth: data.date_of_birth || "", date_of_death: data.date_of_death || "" });
      });
    } else {
      setForm(empty);
    }
  }, [id]);

  const handle = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target?.value ?? e }));

  const upload = async (file: File, field: string) => {
    if (!user) return;
    setUploading(field);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("memorial-media").upload(path, file);
    if (error) { toast.error(error.message); setUploading(null); return; }
    const { data } = supabase.storage.from("memorial-media").getPublicUrl(path);
    setForm((f: any) => ({ ...f, [field]: data.publicUrl }));
    setUploading(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.full_name) { toast.error("Full name is required"); return; }
    // Duplicate ID check (only when an ID is provided and it's an adult record)
    const nid = (form.national_id || "").trim();
    if (nid) {
      let q = supabase.from("memorials").select("id,full_name").ilike("national_id", nid);
      if (id) q = q.neq("id", id);
      const { data: dup } = await q.maybeSingle();
      if (dup) {
        toast.error(`An obituary with this ID already exists for ${dup.full_name}`);
        return;
      }
    }
    setLoading(true);
    const verified = form.verification_status === "verified";
    const payload = {
      ...form,
      national_id: nid || null,
      created_by: user.id,
      date_of_birth: form.date_of_birth || null,
      date_of_death: form.date_of_death || null,
      // A memorial only goes public once two validators have verified it.
      is_public: verified ? form.is_public : false,
      verification_status: form.verification_status || "pending",
    };
    const { data, error } = id
      ? await supabase.from("memorials").update(payload).eq("id", id).select().maybeSingle()
      : await supabase.from("memorials").insert(payload).select().maybeSingle();
    setLoading(false);
    if (error) {
      if ((error as any).code === "23505") toast.error("This National ID is already registered for another memorial.");
      else toast.error(error.message);
      return;
    }
    logActivity(id ? "memorial_update" : "memorial_create", {
      entity_type: "memorial", entity_id: (data?.id || id) as string,
      description: `${id ? "Updated" : "Created"} memorial for ${form.full_name}`,
    });
    toast.success(id ? "Memorial updated" : "Memorial created");
    if (!id && data) navigate(`/dashboard/obituary?id=${data.id}`);
  };

  const remove = async () => {
    if (!id || !confirm("Delete this memorial permanently?")) return;
    const { error } = await supabase.from("memorials").delete().eq("id", id);
    if (error) return toast.error(error.message);
    logActivity("delete", { entity_type: "memorial", entity_id: id, description: `Deleted memorial ${form.full_name}` });
    toast.success("Memorial deleted");
    navigate("/dashboard/memorials");
  };

  return (
    <>
      <PageHeader
        title={id ? "Edit memorial" : "Create memorial"}
        subtitle="Add the photos, dates, and story you'd like to remember."
        action={id && <Button onClick={remove} variant="outline" className="rounded-full text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>}
      />

      {id && form.full_name && (
        <div className="mb-8 grid lg:grid-cols-[1fr_320px] gap-6 max-w-3xl">
          <div className="rounded-2xl border border-brand-orange/30 bg-gradient-to-br from-brand-orange/5 to-transparent p-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-brand-orange font-semibold">Shareable Memorial</p>
            <h3 className="mt-2 font-serif text-2xl">Spread the word</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              A unique QR code has been generated for this memorial. Print it on the program, share it on social media, or send it via message. Anyone who scans it lands directly on this memorial page.
            </p>
            <a
              href={`/memorial/${id}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-orange hover:underline"
            >
              View public memorial page →
            </a>
          </div>
          <MemorialQR memorialId={id} memorialName={form.full_name} size={160} />
        </div>
      )}

      <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
      <form onSubmit={save} className="space-y-7 max-w-3xl">
        <section className="rounded-2xl border border-brand-orange/30 bg-brand-orange/5 p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-orange/15 text-brand-orange inline-flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif text-xl">Start from a document</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Upload a funeral program, eulogy or obituary (PDF, photo or text) and we will fill in as much of this
                form as we can. Nothing is saved until you review the details and save.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <Input
                  type="file"
                  accept=".pdf,.txt,.md,image/*"
                  disabled={reading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) readDocument(f); e.target.value = ""; }}
                  className="bg-card"
                />
                {reading && (
                  <span className="inline-flex items-center gap-2 text-sm text-brand-orange whitespace-nowrap">
                    <Loader2 className="h-4 w-4 animate-spin" /> Reading {readFile}…
                  </span>
                )}
              </div>
              {!reading && readFile && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileUp className="h-3.5 w-3.5" /> Last document read: {readFile}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-7 space-y-5">
          <h3 className="font-serif text-xl">Basic information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2"><Label>Full name *</Label><Input value={form.full_name} onChange={handle("full_name")} required /></div>
            <div className="space-y-2 sm:col-span-2">
              <Label>National ID number <span className="text-muted-foreground font-normal">(required for adults, prevents duplicate obituaries)</span></Label>
              <Input value={form.national_id} onChange={handle("national_id")} placeholder="e.g. 12345678" />
            </div>
            <div className="space-y-2"><Label>Gender</Label><Input value={form.gender} onChange={handle("gender")} placeholder="e.g. Male / Female" /></div>
            <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={handle("location")} placeholder="City, Country" /></div>
            <div className="space-y-2"><Label>Date of birth</Label><Input type="date" value={form.date_of_birth} onChange={handle("date_of_birth")} /></div>
            <div className="space-y-2"><Label>Date of passing</Label><Input type="date" value={form.date_of_death} onChange={handle("date_of_death")} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Short tribute line</Label><Input value={form.short_tribute} onChange={handle("short_tribute")} placeholder='"A kind soul whose laughter filled every room."' /></div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-7 space-y-5">
          <h3 className="font-serif text-xl">Photos</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Profile photo</Label>
              <div className="mt-2 flex items-center gap-3">
                {form.profile_photo_url && <img src={form.profile_photo_url} alt="" className="h-20 w-20 rounded-lg object-cover" />}
                <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "profile_photo_url")} disabled={uploading === "profile_photo_url"} />
              </div>
            </div>
            <div>
              <Label>Cover photo</Label>
              <div className="mt-2 flex items-center gap-3">
                {form.cover_photo_url && <img src={form.cover_photo_url} alt="" className="h-20 w-32 rounded-lg object-cover" />}
                <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cover_photo_url")} disabled={uploading === "cover_photo_url"} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-7 space-y-5">
          <h3 className="font-serif text-xl">Biography & service</h3>
          <div className="space-y-2"><Label>Biography</Label><Textarea rows={6} value={form.biography} onChange={handle("biography")} placeholder="Share their story…" /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Burial details</Label><Textarea rows={3} value={form.burial_details} onChange={handle("burial_details")} /></div>
            <div className="space-y-2"><Label>Service schedule</Label><Textarea rows={3} value={form.service_schedule} onChange={handle("service_schedule")} /></div>
            <div className="space-y-2"><Label>Venue</Label><Input value={form.venue} onChange={handle("venue")} /></div>
            <div className="space-y-2"><Label>Map URL</Label><Input value={form.map_url} onChange={handle("map_url")} placeholder="Google Maps link" /></div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-7 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl">Public visibility</h3>
            <p className="text-sm text-muted-foreground">
              {form.verification_status === "verified"
                ? "When on, this memorial appears publicly on Makiwa."
                : "Available once two validators have verified this memorial below."}
            </p>
          </div>
          <Switch
            checked={form.is_public && form.verification_status === "verified"}
            disabled={form.verification_status !== "verified"}
            onCheckedChange={(v) => setForm((f: any) => ({ ...f, is_public: v }))}
          />
        </section>

        {id && (
          <MemorialValidators
            memorialId={id}
            memorialName={form.full_name}
            verificationStatus={form.verification_status || "pending"}
            onStatusChange={(status, isPublic) => setForm((f: any) => ({ ...f, verification_status: status, is_public: isPublic }))}
          />
        )}

        <Button type="submit" disabled={loading} className="rounded-full h-12 px-8 bg-brand-orange text-brand-white hover:bg-brand-orange/90">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> {id ? "Save changes" : "Create memorial"}</>}
        </Button>
      </form>

      <aside className="rounded-2xl border border-border bg-card p-6 xl:sticky xl:top-6">
        <p className="text-[10px] uppercase tracking-[0.25em] text-brand-orange font-semibold">Makiwa services</p>
        <h3 className="mt-2 font-serif text-xl">Funeral program services</h3>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          Let our team handle the send-off details while you focus on family.
        </p>
        <ul className="mt-5 space-y-4">
          {[
            { icon: BookOpen, title: "Hardcopy eulogy design", desc: "Printed programs and eulogy booklets, designed and delivered." },
            { icon: Camera, title: "Photography", desc: "Respectful coverage of the service and family portraits." },
            { icon: Video, title: "Live streaming", desc: "Bring family abroad into the service in real time." },
            { icon: Music, title: "Sound & PA setup", desc: "Clear audio for tributes, hymns and the eulogy." },
            { icon: Flower2, title: "Flowers & décor", desc: "Casket arrangements, wreaths and venue styling." },
          ].map((s) => (
            <li key={s.title} className="flex gap-3">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-brand-orange/10 text-brand-orange inline-flex items-center justify-center">
                <s.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </li>
          ))}
        </ul>
        <a
          href="tel:+254116797979"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-orange px-5 h-11 text-sm font-medium text-brand-white hover:bg-brand-orange/90 transition-colors"
        >
          <Phone className="h-4 w-4" /> Talk to our team
        </a>
        <p className="mt-2 text-center text-xs text-muted-foreground">+254 116 797979 · info@makiwa.ke</p>
      </aside>
      </div>
    </>
  );
};

export default ObituaryManagement;
