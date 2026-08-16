// Daraja B2C result / timeout callback. Marks payouts paid or failed.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const ok = () => new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

  try {
    const body = await req.json().catch(() => ({} as any));
    const result = body?.Result;
    if (!result) return ok();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const conversationId = result.ConversationID || result.OriginatorConversationID;
    const params: any[] = result?.ResultParameters?.ResultParameter || [];
    const get = (k: string) => params.find((p) => p?.Key === k)?.Value;
    const receipt = get("TransactionReceipt") || get("TransactionID") || null;

    let payout: any = null;
    if (conversationId) {
      const { data } = await admin.from("payouts")
        .select("id, fundraiser_id, amount, status")
        .eq("conversation_id", conversationId).maybeSingle();
      payout = data;
    }
    if (!payout) return ok();

    const success = result.ResultCode === 0 || result.ResultCode === "0";

    if (success && payout.status !== "paid") {
      await admin.from("payouts").update({
        status: "paid",
        mpesa_receipt: receipt ? String(receipt) : null,
        completed_at: new Date().toISOString(),
        error: null,
      }).eq("id", payout.id);

      const { data: fund } = await admin.from("fundraisers")
        .select("paid_out_amount").eq("id", payout.fundraiser_id).maybeSingle();
      if (fund) {
        await admin.from("fundraisers").update({
          paid_out_amount: Number(fund.paid_out_amount || 0) + Number(payout.amount),
        }).eq("id", payout.fundraiser_id);
      }
    } else if (!success && payout.status !== "paid") {
      await admin.from("payouts").update({
        status: "failed",
        error: result.ResultDesc || "Payout failed",
      }).eq("id", payout.id);
    }

    return ok();
  } catch {
    return ok();
  }
});
