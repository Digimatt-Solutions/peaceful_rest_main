import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle, Banknote } from "lucide-react";
import { toast } from "sonner";

interface Bank { name: string; code: string; slug?: string }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  memorialId: string;
  memorialName?: string;
  onSaved: (bankAccount: any) => void;
}

export const BankAccountDialog = ({ open, onOpenChange, memorialId, memorialName, onSaved }: Props) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingBanks(true);
    supabase.functions.invoke("paystack-banks", { body: {} }).then(({ data, error }) => {
      setLoadingBanks(false);
      if (error || !data?.banks) { toast.error(data?.error || "Could not load banks"); return; }
      setBanks(data.banks);
    });
  }, [open]);

  useEffect(() => {
    setResolvedName(null); setResolveError(null); setConfirmed(false);
    if (!bankCode || accountNumber.length < 6) return;
    const t = setTimeout(async () => {
      setResolving(true);
      const { data, error } = await supabase.functions.invoke("paystack-resolve-account", {
        body: { account_number: accountNumber, bank_code: bankCode },
      });
      setResolving(false);
      if (error) { setResolveError(error.message); return; }
      if (data?.resolved) setResolvedName(data.account_name);
      else setResolveError(data?.error || "Could not verify account");
    }, 600);
    return () => clearTimeout(t);
  }, [accountNumber, bankCode]);

  const save = async () => {
    if (!resolvedName || !confirmed) return toast.error("Please verify and confirm the account holder name");
    const bank = banks.find(b => b.code === bankCode);
    if (!bank) return;
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("paystack-create-subaccount", {
      body: {
        memorial_id: memorialId,
        account_number: accountNumber,
        bank_code: bankCode,
        bank_name: bank.name,
        account_name: resolvedName,
      },
    });
    setSaving(false);
    if (error || !data?.bank_account) return toast.error(data?.error || error?.message || "Failed to save");
    toast.success("Payout account saved");
    onSaved(data.bank_account);
    onOpenChange(false);
    // reset
    setBankCode(""); setAccountNumber(""); setResolvedName(null); setConfirmed(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl flex items-center gap-2">
            <Banknote className="h-5 w-5 text-brand-orange" /> Payout bank account
          </DialogTitle>
          <DialogDescription>
            All donations to {memorialName ? <span className="font-medium text-foreground">{memorialName}</span> : "this memorial"} will settle directly to this bank account via Paystack. A small platform fee is deducted per transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Country</Label>
            <Input value="Kenya" disabled />
          </div>

          <div className="space-y-2">
            <Label>Bank</Label>
            <Select value={bankCode} onValueChange={setBankCode} disabled={loadingBanks}>
              <SelectTrigger><SelectValue placeholder={loadingBanks ? "Loading banks…" : "Select bank"} /></SelectTrigger>
              <SelectContent className="max-h-72">
                {banks.map(b => <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Account number</Label>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 0123456789"
              inputMode="numeric"
            />
          </div>

          {(resolving || resolvedName || resolveError) && (
            <div className={`rounded-xl border p-3 text-sm flex items-start gap-2.5 ${
              resolvedName ? "border-emerald-200 bg-emerald-50 text-emerald-900" :
              resolveError ? "border-amber-200 bg-amber-50 text-amber-900" :
              "border-border bg-muted/30 text-muted-foreground"
            }`}>
              {resolving ? <Loader2 className="h-4 w-4 mt-0.5 animate-spin" /> :
                resolvedName ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> :
                <AlertCircle className="h-4 w-4 mt-0.5" />}
              <div className="flex-1">
                {resolving && "Verifying account with the bank…"}
                {resolvedName && (
                  <>
                    <p className="font-medium">Account holder: {resolvedName}</p>
                    <label className="mt-2 flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                      I confirm this is the correct account for payouts.
                    </label>
                  </>
                )}
                {resolveError && <p>{resolveError}</p>}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-brand-orange" />
            <span>Bank details are stored securely and only used by Paystack to settle donations. You can update or remove this account at any time.</span>
          </div>

          <Button
            onClick={save}
            disabled={saving || !resolvedName || !confirmed}
            className="w-full rounded-full bg-brand-orange text-white hover:bg-brand-orange/90 h-11"
          >
            {saving ? "Saving…" : "Save payout account"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
