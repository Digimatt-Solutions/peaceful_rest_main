import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { normalizePhone, sendSms } from "../_shared/airtouch.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function hash(value: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, phone, code } = await req.json().catch(() => ({}));
    const msisdn = normalizePhone(String(phone || ""));
    if (!msisdn) return json({ error: "Enter a valid phone number" }, 400);

    if (action === "send") {
      // basic throttle: max 3 codes per number per 10 minutes
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { count } = await admin
        .from("phone_otps")
        .select("id", { count: "exact", head: true })
        .eq("phone", msisdn)
        .gte("created_at", since);
      if ((count ?? 0) >= 3) {
        return json({ error: "Too many codes requested. Try again in a few minutes." }, 429);
      }

      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const { error } = await admin.from("phone_otps").insert({
        phone: msisdn,
        code_hash: await hash(otp),
      });
      if (error) return json({ error: error.message }, 500);

      try {
        const sent = await sendSms(msisdn, `Your Makiwa verification code is ${otp}. It expires in 10 minutes.`);
        if (!sent.ok) {
          return json({ error: "Could not deliver the SMS. Please try again.", details: sent.body }, 502);
        }
      } catch (e) {
        return json({ error: (e as Error).message }, 500);
      }

      return json({ ok: true, phone: msisdn });
    }

    if (action === "verify") {
      const supplied = String(code || "").trim();
      if (!/^\d{6}$/.test(supplied)) return json({ error: "Enter the 6-digit code" }, 400);

      const { data: rec } = await admin
        .from("phone_otps")
        .select("*")
        .eq("phone", msisdn)
        .eq("verified", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!rec) return json({ error: "Request a new code" }, 400);
      if (new Date(rec.expires_at).getTime() < Date.now()) return json({ error: "Code expired. Request a new one." }, 400);
      if (rec.attempts >= 5) return json({ error: "Too many attempts. Request a new code." }, 429);

      if (rec.code_hash !== (await hash(supplied))) {
        await admin.from("phone_otps").update({ attempts: rec.attempts + 1 }).eq("id", rec.id);
        return json({ error: "Incorrect code" }, 400);
      }

      await admin.from("phone_otps").update({ verified: true }).eq("id", rec.id);
      return json({ ok: true, phone: msisdn });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("phone-otp error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
