import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyAuthenticationResponse } from "npm:@simplewebauthn/server@10.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const b64ToBytes = (b64: string) => {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { email, assertionResponse } = await req.json();
    if (!email || !assertionResponse) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: chal } = await admin.from("webauthn_challenges").select("*").eq("email", email).eq("purpose", "login").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!chal) return new Response(JSON.stringify({ error: "Challenge not found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: cred } = await admin.from("webauthn_credentials").select("*").eq("credential_id", assertionResponse.id).maybeSingle();
    if (!cred) return new Response(JSON.stringify({ error: "Credential not registered" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const origin = req.headers.get("origin") || "";
    const rpID = new URL(origin).hostname;

    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge: chal.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: cred.credential_id,
        publicKey: b64ToBytes(cred.public_key),
        counter: Number(cred.counter),
        transports: cred.transports || undefined,
      },
    });

    if (!verification.verified) return new Response(JSON.stringify({ error: "Verification failed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    await admin.from("webauthn_credentials").update({ counter: verification.authenticationInfo.newCounter, last_used_at: new Date().toISOString() }).eq("id", cred.id);
    await admin.from("webauthn_challenges").delete().eq("id", chal.id);

    // Mint a magic-link and return the hashed token so the client can establish a session
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (linkErr || !link) return new Response(JSON.stringify({ error: linkErr?.message || "Failed to mint session" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ verified: true, hashed_token: link.properties?.hashed_token, email }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
