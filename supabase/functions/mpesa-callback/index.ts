// Safaricom Daraja calls this URL after an STK Push completes (success or failure).
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const cb = body?.Body?.stkCallback;
    if (!cb) return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Ignored" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const checkoutId = cb.CheckoutRequestID;
    const resultCode = cb.ResultCode;
    const paid = resultCode === 0;

    const { data: donation } = await admin.from("donations")
      .select("id, fundraiser_id, amount, status")
      .eq("stripe_session_id", checkoutId).maybeSingle();

    if (donation && paid && donation.status !== "paid") {
      await admin.from("donations").update({ status: "paid" }).eq("id", donation.id);
      const { data: fund } = await admin.from("fundraisers")
        .select("raised_amount").eq("id", donation.fundraiser_id).maybeSingle();
      if (fund) {
        await admin.from("fundraisers")
          .update({ raised_amount: Number(fund.raised_amount || 0) + Number(donation.amount) })
          .eq("id", donation.fundraiser_id);
      }
    } else if (donation && !paid && donation.status === "pending") {
      await admin.from("donations").update({ status: "failed" }).eq("id", donation.id);
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: (e as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
