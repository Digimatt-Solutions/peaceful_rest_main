// Release collected funds to a fundraiser organiser's M-Pesa number via Daraja B2C.
// Super admin only. Falls back to "manual" mode when B2C credentials are not configured.
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
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1);
  if ((digits.startsWith("7") || digits.startsWith("1")) && digits.length === 9) return "254" + digits;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await anon.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: roleRow } = await admin.from("user_roles")
      .select("role").eq("user_id", user.id).eq("role", "super_admin").maybeSingle();
    if (!roleRow) return json({ error: "Only a super admin can release funds" }, 403);

    const { fundraiser_id, amount } = await req.json();
    if (!fundraiser_id) return json({ error: "fundraiser_id is required" }, 400);

    const { data: fund } = await admin.from("fundraisers")
      .select("id,title,status,payout_phone,organiser_name,raised_amount,paid_out_amount")
      .eq("id", fundraiser_id).maybeSingle();
    if (!fund) return json({ error: "Fundraiser not found" }, 404);
    if (fund.status !== "approved") return json({ error: "Fundraiser is not approved" }, 400);

    const msisdn = normalizePhone(fund.payout_phone || "");
    if (!msisdn) return json({ error: "This fundraiser has no valid payout phone number" }, 400);

    const available = Number(fund.raised_amount || 0) - Number(fund.paid_out_amount || 0);
    const amt = Math.floor(Number(amount ?? available));
    if (!amt || amt <= 0) return json({ error: "Nothing available to pay out" }, 400);
    if (amt > available) return json({ error: `Only KSh ${available.toLocaleString()} is available` }, 400);

    const { data: payout, error: payErr } = await admin.from("payouts").insert({
      fundraiser_id, amount: amt, phone: msisdn,
      recipient_name: fund.organiser_name || null,
      status: "queued", requested_by: user.id,
    }).select().maybeSingle();
    if (payErr || !payout) return json({ error: payErr?.message || "Could not queue payout" }, 500);

    const initiator = Deno.env.get("MPESA_INITIATOR_NAME");
    const securityCredential = Deno.env.get("MPESA_SECURITY_CREDENTIAL");
    const b2cShortcode = Deno.env.get("MPESA_B2C_SHORTCODE") || Deno.env.get("MPESA_SHORTCODE");
    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");

    // Manual mode - credentials for B2C not configured yet.
    if (!initiator || !securityCredential || !b2cShortcode || !consumerKey || !consumerSecret) {
      await admin.from("payouts").update({
        status: "manual",
        method: "manual",
        error: "B2C credentials not configured - send manually and mark as paid",
      }).eq("id", payout.id);
      return json({
        mode: "manual",
        payout_id: payout.id,
        message: "Payout queued for manual sending. Add B2C credentials to automate this.",
      });
    }

    const env = (Deno.env.get("MPESA_ENV") || "sandbox").toLowerCase();
    const base = env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

    const tokenRes = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}` },
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      await admin.from("payouts").update({ status: "failed", error: "M-Pesa auth failed" }).eq("id", payout.id);
      return json({ error: "Could not authenticate with M-Pesa" }, 502);
    }

    const projectId = (Deno.env.get("SUPABASE_URL") || "").replace("https://", "").split(".")[0];
    const resultUrl = `https://${projectId}.functions.supabase.co/mpesa-b2c-result`;

    const b2cRes = await fetch(`${base}/mpesa/b2c/v1/paymentrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        InitiatorName: initiator,
        SecurityCredential: securityCredential,
        CommandID: "BusinessPayment",
        Amount: amt,
        PartyA: b2cShortcode,
        PartyB: msisdn,
        Remarks: `Makiwa payout: ${String(fund.title).slice(0, 40)}`,
        QueueTimeOutURL: resultUrl,
        ResultURL: resultUrl,
        Occasion: payout.id,
      }),
    });
    const b2cJson = await b2cRes.json();

    if (!b2cRes.ok || b2cJson.ResponseCode !== "0") {
      const msg = b2cJson.errorMessage || b2cJson.ResponseDescription || "B2C request failed";
      await admin.from("payouts").update({ status: "failed", error: msg }).eq("id", payout.id);
      return json({ error: msg, details: b2cJson }, 400);
    }

    await admin.from("payouts").update({
      status: "processing",
      conversation_id: b2cJson.ConversationID || b2cJson.OriginatorConversationID || null,
    }).eq("id", payout.id);

    return json({ mode: "b2c", payout_id: payout.id, conversation_id: b2cJson.ConversationID });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
