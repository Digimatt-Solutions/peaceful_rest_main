import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";

type Props = {
  trigger?: React.ReactNode;
  onCreated?: (memorial: any) => void;
};

export const NewMemorialDialog = ({ trigger, onCreated }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "", date_of_birth: "", date_of_death: "",
    location: "", short_tribute: "",
    profile_photo_url: "", cover_photo_url: "",
    is_public: true,
  });

  const upload = async (file: File, field: "profile_photo_url" | "cover_photo_url") => {
    if (!user) return;
    setUploading(field);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("memorial-media").upload(path, file);
    if (error) { toast.error(error.message); setUploading(null); return; }
    const { data } = supabase.storage.from("memorial-media").getPublicUrl(path);
    setForm(f => ({ ...f, [field]: data.publicUrl }));
    setUploading(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.full_name.trim()) { toast.error("Full name is required"); return; }
    setSaving(true);
    const payload = {
      ...form,
      created_by: user.id,
      date_of_birth: form.date_of_birth || null,
      date_of_death: form.date_of_death || null,
    };
    const { data, error } = await supabase.from("memorials").insert(payload).select().maybeSingle();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    logActivity("memorial_create", {
      entity_type: "memorial", entity_id: data?.id,
      description: `Created memorial for ${form.full_name}`,
    });
    toast.success("Memorial created");
    setOpen(false);
    setForm({ full_name: "", date_of_birth: "", date_of_death: "", location: "", short_tribute: "", profile_photo_url: "", cover_photo_url: "", is_public: true });
    onCreated?.(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
            <Plus className="h-4 w-4 mr-1.5" /> New Memorial
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Create a memorial</DialogTitle>
          <DialogDescription>Start with the basics - you can add the full story afterwards.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label>Full name *</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Date of birth</Label><Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></div>
            <div className="space-y-2"><Label>Date of passing</Label><Input type="date" value={form.date_of_death} onChange={(e) => setForm({ ...form, date_of_death: e.target.value })} /></div>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, Country" />
          </div>
          <div className="space-y-2">
            <Label>Short tribute</Label>
            <Textarea rows={2} value={form.short_tribute} onChange={(e) => setForm({ ...form, short_tribute: e.target.value })} placeholder='"A kind soul whose laughter filled every room."' />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Profile photo</Label>
              <div className="flex items-center gap-3">
                {form.profile_photo_url && <img src={form.profile_photo_url} alt="" className="h-16 w-16 rounded-lg object-cover" />}
                <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground hover:border-brand-orange/60 hover:text-foreground transition-colors inline-flex items-center gap-2">
                  {uploading === "profile_photo_url" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading === "profile_photo_url" ? "Uploading…" : "Upload"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "profile_photo_url")} />
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cover photo</Label>
              <div className="flex items-center gap-3">
                {form.cover_photo_url && <img src={form.cover_photo_url} alt="" className="h-16 w-24 rounded-lg object-cover" />}
                <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground hover:border-brand-orange/60 hover:text-foreground transition-colors inline-flex items-center gap-2">
                  {uploading === "cover_photo_url" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading === "cover_photo_url" ? "Uploading…" : "Upload"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cover_photo_url")} />
                </label>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="font-medium text-sm">Public memorial</p>
              <p className="text-xs text-muted-foreground">Visible to everyone on Makiwa.</p>
            </div>
            <Switch checked={form.is_public} onCheckedChange={(v) => setForm({ ...form, is_public: v })} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create memorial"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
