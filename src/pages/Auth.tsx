import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Heart, ShieldCheck, Eye, EyeOff, LogIn, UserPlus, Fingerprint, CheckCircle2, MailCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/auth.jpg";
import logoMark from "@/assets/makiwa-mark.png";
import logoText from "@/assets/makiwa-logo-black.png";
import PasswordStrength, { scorePassword } from "@/components/auth/PasswordStrength";
import { isWebAuthnSupported, signInWithFingerprint } from "@/lib/webauthn";

/** Turn technical auth/network errors into plain, reassuring language. */
const friendlyError = (raw?: string | null): string => {
  const m = (raw || "").toLowerCase();
  if (!m) return "Something went wrong. Please try again.";
  if (m.includes("invalid login credentials")) return "That email or password is not correct.";
  if (m.includes("email not confirmed")) return "Please confirm your email first - check your inbox for the link.";
  if (m.includes("user already registered") || m.includes("already been registered")) return "An account with this email already exists. Please log in instead.";
  if (m.includes("password should be") || m.includes("weak password")) return "Please choose a stronger password (at least 8 characters).";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("network") || m.includes("fetch")) return "We could not reach the server. Please check your connection.";
  if (m.includes("invalid email")) return "Please enter a valid email address.";
  return "Something went wrong. Please try again.";
};



const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(9, "Please enter your phone number").max(30),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  role: z.enum(["mourner", "memorial_admin"]),
});
const loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Required"),
});

const roleOptions = [
  {
    value: "mourner",
    label: "Guest",
    icon: Heart,
  },
  {
    value: "memorial_admin",
    label: "Memorial Admin",
    icon: ShieldCheck,
  },
] as const;

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"mourner" | "memorial_admin">("mourner");
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: "login" | "create-account" =
    searchParams.get("tab") === "create-account" ? "create-account" : "login";
  const setTab = (v: "login" | "create-account") =>
    setSearchParams({ tab: v }, { replace: true });
  const [showPw, setShowPw] = useState(false);
  const [showSuPw, setShowSuPw] = useState(false);
  const [suPassword, setSuPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const sendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = forgotEmail.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast.error("Please enter a valid email address"); return; }
    setForgotBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotBusy(false);
    if (error) { toast.error(friendlyError(error.message)); return; }
    setForgotSent(true);
    toast.success("Reset link sent - check your inbox");
  };
  const bioAvailable = typeof window !== "undefined" && isWebAuthnSupported();



  // phone verification
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);

  const phoneVerified = !!verifiedPhone && verifiedPhone === phone.trim();

  const sendCode = async () => {
    if (phone.trim().length < 9) { toast.error("Enter your phone number first"); return; }
    setOtpBusy(true);
    const { data, error } = await supabase.functions.invoke("phone-otp", {
      body: { action: "send", phone: phone.trim() },
    });
    setOtpBusy(false);
    if (error || data?.error) { toast.error(data?.error || "Could not send the code. Please try again."); return; }
    setOtpSent(true);
    toast.success("A 6-digit code has been sent to your phone");
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(otp.trim())) { toast.error("Enter the 6-digit code"); return; }
    setOtpBusy(true);
    const { data, error } = await supabase.functions.invoke("phone-otp", {
      body: { action: "verify", phone: phone.trim(), code: otp.trim() },
    });
    setOtpBusy(false);
    if (error || data?.error) { toast.error(data?.error || "Verification failed"); return; }
    setVerifiedPhone(phone.trim());
    setOtpSent(false);
    setOtp("");
    toast.success("Phone number verified");
  };


  useEffect(() => {
    document.title = "Sign In · Makiwa";
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  // If the platform has no super administrator yet, send visitors to the one-time setup form.
  useEffect(() => {
    let cancelled = false;
    supabase.functions
      .invoke("setup-admin", { body: { action: "status" } })
      .then(({ data }) => {
        if (!cancelled && data && data.admin_exists === false) {
          navigate("/setup-admin", { replace: true });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [navigate]);


  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      fullName: fd.get("fullName"),
      email: fd.get("email"),
      phone: phone.trim(),
      password: fd.get("password"),
      role: selectedRole,
    });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    if (!acceptedTerms) { toast.error("Please accept the Terms of Use and Privacy Policy"); return; }
    if (scorePassword(parsed.data.password) < 2) { toast.error("Please choose a stronger password"); return; }
    if (!phoneVerified) { toast.error("Please verify your phone number first"); return; }

    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: parsed.data.fullName,
          phone: parsed.data.phone,
          role: parsed.data.role,
        },
      },
    });
    if (error) { setLoading(false); toast.error(friendlyError(error.message)); return; }
    if (signUpData.user) {
      await supabase
        .from("profiles")
        .update({ phone: parsed.data.phone, phone_verified: true })
        .eq("id", signUpData.user.id);
    }
    setLoading(false);

    // With email confirmation on, signUp returns no session - the user is NOT signed in yet.
    if (!signUpData.session) {
      setVerifyEmail(parsed.data.email);
      setVerifyOpen(true);
      return;
    }
    // Auto-confirm is enabled: the account is live, go straight in.
    toast.success("Welcome to Makiwa");
    navigate("/dashboard");
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    // Pre-check lockout
    try {
      const { data: check } = await supabase.functions.invoke("login-guard", {
        body: { action: "check", email: parsed.data.email },
      });
      if (check?.locked) {
        setLoading(false);
        const mins = check.locked_until ? Math.max(1, Math.ceil((new Date(check.locked_until).getTime() - Date.now()) / 60000)) : 60;
        setAttemptsLeft(0);
        toast.error(`Account temporarily locked. Try again in about ${mins} minute${mins === 1 ? "" : "s"}.`);
        return;
      }
    } catch {}

    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    if (error) {
      try {
        const { data: fail } = await supabase.functions.invoke("login-guard", {
          body: { action: "fail", email: parsed.data.email },
        });
        setLoading(false);
        if (fail?.locked) {
          setAttemptsLeft(0);
          toast.error("Too many failed attempts. Your account is locked for 1 hour.");
        } else {
          const left = typeof fail?.remaining === "number" ? fail.remaining : null;
          setAttemptsLeft(left);
          toast.error(
            left === null
              ? friendlyError(error.message)
              : `${friendlyError(error.message)} ${left} attempt${left === 1 ? "" : "s"} left.`
          );
        }
      } catch {
        setLoading(false);
        toast.error(friendlyError(error.message));
      }
      return;
    }
    // Correct credentials - clear the lockout counter and the on-screen warning.
    setAttemptsLeft(null);
    try {
      await supabase.functions.invoke("login-guard", {
        body: { action: "success", email: parsed.data.email },
      });
    } catch {}
    setLoading(false);
    toast.success("Welcome back");
    navigate("/dashboard");
  };


  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Visual side */}
      <div className="relative hidden lg:block overflow-hidden bg-neutral-200">
        <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover scale-105" onError={(e) => ((e.currentTarget.style.display = "none"))} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-brand-black/10" />
        <div  />

        <div className="relative z-10 h-full flex flex-col justify-end gap-8 p-10 xl:p-14 text-brand-white">

          <div className="space-y-4 max-w-xl">
            <h2 className="font-serif text-5xl xl:text-5xl leading-[1.05]">
              Where lives are remembered with grace.
            </h2>
            <p className="text-brand-white/80 text-lg leading-relaxed">
              Join hundreds of families honoring the people who shaped them - through stories, candles, and shared memory.
            </p>
          </div>
          <p className="text-xs text-brand-white/60">© Makiwa. Powered by <a href="https://digimatt.co.ke/" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline font-medium">
              Digimatt Solutions
            </a>.</p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-4 sm:p-10 lg:p-14 relative">
        <Link to="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>

        <div className="w-full max-w-md rounded-3xl border border-brand-orange/30 bg-card shadow-elegant p-6 sm:p-8 lg:p-10  ring-brand-orange/10">
          <Link to="/" className="flex flex-col items-center gap-2 mb-4">
            <img src={logoMark} alt="" className="h-14 w-14 object-contain rounded-lg" />
            <img src={logoText} alt="Makiwa" className="h-7 w-auto object-contain" />
          </Link>

          <p className="text-center text-muted-foreground">Sign in to continue, or create your free account.</p>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "create-account")} className="mt-5">
            <TabsList className="grid grid-cols-2 w-full h-11 p-1 bg-muted rounded-xl">
              <TabsTrigger value="login" id="login" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-brand-orange data-[state=active]:shadow-sm">Login</TabsTrigger>
              <TabsTrigger value="create-account" id="create-account" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-brand-orange data-[state=active]:shadow-sm">Create Account</TabsTrigger>


            </TabsList>

            <TabsContent value="login" className="mt-5">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="li-email">Email address</Label>
                  <Input id="li-email" name="email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setAttemptsLeft(null); }} className="h-11 rounded-xl border-2 border-brand-black/15 focus-visible:ring-brand-orange/40" required />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="li-pw">Password</Label>
                    <button
                      type="button"
                      onClick={() => { setForgotEmail(loginEmail); setForgotSent(false); setForgotOpen(true); }}
                      className="text-xs text-brand-orange hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input id="li-pw" name="password" type={showPw ? "text" : "password"} className="h-11 rounded-xl pr-11 border-2 border-brand-black/15 focus-visible:ring-brand-orange/40" required />
                    <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {attemptsLeft !== null && (
                  <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
                    {attemptsLeft === 0
                      ? "Too many failed attempts. Please try again in about an hour."
                      : `Incorrect details. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left before your account is locked for an hour.`}
                  </p>
                )}
                <div className="flex items-center gap-2">

                  <Button type="submit" disabled={loading} className="flex-1 h-12 rounded-lg bg-brand-orange text-brand-white hover:bg-brand-orange/90 shadow-glow text-base font-medium border border-brand-orange/40">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><LogIn className="h-4 w-4 mr-2" />Sign In</>)}
                  </Button>
                  {bioAvailable && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!loginEmail) { toast.error("Enter your email first"); return; }
                        setBioLoading(true);
                        try {
                          await signInWithFingerprint(loginEmail.trim());
                          setAttemptsLeft(null);
                          try {
                            await supabase.functions.invoke("login-guard", {
                              body: { action: "success", email: loginEmail.trim() },
                            });
                          } catch {}
                          toast.success("Signed in with fingerprint");
                          navigate("/dashboard");
                        } catch (err: any) {
                          toast.error(err?.message ? friendlyError(err.message) : "We could not read your fingerprint. Please try again.");
                        } finally {

                          setBioLoading(false);
                        }
                      }}
                      disabled={bioLoading}
                      aria-label="Sign in with fingerprint"
                      title="Sign in with fingerprint"
                      className="h-12 w-12 shrink-0 inline-flex items-center justify-center rounded-lg border-2 border-brand-orange/50 text-brand-orange hover:bg-brand-orange/10 transition-colors disabled:opacity-50"
                    >
                      {bioLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
                    </button>
                  )}
                </div>
              </form>
            </TabsContent>

            <TabsContent value="create-account" className="mt-5">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1">
                  <Label>I am joining as:</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {roleOptions.map(opt => {
                      const Icon = opt.icon;
                      const active = selectedRole === opt.value;

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSelectedRole(opt.value)}
                          className={cn(
                            "flex items-center gap-3 text-left rounded-xl border p-3 transition-all",
                            active
                              ? "border-brand-orange bg-brand-orange/5 ring-2 ring-brand-orange/30"
                              : "border-border hover:border-foreground/30"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5 shrink-0",
                              active ? "text-brand-orange" : "text-muted-foreground"
                            )}
                          />
                          <p className="text-sm font-medium leading-tight">{opt.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="su-name">Full name</Label>
                  <Input id="su-name" name="fullName" placeholder="Your full name" className="h-10 rounded-xl border-brand-orange/30 focus-visible:ring-brand-orange/40" required />
                </div>
                
                  <div className="space-y-1">
                    <Label htmlFor="su-email">Email</Label>
                    <Input id="su-email" name="email" type="email" placeholder="you@example.com" className="h-10 rounded-xl border-brand-orange/30 focus-visible:ring-brand-orange/40" required />
                  </div>
              </div>
               <div className="space-y-1">
                  <Label htmlFor="su-pw">Password</Label>
                  <div className="relative">
                    <Input id="su-pw" name="password" type={showSuPw ? "text" : "password"} minLength={8}
                      value={suPassword} onChange={(e) => setSuPassword(e.target.value)}
                      placeholder="At least 8 characters" className="h-10  rounded-xl pr-11 border-brand-orange/30 focus-visible:ring-brand-orange/40" required />
                    <button type="button" onClick={() => setShowSuPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showSuPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={suPassword} />
                </div>
                  <div className="space-y-1">
                    <Label htmlFor="su-phone">Phone</Label>
                    <div className="flex gap-2">
                      <Input
                        id="su-phone"
                        name="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setOtpSent(false); }}
                        placeholder="2547XX XXX XXX"
                        className="h-10 rounded-xl border-brand-orange/30 focus-visible:ring-brand-orange/40"
                        required
                      />
                      {phoneVerified ? (
                        <span className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl border border-green-500/40 bg-green-500/10 px-2.5 text-xs font-medium text-green-600">
                          <CheckCircle2 className="h-4 w-4" /> Verified
                        </span>
                      ) : (
                        <Button type="button" variant="outline" onClick={sendCode} disabled={otpBusy}
                          className="h-10 shrink-0 rounded-xl border-brand-orange/40 text-brand-orange hover:bg-brand-orange/10 px-3 text-xs">
                          {otpBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : otpSent ? "Resend" : "Send Code"}
                        </Button>
                      )}
                    </div>
                  </div>
                

                {otpSent && !phoneVerified && (
                  <div className="rounded-xl border border-brand-orange/30 bg-brand-orange/5 p-3 space-y-2">
                    <Label htmlFor="su-otp" className="text-xs">Enter the 6-digit code sent to {phone}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="su-otp"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="123456"
                        className="h-10 rounded-xl tracking-[0.4em] text-center border-brand-orange/40"
                      />
                      <Button type="button" onClick={verifyCode} disabled={otpBusy}
                        className="h-10 shrink-0 rounded-xl bg-brand-orange text-brand-white hover:bg-brand-orange/90 px-4 text-xs">
                        {otpBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5 rounded-xl border border-brand-orange/25 bg-brand-orange/5 p-3">
                  <Checkbox id="su-terms" checked={acceptedTerms} onCheckedChange={(v) => setAcceptedTerms(v === true)} className="mt-0.5" />
                  <Label htmlFor="su-terms" className="text-[12px] font-normal leading-relaxed text-muted-foreground">
                    I agree to the{" "}
                    <span className="text-brand-orange font-medium">Terms of Use</span>{" "}
                    and the{" "}
                    <span className="text-brand-orange font-medium">Privacy Policy</span>, and I consent to being contacted about memorials I follow.
                  </Label>
                </div>

                <Button type="submit" disabled={loading || !acceptedTerms} className="w-full h-12 rounded-lg bg-brand-orange text-brand-white hover:bg-brand-orange/90 shadow-glow text-base font-medium border border-brand-orange/40 disabled:opacity-60">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><UserPlus className="h-4 w-4 mr-2" />Create Account</>)}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-3 text-[13px] text-center text-muted-foreground">
            {tab === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setTab(tab === "login" ? "create-account" : "login")}
              className="text-brand-orange hover:underline font-medium"
            >
              {tab === "login" ? "Create Account" : "Sign In"}
            </button>
          </p>

          <p className="mt-2 text-[11px] text-center text-muted-foreground">
            Powered by{" "}
            <a href="https://digimatt.co.ke/" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline font-medium">
              Digimatt Solutions
            </a>
          </p>
        </div>
      </div>
      {/* Email verification prompt shown after a successful sign-up */}
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-brand-orange/30">
          <DialogHeader className="items-center text-center">
            <span className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange/10 text-brand-orange">
              <MailCheck className="h-7 w-7" />
            </span>
            <DialogTitle className="text-xl">Confirm your email</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Your account has been created. We sent a confirmation link to{" "}
              <span className="font-medium text-foreground">{verifyEmail}</span>. Open it to activate your
              account, then come back and log in. Remember to check your spam folder.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full h-11 rounded-lg bg-brand-orange text-brand-white hover:bg-brand-orange/90"
              onClick={() => { setVerifyOpen(false); setTab("login"); }}
            >
              Got it, take me to login
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 rounded-lg border-brand-orange/40 text-brand-orange hover:bg-brand-orange/10"
              onClick={async () => {
                const { error } = await supabase.auth.resend({
                  type: "signup",
                  email: verifyEmail,
                  options: { emailRedirectTo: `${window.location.origin}/dashboard` },
                });
                if (error) toast.error(friendlyError(error.message));
                else toast.success("Confirmation email sent again");
              }}
            >
              Resend the email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Forgot password - request a reset link */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md border-brand-orange/30">
          <div className="flex flex-col items-center gap-2">
            <img src={logoMark} alt="" className="h-12 w-12 object-contain rounded-lg" />
            <img src={logoText} alt="Makiwa" className="h-5 w-auto object-contain" />
          </div>
          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-xl">Reset your password</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {forgotSent
                ? "If an account exists for that email, a reset link is on its way. The link opens a secure page where you can set a new password."
                : "Enter the email you signed up with and we will send you a secure link to set a new password."}
            </DialogDescription>
          </DialogHeader>
          {forgotSent ? (
            <Button
              className="w-full h-11 rounded-lg bg-brand-orange text-brand-white hover:bg-brand-orange/90"
              onClick={() => setForgotOpen(false)}
            >
              Got it
            </Button>
          ) : (
            <form onSubmit={sendResetLink} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="fp-email">Email address</Label>
                <Input
                  id="fp-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 rounded-xl border-2 border-brand-black/15 focus-visible:ring-brand-orange/40"
                  required
                />
              </div>
              <Button type="submit" disabled={forgotBusy} className="w-full h-11 rounded-lg bg-brand-orange text-brand-white hover:bg-brand-orange/90 border border-brand-orange/40">
                {forgotBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><MailCheck className="h-4 w-4 mr-2" />Send reset link</>)}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>

  );
};

export default Auth;
