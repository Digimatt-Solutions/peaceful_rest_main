import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import PasswordStrength, { scorePassword } from "@/components/auth/PasswordStrength";
import logoMark from "@/assets/makiwa-mark.png";
import logoText from "@/assets/makiwa-logo-black.png";

/**
 * Landing page for the password-recovery email link.
 * Supabase delivers the recovery session either through the URL hash
 * (implicit flow) or a ?code= param (PKCE flow) - both are handled here.
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Reset password · Makiwa";
    let done = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        done = true;
        setValid(true);
        setReady(true);
      }
    });

    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          setValid(true);
          setReady(true);
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setValid(true);
        setReady(true);
        return;
      }
      // give the hash-based listener a brief moment before declaring the link invalid
      setTimeout(() => { if (!done) { setValid(false); setReady(true); } }, 1200);
    })();

    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (scorePassword(password) < 2) { toast.error("Please choose a stronger password"); return; }
    if (password !== confirm) { toast.error("The two passwords do not match"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) { toast.error("We could not update your password. Please request a new link."); return; }
    toast.success("Password updated - please sign in with your new password");
    await supabase.auth.signOut();
    navigate("/auth?tab=login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Dialog open>
        <DialogContent
          className="sm:max-w-md border-brand-orange/30"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center gap-2 pt-1">
            <img src={logoMark} alt="" className="h-14 w-14 object-contain rounded-lg" />
            <img src={logoText} alt="Makiwa" className="h-6 w-auto object-contain" />
          </div>

          {!ready ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-brand-orange" />
            </div>
          ) : !valid ? (
            <div className="text-center space-y-4 py-2">
              <h1 className="text-xl font-semibold">This link has expired</h1>
              <p className="text-sm text-muted-foreground">
                Password reset links can only be used once and expire after a short while. Please request a new one.
              </p>
              <Button
                className="w-full h-11 rounded-lg bg-brand-orange text-brand-white hover:bg-brand-orange/90"
                onClick={() => navigate("/auth?tab=login", { replace: true })}
              >
                Back to login
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4 mt-1">
              <div className="text-center space-y-1">
                <h1 className="text-xl font-semibold flex items-center justify-center gap-2">
                  <KeyRound className="h-5 w-5 text-brand-orange" /> Set a new password
                </h1>
                <p className="text-sm text-muted-foreground">Choose a strong password you have not used before.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rp-pw">New password</Label>
                <div className="relative">
                  <Input
                    id="rp-pw"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl pr-11 border-2 border-brand-black/15 focus-visible:ring-brand-orange/40"
                    required
                  />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rp-confirm">Confirm password</Label>
                <Input
                  id="rp-confirm"
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-11 rounded-xl border-2 border-brand-black/15 focus-visible:ring-brand-orange/40"
                  required
                />
                {confirm && confirm !== password && (
                  <p className="text-xs text-destructive">The two passwords do not match.</p>
                )}
              </div>

              <Button type="submit" disabled={saving} className="w-full h-12 rounded-lg bg-brand-orange text-brand-white hover:bg-brand-orange/90 border border-brand-orange/40">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><ShieldCheck className="h-4 w-4 mr-2" />Update password</>)}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default ResetPassword;
