import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyRegistrationResponse } from "npm:@simplewebauthn/server@10.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await supabase.auth.getClaims(token);
    if (cErr || !claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userId = claims.claims.sub as string;

    const { attestationResponse, deviceName } = await req.json();

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: chal } = await admin
      .from("webauthn_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("purpose", "register")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!chal) return new Response(JSON.stringify({ error: "Challenge not found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const origin = req.headers.get("origin") || "";
    const rpID = new URL(origin).hostname;

    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: chal.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return new Response(JSON.stringify({ error: "Verification failed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { credential } = verification.registrationInfo;
    const publicKeyB64 = btoa(String.fromCharCode(...credential.publicKey));

    const { error: insErr } = await admin.from("webauthn_credentials").insert({
      user_id: userId,
      credential_id: credential.id,
      public_key: publicKeyB64,
      counter: credential.counter,
      transports: attestationResponse?.response?.transports || [],
      device_name: deviceName || "Biometric device",
    });
    if (insErr) return new Response(JSON.stringify({ error: insErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    await admin.from("webauthn_challenges").delete().eq("id", chal.id);

    return new Response(JSON.stringify({ verified: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
