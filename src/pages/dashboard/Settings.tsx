import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [notifs, setNotifs] = useState(true);
  const [privacy, setPrivacy] = useState(true);

  const changePassword = async () => {
    if (newPassword.length < 8) return toast.error("At least 8 characters");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return toast.error(error.message);
    setNewPassword(""); toast.success("Password updated");
  };

  const deleteAccount = async () => {
    if (!confirm("Are you absolutely sure? This cannot be undone.")) return;
    if (!user) return;
    await supabase.from("profiles").delete().eq("id", user.id);
    await signOut();
    toast.success("Account deleted");
    navigate("/");
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Notifications, privacy, and account." />
      <div className="max-w-2xl space-y-5">
        <section className="rounded-2xl border border-border bg-card p-7 space-y-5">
          <h3 className="font-serif text-xl">Preferences</h3>
          <div className="flex items-center justify-between"><div><p className="font-medium">Email notifications</p><p className="text-sm text-muted-foreground">New condolences, donations, anniversaries.</p></div><Switch checked={notifs} onCheckedChange={setNotifs} /></div>
          <div className="flex items-center justify-between"><div><p className="font-medium">Public profile</p><p className="text-sm text-muted-foreground">Allow others to see your name on tributes.</p></div><Switch checked={privacy} onCheckedChange={setPrivacy} /></div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-7 space-y-4">
          <h3 className="font-serif text-xl">Change password</h3>
          <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div className="space-y-2"><Label>New password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} /></div>
            <Button onClick={changePassword} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">Update</Button>
          </div>
        </section>

        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-7">
          <h3 className="font-serif text-xl text-destructive">Danger zone</h3>
          <p className="mt-1 text-sm text-muted-foreground">Permanently delete your account and all your data.</p>
          <Button onClick={deleteAccount} variant="outline" className="mt-4 rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">Delete account</Button>
        </section>
      </div>
    </>
  );
};

export default Settings;
