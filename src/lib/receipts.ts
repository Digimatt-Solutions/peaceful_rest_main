import { supabase } from "@/integrations/supabase/client";
import { buildReceiptHTML } from "@/components/dashboard/DonationReceipt";

export interface ReceiptSource {
  id: string;
  amount: number;
  donor_name?: string | null;
  donor_phone?: string | null;
  is_anonymous?: boolean;
  message?: string | null;
  created_at: string;
  fundraiser_title?: string;
  memorial_name?: string;
  status?: string;
  payment_method?: string | null;
}

export const receiptNumber = (donationId: string) => `MKW-${donationId.slice(0, 8).toUpperCase()}`;

/**
 * Builds the POS-style receipt for a donation and stores it against the
 * signed-in donor's account so they can retrieve it at any time.
 * Silently does nothing for guests who are not signed in.
 */
export const saveDonationReceipt = async (donation: ReceiptSource) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: existing } = await supabase
      .from("donation_receipts")
      .select("id")
      .eq("donation_id", donation.id)
      .maybeSingle();
    if (existing) return existing.id;

    const { data, error } = await supabase
      .from("donation_receipts")
      .insert({
        donation_id: donation.id,
        user_id: user.id,
        receipt_no: receiptNumber(donation.id),
        amount: Number(donation.amount) || 0,
        fundraiser_title: donation.fundraiser_title || null,
        memorial_name: donation.memorial_name || null,
        html: buildReceiptHTML(donation),
      })
      .select("id")
      .maybeSingle();
    if (error) return null;
    return data?.id ?? null;
  } catch {
    return null;
  }
};
