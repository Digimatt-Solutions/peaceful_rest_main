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
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

const empty = {
  full_name: "", gender: "", date_of_birth: "", date_of_death: "",
  cover_photo_url: "", profile_photo_url: "", biography: "",
  burial_details: "", service_schedule: "", venue: "", location: "",
  map_url: "", program_pdf_url: "", short_tribute: "", is_public: true,
};

const ObituaryManagement = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const id = params.get("id");
  const [form, setForm] = useState<any>(empty);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

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
    setLoading(true);
    const payload = {
      ...form,
      created_by: user.id,
      date_of_birth: form.date_of_birth || null,
      date_of_death: form.date_of_death || null,
    };
    const { data, error } = id
      ? await supabase.from("memorials").update(payload).eq("id", id).select().maybeSingle()
      : await supabase.from("memorials").insert(payload).select().maybeSingle();
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(id ? "Memorial updated" : "Memorial created");
    if (!id && data) navigate(`/dashboard/obituary?id=${data.id}`);
  };

  const remove = async () => {
    if (!id || !confirm("Delete this memorial permanently?")) return;
    const { error } = await supabase.from("memorials").delete().eq("id", id);
    if (error) return toast.error(error.message);
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
      <form onSubmit={save} className="space-y-7 max-w-3xl">
        <section className="rounded-2xl border border-border bg-card p-7 space-y-5">
          <h3 className="font-serif text-xl">Basic information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2"><Label>Full name *</Label><Input value={form.full_name} onChange={handle("full_name")} required /></div>
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
            <p className="text-sm text-muted-foreground">When on, this memorial appears publicly on Makiwa.</p>
          </div>
          <Switch checked={form.is_public} onCheckedChange={(v) => setForm((f: any) => ({ ...f, is_public: v }))} />
        </section>

        <Button type="submit" disabled={loading} className="rounded-full h-12 px-8 bg-brand-orange text-brand-white hover:bg-brand-orange/90">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> {id ? "Save changes" : "Create memorial"}</>}
        </Button>
      </form>
    </>
  );
};

export default ObituaryManagement;
