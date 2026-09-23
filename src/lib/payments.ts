import { supabase } from "@/integrations/supabase/client";

/**
 * Shared payment-result helpers so M-Pesa and Paystack contributions settle
 * in the same session: no page refresh, instant success / failure feedback.
 */

export interface PaymentOutcome {
  paid: boolean;
  donation_id?: string | null;
  message?: string;
}

/** Reads (and clears) a Paystack reference from the current URL. */
export const takePaystackReference = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  const reference = params.get("reference") || params.get("trxref");
  if (!reference) return null;
  const url = new URL(window.location.href);
  url.searchParams.delete("reference");
  url.searchParams.delete("trxref");
  window.history.replaceState({}, "", url.toString());
  return reference;
};

/** Verifies a Paystack transaction and reports the outcome. */
export const verifyPaystack = async (reference: string): Promise<PaymentOutcome> => {
  const { data, error } = await supabase.functions.invoke("paystack-verify", { body: { reference } });
  if (error) return { paid: false, message: "We could not confirm the payment. Please try again." };
  if (data?.paid) return { paid: true, donation_id: data.donation_id, message: "Payment received. Thank you!" };
  return { paid: false, donation_id: data?.donation_id, message: "The payment was cancelled or did not go through." };
};

/**
 * Watches an M-Pesa STK Push until it is paid, fails, or times out.
 * Listens for the live database update and polls Safaricom as a fallback,
 * so the result appears as soon as the customer finishes on their phone.
 */
export const watchMpesaPayment = (
  checkoutRequestId: string,
  handlers: { onResult: (o: PaymentOutcome) => void; onTimeout?: () => void },
) => {
  let settled = false;
  const finish = (outcome: PaymentOutcome) => {
    if (settled) return;
    settled = true;
    supabase.removeChannel(channel);
    handlers.onResult(outcome);
  };

  const channel = supabase
    .channel(`mpesa-${checkoutRequestId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "donations", filter: `stripe_session_id=eq.${checkoutRequestId}` },
      (payload) => {
        const row: any = payload.new;
        if (row?.status === "paid") finish({ paid: true, donation_id: row.id, message: "Payment received. Thank you!" });
        else if (row?.status === "failed") finish({ paid: false, donation_id: row.id, message: "The payment was cancelled or declined." });
      },
    )
    .subscribe();

  let attempts = 0;
  const poll = async () => {
    if (settled) return;
    attempts++;
    const { data: s } = await supabase.functions.invoke("mpesa-status", { body: { checkout_request_id: checkoutRequestId } });
    if (settled) return;
    if (s?.paid) return finish({ paid: true, donation_id: s.donation_id, message: "Payment received. Thank you!" });
    if (s && !s.pending && s.result_code) {
      return finish({ paid: false, donation_id: s.donation_id, message: s.result_desc || "The payment was cancelled or declined." });
    }
    if (attempts >= 40) {
      settled = true;
      supabase.removeChannel(channel);
      handlers.onTimeout?.();
      return;
    }
    setTimeout(poll, 3000);
  };
  setTimeout(poll, 4000);

  return () => {
    settled = true;
    supabase.removeChannel(channel);
  };
};
