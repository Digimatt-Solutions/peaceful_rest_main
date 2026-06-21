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
    const body = await req.json();
    const {
      fundraiser_id,
      amount,
      donor_name,
      donor_email,
      message,
      is_anonymous,
      success_url,
      cancel_url,
    } = body;

    if (!fundraiser_id || !amount || Number(amount) <= 0) {
      return new Response(JSON.stringify({ error: "Invalid fundraiser or amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: fundraiser, error: frErr } = await admin
      .from("fundraisers")
      .select("id,title,memorial_id")
      .eq("id", fundraiser_id)
      .maybeSingle();
    if (frErr || !fundraiser) {
      return new Response(JSON.stringify({ error: "Fundraiser not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // optional auth — capture user_id if logged in (don't fail otherwise)
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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const origin = req.headers.get("origin") || "";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: donor_email || undefined,
      line_items: [
        {
          price_data: {
            currency: "kes",
            product_data: {
              name: `Contribution: ${fundraiser.title}`,
              description: message || undefined,
            },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: success_url ||
        `${origin}/memorial/${fundraiser.memorial_id}?donation=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url ||
        `${origin}/memorial/${fundraiser.memorial_id}?donation=cancelled`,
      metadata: {
        fundraiser_id,
        memorial_id: fundraiser.memorial_id,
        donor_name: is_anonymous ? "" : (donor_name || ""),
        is_anonymous: is_anonymous ? "1" : "0",
        message: message || "",
        user_id: userId || "",
      },
    });

    // pre-create a pending donation row so we have a trace
    await admin.from("donations").insert({
      fundraiser_id,
      user_id: userId,
      donor_name: is_anonymous ? null : (donor_name || null),
      donor_email: donor_email || null,
      amount: Number(amount),
      message: message || null,
      is_anonymous: !!is_anonymous,
      status: "pending",
      stripe_session_id: session.id,
    });

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("create-donation-checkout error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
