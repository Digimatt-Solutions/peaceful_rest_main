import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<any>({ full_name: "", email: "", phone: "", bio: "", avatar_url: "" });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    document.title = "Profile · Peaceful Rest";
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setForm(data);
    });
  }, [user]);

  const upload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/avatar-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("memorial-media").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("memorial-media").getPublicUrl(path);
    setForm((f: any) => ({ ...f, avatar_url: data.publicUrl }));
    setUploading(false);
  };

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name, phone: form.phone, bio: form.bio, avatar_url: form.avatar_url,
    }).eq("id", user.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  };

  return (
    <>
      <PageHeader title="Profile" subtitle="How others see you on Peaceful Rest." />
      <div className="max-w-2xl space-y-6">
        <div className="rounded-2xl border border-border bg-card p-7">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20">
              <AvatarImage src={form.avatar_url} />
              <AvatarFallback className="bg-brand-orange text-brand-white text-2xl">{(form.full_name || "U").charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <Label>Profile photo</Label>
              <Input className="mt-2" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} disabled={uploading} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Full name</Label><Input value={form.full_name || ""} onChange={(e) => setForm({...form, full_name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={form.email || user?.email || ""} disabled /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Phone</Label><Input value={form.phone || ""} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Bio</Label><Textarea rows={4} value={form.bio || ""} onChange={(e) => setForm({...form, bio: e.target.value})} /></div>
          </div>
          <Button onClick={save} disabled={loading} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save changes</>}
          </Button>
        </div>
      </div>
    </>
  );
};

export default Profile;
