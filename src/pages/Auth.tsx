import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Heart, ShieldCheck, Eye, EyeOff, LogIn, UserPlus, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/auth.png";
import logoMark from "@/assets/makiwa-mark.png";
import logoText from "@/assets/makiwa-logo-black.png";
import { isWebAuthnSupported, signInWithFingerprint } from "@/lib/webauthn";

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(30).optional(),
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
    label: "Mourner / Participant",
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
  const [showPw, setShowPw] = useState(false);
  const [showSuPw, setShowSuPw] = useState(false);
  const bioAvailable = typeof window !== "undefined" && isWebAuthnSupported();

  useEffect(() => {
    document.title = "Sign In · Makiwa";
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      fullName: fd.get("fullName"),
      email: fd.get("email"),
      phone: fd.get("phone") || undefined,
      password: fd.get("password"),
      role: selectedRole,
    });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
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
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome to Makiwa");
    navigate("/dashboard");
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
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
      <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14 relative">
        <Link to="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>

        <div className="w-full max-w-md rounded-3xl border-2 border-brand-orange/80 bg-card shadow-elegant p-6 sm:p-8 lg:p-10 ring-1 ring-brand-orange/10">
          <Link to="/" className="flex flex-col items-center gap-2 mb-4">
            <img src={logoMark} alt="" className="h-14 w-14 object-contain rounded-lg" />
            <img src={logoText} alt="Makiwa" className="h-7 w-auto object-contain" />
          </Link>

          <p className="text-center text-muted-foreground">Sign in to continue, or create your free account.</p>

          <Tabs defaultValue="login" className="mt-5">
            <TabsList className="grid grid-cols-2 w-full h-10 p-1 bg-muted rounded-10">
              <TabsTrigger value="login" className="rounded-20 data-[state=active]:bg-background data-[state=active]:shadow-sm">Login</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-20 data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-5">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="li-email">Email address</Label>
                  <Input id="li-email" name="email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="h-11 rounded-xl border-2 border-brand-black/15 focus-visible:ring-brand-orange/40" required />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="li-pw">Password</Label>
                    <button type="button" className="text-xs text-brand-orange hover:underline">Forgot Password?</button>
                  </div>
                  <div className="relative">
                    <Input id="li-pw" name="password" type={showPw ? "text" : "password"} className="h-11 rounded-xl pr-11 border-2 border-brand-black/15 focus-visible:ring-brand-orange/40" required />
                    <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={loading} className="flex-1 h-12 rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90 shadow-glow text-base font-medium border border-brand-orange/40">
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
                          toast.success("Signed in with fingerprint");
                          navigate("/dashboard");
                        } catch (err: any) {
                          toast.error(err.message || "Fingerprint sign-in failed");
                        } finally {
                          setBioLoading(false);
                        }
                      }}
                      disabled={bioLoading}
                      aria-label="Sign in with fingerprint"
                      title="Sign in with fingerprint"
                      className="h-12 w-12 shrink-0 inline-flex items-center justify-center rounded-full border-2 border-brand-orange/50 text-brand-orange hover:bg-brand-orange/10 transition-colors disabled:opacity-50"
                    >
                      {bioLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
                    </button>
                  )}
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1">
                  <Label>I am joining as</Label>
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
                            "text-left rounded-2xl border p-4 transition-all",
                            active
                              ? "border-brand-orange bg-brand-orange/5 ring-2 ring-brand-orange/30"
                              : "border-border hover:border-foreground/30"
                          )}
                        >
                          <Icon className={cn("h-5 w-5 mb-2", active ? "text-brand-orange" : "text-muted-foreground")} />
                          <p className="text-sm font-medium leading-tight">{opt.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="su-name">Full name</Label>
                  <Input id="su-name" name="fullName" placeholder="Your full name" className="h-10 rounded-xl border-brand-orange/30 focus-visible:ring-brand-orange/40" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="su-email">Email</Label>
                    <Input id="su-email" name="email" type="email" placeholder="you@example.com" className="h-10 rounded-xl border-brand-orange/30 focus-visible:ring-brand-orange/40" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="su-phone">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input id="su-phone" name="phone" type="tel" className="h-10 rounded-xl border-brand-orange/30 focus-visible:ring-brand-orange/40" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="su-pw">Password</Label>
                  <div className="relative">
                    <Input id="su-pw" name="password" type={showSuPw ? "text" : "password"} minLength={8} placeholder="At least 8 characters" className="h-10  rounded-xl pr-11 border-brand-orange/30 focus-visible:ring-brand-orange/40" required />
                    <button type="button" onClick={() => setShowSuPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showSuPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90 shadow-glow text-base font-medium border border-brand-orange/40">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><UserPlus className="h-4 w-4 mr-2" />Create Account</>)}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-5 text-xs text-center text-muted-foreground leading-relaxed">
            By continuing you agree to our <a className="underline hover:text-foreground" href="#">Terms</a> and <a className="underline hover:text-foreground" href="#">Privacy Policy</a>.
          </p>

          <p className="mt-2 text-[11px] text-center text-muted-foreground">
            Powered by{" "}
            <a href="https://digimatt.co.ke/" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline font-medium">
              Digimatt Solutions
            </a>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Auth;
