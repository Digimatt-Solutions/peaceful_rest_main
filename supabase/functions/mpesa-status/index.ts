// Poll M-Pesa for the status of a CheckoutRequestID. Used as a fallback when the
// async callback is delayed (common in sandbox).
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function pad(n: number) { return n.toString().padStart(2, "0"); }
function timestamp() {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { checkout_request_id } = await req.json();
    if (!checkout_request_id) return json({ error: "checkout_request_id required" }, 400);

    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY")!;
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET")!;
    const shortcode = Deno.env.get("MPESA_SHORTCODE")!;
    const passkey = Deno.env.get("MPESA_PASSKEY")!;
    const env = (Deno.env.get("MPESA_ENV") || "sandbox").toLowerCase();
    const base = env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

    const tokenRes = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}` },
    });
    const tokenJson = await tokenRes.json();
    if (!tokenJson.access_token) return json({ error: "Auth failed" }, 502);

    const ts = timestamp();
    const password = btoa(`${shortcode}${passkey}${ts}`);
    const qRes = await fetch(`${base}/mpesa/stkpushquery/v1/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenJson.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: shortcode, Password: password, Timestamp: ts,
        CheckoutRequestID: checkout_request_id,
      }),
    });
    const qJson = await qRes.json();
    const paid = qJson.ResultCode === "0";
    const pending = qJson.errorCode === "500.001.1001"; // still processing

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: donation } = await admin.from("donations")
      .select("id, fundraiser_id, amount, status")
      .eq("stripe_session_id", checkout_request_id).maybeSingle();

    if (donation) {
      if (paid && donation.status !== "paid") {
        await admin.from("donations").update({ status: "paid" }).eq("id", donation.id);
        const { data: fund } = await admin.from("fundraisers").select("raised_amount").eq("id", donation.fundraiser_id).maybeSingle();
        if (fund) {
          await admin.from("fundraisers")
            .update({ raised_amount: Number(fund.raised_amount || 0) + Number(donation.amount) })
            .eq("id", donation.fundraiser_id);
        }
      } else if (!pending && !paid && donation.status === "pending" && qJson.ResultCode) {
        await admin.from("donations").update({ status: "failed" }).eq("id", donation.id);
      }
    }

    return json({ paid, pending, result_code: qJson.ResultCode, result_desc: qJson.ResultDesc || qJson.errorMessage });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
