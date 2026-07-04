import { createClient } from "npm:@supabase/supabase-js@2";
import { generateRegistrationOptions } from "npm:@simplewebauthn/server@10.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await supabase.auth.getClaims(token);
    if (cErr || !claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userId = claims.claims.sub as string;
    const email = (claims.claims.email as string) || "user";

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const origin = req.headers.get("origin") || "";
    const rpID = new URL(origin).hostname;

    const { data: existing } = await admin.from("webauthn_credentials").select("credential_id, transports").eq("user_id", userId);

    const options = await generateRegistrationOptions({
      rpName: "Makiwa",
      rpID,
      userID: new TextEncoder().encode(userId),
      userName: email,
      attestationType: "none",
      excludeCredentials: (existing || []).map((c: any) => ({
        id: c.credential_id,
        transports: c.transports || undefined,
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
    });

    await admin.from("webauthn_challenges").insert({
      user_id: userId,
      challenge: options.challenge,
      purpose: "register",
    });

    return new Response(JSON.stringify({ options, rpID }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
