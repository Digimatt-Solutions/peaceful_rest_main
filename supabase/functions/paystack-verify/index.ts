// Verify a Paystack transaction and finalize the matching donation.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { reference } = await req.json();
    if (!reference) return json({ error: "reference required" }, 400);

    const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!secret) return json({ error: "PAYSTACK_SECRET_KEY not configured" }, 500);

    const psRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const psJson = await psRes.json();
    if (!psRes.ok || !psJson.status) return json({ error: psJson.message || "Verify failed" }, 400);

    const data = psJson.data;
    const paid = data.status === "success";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: donation } = await admin
      .from("donations")
      .select("id, fundraiser_id, amount, status")
      .eq("stripe_session_id", reference)
      .maybeSingle();

    if (donation && paid && donation.status !== "paid") {
      await admin.from("donations").update({ status: "paid" }).eq("id", donation.id);
      const { data: fund } = await admin
        .from("fundraisers").select("raised_amount").eq("id", donation.fundraiser_id).maybeSingle();
      if (fund) {
        await admin.from("fundraisers")
          .update({ raised_amount: Number(fund.raised_amount || 0) + Number(donation.amount) })
          .eq("id", donation.fundraiser_id);
      }
    } else if (donation && !paid && donation.status === "pending") {
      await admin.from("donations").update({ status: "failed" }).eq("id", donation.id);
    }

    return json({ paid, status: data.status, amount: data.amount / 100, reference });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
