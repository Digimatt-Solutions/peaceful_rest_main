import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existing } = await admin
      .from("donations")
      .select("id,status,amount,fundraiser_id")
      .eq("stripe_session_id", session_id)
      .maybeSingle();

    if (!existing) {
      return new Response(JSON.stringify({ error: "Donation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.payment_status === "paid" && existing.status !== "paid") {
      await admin.from("donations").update({
        status: "paid",
        donor_email: session.customer_email || session.customer_details?.email || null,
      }).eq("id", existing.id);

      // bump fundraiser raised_amount
      const { data: fr } = await admin
        .from("fundraisers").select("raised_amount").eq("id", existing.fundraiser_id).maybeSingle();
      const newRaised = Number(fr?.raised_amount || 0) + Number(existing.amount || 0);
      await admin.from("fundraisers").update({ raised_amount: newRaised }).eq("id", existing.fundraiser_id);
    }

    return new Response(JSON.stringify({
      status: session.payment_status,
      amount: existing.amount,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("verify-donation error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
