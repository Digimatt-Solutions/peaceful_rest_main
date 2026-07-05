import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Save, User as UserIcon, Mail, Phone, FileText, Camera,
  Fingerprint, ShieldCheck, Trash2, Plus, Info, Clock
} from "lucide-react";
import { toast } from "sonner";
import { isWebAuthnSupported, registerFingerprint, listFingerprints, removeFingerprint, isInIframe } from "@/lib/webauthn";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<any>({ full_name: "", email: "", phone: "", bio: "", avatar_url: "" });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creds, setCreds] = useState<any[]>([]);
  const [bioBusy, setBioBusy] = useState(false);
  const bioAvailable = typeof window !== "undefined" && isWebAuthnSupported();

  useEffect(() => {
    document.title = "Profile · Makiwa";
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setForm(data);
    });
    refreshCreds();
  }, [user]);

  const refreshCreds = async () => {
    if (!user) return;
    try { setCreds(await listFingerprints(user.id)); } catch {}
  };

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

  const enrollFingerprint = async () => {
    setBioBusy(true);
    try {
      await registerFingerprint();
      toast.success("Fingerprint registered");
      await refreshCreds();
    } catch (e: any) {
      toast.error(e.message || "Registration failed");
    } finally {
      setBioBusy(false);
    }
  };

  const dropCred = async (id: string) => {
    if (!confirm("Remove this registered device?")) return;
    try {
      await removeFingerprint(id);
      toast.success("Removed");
      await refreshCreds();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <>
      <PageHeader title="Profile" subtitle="How others see you on Makiwa." />
      <div className="max-w-3xl space-y-6">
        {/* Photo card */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-7">
          <div className="flex items-center gap-2 mb-5">
            <Camera className="h-4 w-4 text-brand-orange" />
            <h3 className="font-semibold">Profile photo</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar className="h-24 w-24 ring-4 ring-brand-orange/10">
              <AvatarImage src={form.avatar_url} />
              <AvatarFallback className="bg-brand-orange text-brand-white text-2xl">{(form.full_name || "U").charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 w-full">
              <Label className="text-xs text-muted-foreground">Upload a new photo (JPG or PNG)</Label>
              <Input className="mt-2" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} disabled={uploading} />
            </div>
          </div>
        </div>

        {/* Personal info */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-brand-orange" />
            <h3 className="font-semibold">Personal information</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><UserIcon className="h-3.5 w-3.5 text-muted-foreground" /> Full name</Label>
              <Input value={form.full_name || ""} onChange={(e) => setForm({...form, full_name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email</Label>
              <Input value={form.email || user?.email || ""} disabled />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone</Label>
              <Input value={form.phone || ""} onChange={(e) => setForm({...form, phone: e.target.value})} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-muted-foreground" /> Bio</Label>
              <Textarea rows={4} value={form.bio || ""} onChange={(e) => setForm({...form, bio: e.target.value})} />
            </div>
          </div>
          <Button onClick={save} disabled={loading} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save changes</>}
          </Button>
        </div>

        {/* Fingerprint / biometric security */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-orange/10 text-brand-orange inline-flex items-center justify-center">
                <Fingerprint className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  Fingerprint sign-in <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Register this device's fingerprint or Face ID to sign in without a password.
                </p>
              </div>
            </div>
            <Button
              onClick={enrollFingerprint}
              disabled={!bioAvailable || bioBusy}
              className="rounded-lg bg-brand-orange text-brand-white hover:bg-brand-orange/90"
            >
              {bioBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> Register fingerprint</>}
            </Button>
          </div>

          {!bioAvailable && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/20 px-3 py-2 text-xs">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              This browser or device does not support biometric sign-in.
            </div>
          )}

          {creds.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <Fingerprint className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No fingerprints registered yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
              {creds.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3 bg-background/50">
                  <div className="h-9 w-9 rounded-lg bg-brand-orange/10 text-brand-orange inline-flex items-center justify-center shrink-0">
                    <Fingerprint className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.device_name || "Biometric device"}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Added {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      {c.last_used_at && ` · used ${formatDistanceToNow(new Date(c.last_used_at), { addSuffix: true })}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-700 border-emerald-500/20">Active</Badge>
                  <button
                    onClick={() => dropCred(c.id)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;
