import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import PasswordStrength, { scorePassword } from "@/components/auth/PasswordStrength";
import logoMark from "@/assets/makiwa-mark.png";

const SetupAdmin = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [closed, setClosed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });

  useEffect(() => {
    document.title = "Administrator Setup · Makiwa";
    supabase.functions
      .invoke("setup-admin", { body: { action: "status" } })
      .then(({ data }) => setClosed(!!data?.admin_exists))
      .catch(() => setClosed(false))
      .finally(() => setChecking(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scorePassword(form.password) < 3) {
      toast.error("Choose a stronger password for the administrator account");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("setup-admin", { body: { ...form } });
    setBusy(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Setup failed");
      if (data?.error?.includes("already exists")) setClosed(true);
      return;
    }
    toast.success("Administrator account created. You can sign in now.");
    navigate("/auth?tab=login", { replace: true });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-3xl border border-brand-orange/30 bg-card p-8 shadow-elegant">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <div className="flex flex-col items-center text-center">
          <img src={logoMark} alt="" className="h-12 w-12 object-contain" />
          <h1 className="mt-3 text-xl font-semibold">Administrator setup</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This one-time page creates the first super administrator. It closes permanently afterwards.
          </p>
        </div>

        {checking ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-brand-orange" /></div>
        ) : closed ? (
          <div className="mt-6 rounded-xl border border-border bg-muted/40 p-5 text-center">
            <Lock className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Setup is closed</p>
            <p className="mt-1 text-xs text-muted-foreground">
              An administrator already exists for Makiwa. Additional admins are granted from User Management.
            </p>
            <Button asChild className="mt-4 rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90">
              <Link to="/auth?tab=login">Go to sign in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sa-name">Full name</Label>
              <Input id="sa-name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Administrator" className="h-11 rounded-xl border-brand-orange/30" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sa-email">Email</Label>
              <Input id="sa-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@example.com" className="h-11 rounded-xl border-brand-orange/30" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sa-pw">Password</Label>
              <div className="relative">
                <Input id="sa-pw" type={showPw ? "text" : "password"} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-11 rounded-xl pr-11 border-brand-orange/30" required />
                <button type="button" onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>
            <Button type="submit" disabled={busy}
              className="h-12 w-full rounded-lg border border-brand-orange/40 bg-brand-orange text-white hover:bg-brand-orange/90">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="mr-2 h-4 w-4" /> Create administrator</>}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
};

export default SetupAdmin;
