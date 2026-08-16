// Initiate an M-Pesa STK Push (Lipa na M-Pesa Online) and create a pending donation row.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1);
  if (digits.startsWith("7") && digits.length === 9) return "254" + digits;
  if (digits.startsWith("1") && digits.length === 9) return "254" + digits;
  return null;
}

function pad(n: number) { return n.toString().padStart(2, "0"); }
function timestamp() {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const {
      fundraiser_id, amount, phone, donor_name,
      message, is_anonymous,
    } = await req.json();

    if (!fundraiser_id || !amount || !phone) {
      return json({ error: "fundraiser_id, amount and phone are required" }, 400);
    }
    const amt = Math.round(Number(amount));
    if (!amt || amt <= 0) return json({ error: "invalid amount" }, 400);
    const msisdn = normalizePhone(String(phone));
    if (!msisdn) return json({ error: "Enter a valid Kenyan phone (e.g. 07XXXXXXXX)" }, 400);

    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
    const shortcode = Deno.env.get("MPESA_SHORTCODE");
    const passkey = Deno.env.get("MPESA_PASSKEY");
    const env = (Deno.env.get("MPESA_ENV") || "sandbox").toLowerCase();
    if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
      return json({ error: "M-Pesa credentials are not fully configured" }, 500);
    }
    const base = env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: fund } = await admin.from("fundraisers")
      .select("id,title,memorial_id,is_active,status").eq("id", fundraiser_id).maybeSingle();
    if (!fund) return json({ error: "Fundraiser not found" }, 404);
    if (!fund.is_active) return json({ error: "This fundraiser is not accepting donations." }, 400);
    if (fund.status !== "approved") return json({ error: "This fundraiser is awaiting verification." }, 400);

    // OAuth token
    const tokenRes = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}` },
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      return json({ error: "Could not authenticate with M-Pesa", details: tokenJson }, 502);
    }

    // Capture user if signed in
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const anon = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } },
        );
        const { data } = await anon.auth.getUser();
        if (data.user) userId = data.user.id;
      } catch { /* ignore */ }
    }

    const ts = timestamp();
    const password = btoa(`${shortcode}${passkey}${ts}`);
    const projectId = (Deno.env.get("SUPABASE_URL") || "").replace("https://", "").split(".")[0];
    const callbackUrl = `https://${projectId}.functions.supabase.co/mpesa-callback`;
    const reference = `MKW${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;

    const stkRes = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: ts,
        TransactionType: "CustomerPayBillOnline",
        Amount: amt,
        PartyA: msisdn,
        PartyB: shortcode,
        PhoneNumber: msisdn,
        CallBackURL: callbackUrl,
        AccountReference: reference,
        TransactionDesc: `Donation ${fund.title}`.slice(0, 60),
      }),
    });
    const stkJson = await stkRes.json();
    if (!stkRes.ok || stkJson.ResponseCode !== "0") {
      return json({ error: stkJson.errorMessage || stkJson.ResponseDescription || "STK push failed", details: stkJson }, 400);
    }

    await admin.from("donations").insert({
      fundraiser_id, user_id: userId,
      donor_name: is_anonymous ? null : (donor_name || null),
      donor_phone: msisdn,
      amount: amt,
      message: message || null,
      is_anonymous: !!is_anonymous,
      status: "pending",
      payment_method: "mpesa",
      stripe_session_id: stkJson.CheckoutRequestID,
    });

    return json({
      checkout_request_id: stkJson.CheckoutRequestID,
      merchant_request_id: stkJson.MerchantRequestID,
      customer_message: stkJson.CustomerMessage,
      reference,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
