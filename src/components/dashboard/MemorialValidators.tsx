import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ShieldCheck, Trash2, Clock, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";

type Validator = {
  id: string;
  full_name: string;
  phone: string;
  otp_verified: boolean;
  verified_at: string | null;
  confirmed_deceased: boolean;
  confirmed_good_faith: boolean;
  confirmed_at: string | null;
};

const normalize = (raw: string) => {
  let n = (raw || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (n.startsWith("0")) n = "254" + n.slice(1);
  else if (n.startsWith("7") || n.startsWith("1")) n = "254" + n;
  return n;
};

export const MemorialValidators = ({
  memorialId,
  memorialName,
  verificationStatus,
  onStatusChange,
  draftMode = false,
  onDraftChange,
}: {
  memorialId?: string;
  memorialName: string;
  verificationStatus: string;
  onStatusChange?: (status: string, isPublic: boolean) => void;
  /** Used before the memorial exists: validators are held in memory and saved with it. */
  draftMode?: boolean;
  onDraftChange?: (rows: Validator[]) => void;
}) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Validator[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, { d: boolean; g: boolean }>>({});

  const load = async () => {
    if (draftMode || !memorialId) return;
    const { data } = await supabase
      .from("memorial_validators")
      .select("*")
      .eq("memorial_id", memorialId)
      .order("created_at");
    setRows((data as Validator[]) || []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [memorialId, draftMode]);
  useEffect(() => { if (draftMode) onDraftChange?.(rows); /* eslint-disable-next-line */ }, [rows, draftMode]);

  const patchDraft = (id: string, patch: Partial<Validator>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const confirmedCount = rows.filter(r => r.otp_verified && r.confirmed_deceased && r.confirmed_good_faith).length;
  const ready = confirmedCount >= 2;

  const add = async () => {
    const n = name.trim();
    const p = normalize(phone);
    if (n.length < 3) return toast.error("Enter the validator's full name");
    if (p.length < 10) return toast.error("Enter a valid phone number");
    if (rows.some(r => r.phone === p)) return toast.error("This phone number is already used by another validator");
    if (draftMode) {
      setRows(rs => [...rs, {
        id: `draft-${Date.now()}`, full_name: n, phone: p, otp_verified: false, verified_at: null,
        confirmed_deceased: false, confirmed_good_faith: false, confirmed_at: null,
      }]);
      setName(""); setPhone("");
      return;
    }
    setBusy("add");
    const { error } = await supabase.from("memorial_validators").insert({
      memorial_id: memorialId, full_name: n, phone: p, created_by: user?.id ?? null,
    });
    setBusy(null);
    if (error) return toast.error(error.message.includes("duplicate") ? "This phone number is already used by another validator" : error.message);
    setName(""); setPhone("");
    load();
  };

  const sendCode = async (v: Validator) => {
    setBusy(v.id);
    const { data, error } = await supabase.functions.invoke("phone-otp", { body: { action: "send", phone: v.phone } });
    setBusy(null);
    if (error || data?.error) return toast.error(data?.error || "We couldn't send the code. Please try again.");
    toast.success(`Code sent to ${v.phone}`);
  };

  const verifyCode = async (v: Validator) => {
    const code = (codes[v.id] || "").trim();
    if (!/^\d{6}$/.test(code)) return toast.error("Enter the 6-digit code");
    setBusy(v.id);
    const { data, error } = await supabase.functions.invoke("phone-otp", { body: { action: "verify", phone: v.phone, code } });
    if (error || data?.error) { setBusy(null); return toast.error(data?.error || "That code did not match"); }
    const verifiedAt = new Date().toISOString();
    if (draftMode) patchDraft(v.id, { otp_verified: true, verified_at: verifiedAt });
    else await supabase.from("memorial_validators")
      .update({ otp_verified: true, verified_at: verifiedAt })
      .eq("id", v.id);
    setBusy(null);
    setCodes(c => ({ ...c, [v.id]: "" }));
    toast.success(`${v.full_name} verified`);
    if (!draftMode) load();
  };

  const confirm = async (v: Validator) => {
    const c = checks[v.id] || { d: false, g: false };
    if (!c.d || !c.g) return toast.error("Both confirmations are required");
    setBusy(v.id);
    const confirmedAt = new Date().toISOString();
    if (draftMode) patchDraft(v.id, { confirmed_deceased: true, confirmed_good_faith: true, confirmed_at: confirmedAt });
    else await supabase.from("memorial_validators")
      .update({ confirmed_deceased: true, confirmed_good_faith: true, confirmed_at: confirmedAt })
      .eq("id", v.id);
    setBusy(null);
    toast.success("Confirmation recorded");
    if (!draftMode) load();
  };

  const remove = async (v: Validator) => {
    if (draftMode) return setRows(rs => rs.filter(r => r.id !== v.id));
    await supabase.from("memorial_validators").delete().eq("id", v.id);
    load();
  };

  const sendForReview = async () => {
    setBusy("review");
    const { error } = await supabase.from("memorials")
      .update({ verification_status: "pending_review", is_public: false })
      .eq("id", memorialId);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Sent for admin review", { description: "Our team will check the details and get back to you." });
    onStatusChange?.("pending_review", false);
  };

  const publish = async () => {
    if (!ready) return;
    setBusy("publish");
    const { error } = await supabase.from("memorials")
      .update({ verification_status: "verified", is_public: true })
      .eq("id", memorialId);
    setBusy(null);
    if (error) return toast.error(error.message);
    logActivity("memorial_update", {
      entity_type: "memorial", entity_id: memorialId,
      description: `Published ${memorialName} after validator verification`,
    });
    toast.success("Memorial published", { description: "Two validators confirmed this record." });
    onStatusChange?.("verified", true);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-7 space-y-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-orange/15 text-brand-orange inline-flex items-center justify-center">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-serif text-xl">Validators</h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Two people who knew {memorialName || "the deceased"} must verify their phone number and confirm this record
            before the memorial can go public. {confirmedCount} of 2 completed.
          </p>
        </div>
      </div>

      {verificationStatus === "verified" ? (
        <p className="inline-flex items-center gap-2 rounded-xl bg-brand-orange/10 text-brand-orange px-4 py-2 text-sm">
          <BadgeCheck className="h-4 w-4" /> Verified and published
        </p>
      ) : verificationStatus === "pending_review" ? (
        <p className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" /> Pending admin review — our team will be in touch.
        </p>
      ) : null}

      <div className="space-y-4">
        {rows.map((v) => {
          const done = v.otp_verified && v.confirmed_deceased && v.confirmed_good_faith;
          const c = checks[v.id] || { d: false, g: false };
          return (
            <div key={v.id} className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{v.full_name}</p>
                  <p className="text-xs text-muted-foreground">{v.phone}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs rounded-full px-2.5 py-1 ${done ? "bg-brand-orange/10 text-brand-orange" : v.otp_verified ? "bg-muted text-foreground" : "bg-muted text-muted-foreground"}`}>
                    {done ? "Confirmed" : v.otp_verified ? "Awaiting confirmation" : "Not verified"}
                  </span>
                  {!done && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove(v)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {!v.otp_verified && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" className="rounded-full" disabled={busy === v.id} onClick={() => sendCode(v)}>
                    {busy === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
                  </Button>
                  <Input
                    inputMode="numeric" maxLength={6} placeholder="6-digit code"
                    value={codes[v.id] || ""}
                    onChange={(e) => setCodes(s => ({ ...s, [v.id]: e.target.value.replace(/\D/g, "") }))}
                    className="sm:max-w-[160px]"
                  />
                  <Button type="button" className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90" disabled={busy === v.id} onClick={() => verifyCode(v)}>
                    Verify
                  </Button>
                </div>
              )}

              {v.otp_verified && !done && (
                <div className="space-y-2">
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox checked={c.d} onCheckedChange={(x) => setChecks(s => ({ ...s, [v.id]: { ...c, d: !!x } }))} />
                    <span>I confirm that {memorialName || "this person"} has genuinely passed away.</span>
                  </label>
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox checked={c.g} onCheckedChange={(x) => setChecks(s => ({ ...s, [v.id]: { ...c, g: !!x } }))} />
                    <span>I confirm the information on this memorial is given in good faith.</span>
                  </label>
                  <Button type="button" size="sm" className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90" disabled={busy === v.id} onClick={() => confirm(v)}>
                    Record confirmation
                  </Button>
                </div>
              )}

              {done && v.confirmed_at && (
                <p className="text-xs text-muted-foreground">Confirmed on {new Date(v.confirmed_at).toLocaleString()}</p>
              )}
            </div>
          );
        })}
      </div>

      {verificationStatus !== "verified" && (
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div className="space-y-2"><Label>Validator name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></div>
          <div className="space-y-2"><Label>Phone number</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07xx xxx xxx" /></div>
          <Button type="button" variant="outline" className="rounded-full" disabled={busy === "add"} onClick={add}>
            {busy === "add" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add validator"}
          </Button>
        </div>
      )}

      {draftMode && (
        <p className={`rounded-xl px-4 py-2 text-sm ${ready ? "bg-brand-orange/10 text-brand-orange" : "bg-muted text-muted-foreground"}`}>
          {ready
            ? "Both validators are confirmed — you can now create this memorial."
            : "Two confirmed validators are required before this memorial can be created."}
        </p>
      )}

      {!draftMode && verificationStatus !== "verified" && (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" disabled={!ready || busy === "publish"} onClick={publish}
            className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90">
            {busy === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish memorial"}
          </Button>
          {!ready && verificationStatus !== "pending_review" && (
            <Button type="button" variant="outline" className="rounded-full" onClick={sendForReview}>
              Send for admin review
            </Button>
          )}
          {!ready && (
            <span className="text-xs text-muted-foreground">
              Two confirmed validators are needed before this memorial can go public.
            </span>
          )}
        </div>
      )}
    </section>
  );
};
