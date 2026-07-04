import { createClient } from "npm:@supabase/supabase-js@2";
import { generateAuthenticationOptions } from "npm:@simplewebauthn/server@10.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { email } = await req.json();
    if (!email) return new Response(JSON.stringify({ error: "Email required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await admin.from("profiles").select("id").eq("email", email.toLowerCase().trim()).maybeSingle();
    if (!profile) return new Response(JSON.stringify({ error: "No account found for this email" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: creds } = await admin.from("webauthn_credentials").select("credential_id, transports").eq("user_id", profile.id);
    if (!creds || creds.length === 0) return new Response(JSON.stringify({ error: "No fingerprint registered for this account" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const origin = req.headers.get("origin") || "";
    const rpID = new URL(origin).hostname;

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: creds.map((c: any) => ({ id: c.credential_id, transports: c.transports || undefined })),
      userVerification: "preferred",
    });

    await admin.from("webauthn_challenges").insert({ user_id: profile.id, email, challenge: options.challenge, purpose: "login" });

    return new Response(JSON.stringify({ options }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
