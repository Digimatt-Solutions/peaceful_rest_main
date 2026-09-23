import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";
import { saveDonationReceipt } from "@/lib/receipts";
import { watchMpesaPayment } from "@/lib/payments";
import { DonationReceipt } from "@/components/dashboard/DonationReceipt";
import mpesaLogo from "@/assets/mpesa-logo.png";
import paystackLogo from "@/assets/paystack-logo.png";

export interface DonateTarget {
  id: string;
  title: string;
  memorial_name?: string;
}

interface Props {
  fundraiser: DonateTarget | null;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
}

export const DonateDialog = ({ fundraiser, onOpenChange, onCompleted }: Props) => {
  const { user } = useAuth();
  const [method, setMethod] = useState<"mpesa" | "paystack">("mpesa");
  const [form, setForm] = useState({ donor_name: "", donor_phone: "", email: "", amount: "", is_anonymous: false });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptDonation, setReceiptDonation] = useState<any>(null);

  // Prefill from the signed-in account so the donor only chooses an amount.
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name,phone,email").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        setForm(f => ({
          ...f,
          donor_name: f.donor_name || data?.full_name || "",
          donor_phone: f.donor_phone || data?.phone || "",
          email: f.email || data?.email || user.email || "",
        }));
      });
  }, [user]);

  if (!fundraiser) return null;

  const finish = async (donationId?: string, amount?: number) => {
    let don: any = null;
    if (donationId) {
      const { data } = await supabase.from("donations").select("*").eq("id", donationId).maybeSingle();
      don = data;
    } else if (user) {
      const { data } = await supabase
        .from("donations").select("*")
        .eq("fundraiser_id", fundraiser.id).eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      don = data;
    }
    const confirmed = don && don.status === "paid";
    if (confirmed) {
      await saveDonationReceipt({
        ...don,
        fundraiser_title: fundraiser.title,
        memorial_name: fundraiser.memorial_name,
      });
    }
    logActivity("donation", {
      entity_type: "fundraiser",
      entity_id: fundraiser.id,
      description: `Contributed KSh ${(amount || Number(form.amount) || 0).toLocaleString()} to ${fundraiser.title}`,
    });
    onCompleted?.();
    if (confirmed) {
      // Show the receipt straight away, only after the payment is confirmed.
      setReceiptDonation({ ...don, fundraiser_title: fundraiser.title, memorial_name: fundraiser.memorial_name });
      setReceiptOpen(true);
      return;
    }
    onOpenChange(false);
  };

  const payMpesa = async () => {
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!form.donor_phone.trim()) return toast.error("Enter your M-Pesa phone number");
    setBusy(true);
    setStatus("Sending the payment request to your phone…");
    const { data, error } = await supabase.functions.invoke("mpesa-initiate", {
      body: {
        fundraiser_id: fundraiser.id, amount: amt, phone: form.donor_phone.trim(),
        donor_name: form.donor_name, is_anonymous: form.is_anonymous,
      },
    });
    if (error || !data?.checkout_request_id) {
      setBusy(false); setStatus("");
      return toast.error(data?.error || error?.message || "Could not start the M-Pesa payment");
    }
    setStatus("Enter your M-Pesa PIN on your phone to complete the payment.");
    toast.success("Check your phone for the M-Pesa prompt");
    watchMpesaPayment(data.checkout_request_id, {
      onResult: (o) => {
        setBusy(false); setStatus("");
        if (!o.paid) return toast.error(o.message || "The payment was not completed");
        toast.success("Payment received. Your receipt has been saved to your account.");
        finish(o.donation_id || undefined, amt);
      },
      onTimeout: () => {
        setBusy(false); setStatus("");
        toast.message("Still waiting on M-Pesa. Your contribution will appear once confirmed.");
      },
    });
  };

  const payPaystack = async () => {
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!form.email.trim()) return toast.error("Enter an email for the receipt");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("paystack-initialize", {
      body: {
        fundraiser_id: fundraiser.id, amount: amt, email: form.email.trim(),
        donor_name: form.donor_name, donor_phone: form.donor_phone,
        is_anonymous: form.is_anonymous,
        callback_url: `${window.location.origin}/dashboard/fundraising`,
      },
    });
    setBusy(false);
    if (error || !data?.authorization_url) {
      return toast.error(data?.error || error?.message || "Could not start the payment");
    }
    window.location.href = data.authorization_url;
  };

  return (
    <>
    <Dialog open={!!fundraiser && !receiptOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Contribute</DialogTitle>
        </DialogHeader>
        <p className="-mt-2 text-sm text-muted-foreground">
          {fundraiser.title}{fundraiser.memorial_name ? ` · in memory of ${fundraiser.memorial_name}` : ""}
        </p>

        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Payment method</Label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {[
                { id: "mpesa" as const, label: "M-PESA", logo: mpesaLogo, sub: "Prompt to your phone" },
                { id: "paystack" as const, label: "Paystack", logo: paystackLogo, sub: "Card / bank" },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${method === m.id ? "border-brand-orange bg-brand-orange/5" : "border-border hover:border-brand-orange/40"}`}
                >
                  <img src={m.logo} alt={m.label} className="h-7 w-auto object-contain" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">{m.label}</p>
                    <p className="text-[10px] text-muted-foreground">{m.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Your name</Label>
              <Input value={form.donor_name} disabled={form.is_anonymous}
                onChange={(e) => setForm({ ...form, donor_name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>{method === "mpesa" ? "M-Pesa phone (07XXXXXXXX)" : "Phone"}</Label>
              <Input type="tel" value={form.donor_phone}
                onChange={(e) => setForm({ ...form, donor_phone: e.target.value })} className="rounded-xl" />
            </div>
            {method === "paystack" && (
              <div className="space-y-2 sm:col-span-2">
                <Label>Email <span className="font-normal text-muted-foreground">(for the receipt)</span></Label>
                <Input type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
              </div>
            )}
            <div className="space-y-2 sm:col-span-2">
              <Label>Amount (KSh)</Label>
              <Input type="number" min="1" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} className="rounded-xl" />
            </div>
            <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_anonymous}
                onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })} />
              Contribute anonymously
            </label>
          </div>

          {status && (
            <div className="rounded-lg border border-brand-orange/30 bg-brand-orange/5 px-3 py-2 text-xs text-foreground/80">{status}</div>
          )}

          <Button
            onClick={() => (method === "mpesa" ? payMpesa() : payPaystack())}
            disabled={busy}
            className="w-full rounded-xl bg-brand-orange text-white hover:bg-brand-orange/90 h-12"
          >
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
              : `Pay ${form.amount ? `KSh ${Number(form.amount).toLocaleString()}` : ""} via ${method === "mpesa" ? "M-PESA" : "Paystack"}`}
          </Button>
          <p className="text-xs text-muted-foreground">
            Payments are handled securely by {method === "mpesa" ? "Safaricom M-PESA" : "Paystack"}. A receipt is saved to your account.
          </p>
        </div>
      </DialogContent>
    </Dialog>
    <DonationReceipt
      open={receiptOpen}
      onOpenChange={(o) => { setReceiptOpen(o); if (!o) onOpenChange(false); }}
      donation={receiptDonation}
    />
    </>
  );
};
