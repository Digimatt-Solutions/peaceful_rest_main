// Initialize a Paystack transaction with subaccount split and create a pending donation row.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const {
      fundraiser_id, amount, email, donor_name, donor_phone,
      message, is_anonymous, callback_url,
    } = await req.json();

    if (!fundraiser_id || !amount || !email) {
      return json({ error: "fundraiser_id, amount and email are required" }, 400);
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) return json({ error: "invalid amount" }, 400);

    const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!secret) return json({ error: "PAYSTACK_SECRET_KEY not configured" }, 500);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: fund, error: fErr } = await admin
      .from("fundraisers")
      .select("id,title,memorial_id,bank_account_id,status")
      .eq("id", fundraiser_id)
      .maybeSingle();
    if (fErr || !fund) return json({ error: "Fundraiser not found" }, 404);
    if (fund.status !== "active") return json({ error: "This fundraiser is not currently accepting donations." }, 400);
    if (!fund.bank_account_id) return json({ error: "This fundraiser has no payout account configured yet." }, 400);

    const { data: bank } = await admin
      .from("memorial_bank_accounts")
      .select("paystack_subaccount_code,is_active")
      .eq("id", fund.bank_account_id)
      .maybeSingle();
    if (!bank?.paystack_subaccount_code || !bank.is_active) {
      return json({ error: "Payout account is not active." }, 400);
    }

    // Platform fee
    const { data: settings } = await admin
      .from("platform_settings")
      .select("platform_fee_percent")
      .limit(1)
      .maybeSingle();
    const feePct = Number(settings?.platform_fee_percent ?? 5);
    const platformFee = Math.round(amt * feePct) / 100; // in KES
    const transactionChargeKobo = Math.round(platformFee * 100); // in cents/kobo

    // capture user if signed in
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const anon = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data } = await anon.auth.getUser();
        if (data.user) userId = data.user.id;
      } catch {}
    }

    const reference = `MKW_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;

    const psRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amt * 100),
        currency: "KES",
        reference,
        callback_url: callback_url || undefined,
        subaccount: bank.paystack_subaccount_code,
        bearer: "account",
        transaction_charge: transactionChargeKobo,
        metadata: {
          fundraiser_id, memorial_id: fund.memorial_id,
          donor_name: is_anonymous ? "" : (donor_name || ""),
          is_anonymous: !!is_anonymous,
          message: message || "",
          user_id: userId || "",
          platform_fee: platformFee,
        },
      }),
    });
    const psJson = await psRes.json();
    if (!psRes.ok || !psJson.status) {
      return json({ error: psJson.message || "Paystack init failed" }, 400);
    }

    await admin.from("donations").insert({
      fundraiser_id, user_id: userId,
      donor_name: is_anonymous ? null : (donor_name || null),
      donor_phone: donor_phone || null,
      amount: amt,
      message: message || null,
      is_anonymous: !!is_anonymous,
      status: "pending",
      stripe_session_id: reference,
      platform_fee_amount: platformFee,
      subaccount_amount: amt - platformFee,
    });

    return json({
      authorization_url: psJson.data.authorization_url,
      reference: psJson.data.reference,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
