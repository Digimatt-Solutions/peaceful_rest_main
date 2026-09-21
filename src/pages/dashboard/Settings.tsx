import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SiteTraffic } from "@/components/dashboard/SiteTraffic";
import { toast } from "sonner";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { isSuperAdmin } = useUserRole();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [notifs, setNotifs] = useState(true);
  const [privacy, setPrivacy] = useState(true);
  const [account, setAccount] = useState({ full_name: "", email: "", phone: "" });
  const [savingAccount, setSavingAccount] = useState(false);

  // Prefill with the details given at registration.
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name,email,phone").eq("id", user.id).maybeSingle()
      .then(({ data }) => setAccount({
        full_name: data?.full_name || "",
        email: data?.email || user.email || "",
        phone: data?.phone || "",
      }));
  }, [user]);

  const saveAccount = async () => {
    if (!user) return;
    setSavingAccount(true);
    const { error } = await supabase.from("profiles")
      .update({ full_name: account.full_name.trim(), phone: account.phone.trim() })
      .eq("id", user.id);
    setSavingAccount(false);
    if (error) return toast.error("We couldn't save your details. Please try again.");
    toast.success("Your details were saved");
  };


  const changePassword = async () => {
    if (newPassword.length < 8) return toast.error("At least 8 characters");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return toast.error(error.message);
    setNewPassword(""); toast.success("Password updated");
  };

  const deleteAccount = async () => {
    if (!user) return;
    if (!confirm("Your account will be closed. You have 30 days to sign back in and restore it, after which your details are removed permanently. Continue?")) return;
    const { error } = await supabase.from("profiles")
      .update({ deleted_at: new Date().toISOString() } as any).eq("id", user.id);
    if (error) return toast.error("We couldn't close your account. Please try again.");
    await signOut();
    toast.success("Account closed", { description: "Sign back in within 30 days to restore it." });
    navigate("/");
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Notifications, privacy, analytics and account." />
      {isSuperAdmin && (
        <div className="mb-8 -mx-4 sm:mx-0">
          <SiteTraffic />
        </div>
      )}
      <div className="max-w-2xl space-y-5">
        <section className="rounded-2xl border border-border bg-card p-7 space-y-5">
          <div>
            <h3 className="font-serif text-xl">Your details</h3>
            <p className="text-sm text-muted-foreground">These are the details you gave when you registered.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Full name</Label>
              <Input value={account.full_name} onChange={(e) => setAccount({ ...account, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={account.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Phone number</Label>
              <Input type="tel" value={account.phone} onChange={(e) => setAccount({ ...account, phone: e.target.value })} />
            </div>
          </div>
          <Button onClick={saveAccount} disabled={savingAccount} className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
            {savingAccount ? "Saving…" : "Save details"}
          </Button>
        </section>

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
          <p className="mt-1 text-sm text-muted-foreground">
            Close your account. You have 30 days to sign back in and restore it — after that your personal details are
            permanently removed. Records we must keep for accounting and safety are retained.
          </p>
          <Button onClick={deleteAccount} variant="outline" className="mt-4 rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">Delete account</Button>
        </section>
      </div>
    </>
  );
};

export default Settings;
