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

// ---- Abuse protection thresholds -------------------------------------------
const RESEND_COOLDOWN_SECONDS = 60;      // min gap between two codes for a number
const MAX_PER_PHONE_10MIN = 3;
const MAX_PER_PHONE_24H = 10;
const MAX_PER_IP_HOUR = 15;
const MAX_PER_IP_24H = 40;
const MAX_VERIFY_ATTEMPTS = 5;           // per code
const MAX_FAILED_VERIFIES_PER_IP_HOUR = 20;
const BLOCK_MINUTES = 60;                // temporary block duration

async function hash(value: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for") || "";
  return (fwd.split(",")[0] || req.headers.get("cf-connecting-ip") || "unknown").trim();
}

async function isBlocked(identifier: string) {
  const { data } = await admin
    .from("otp_blocks")
    .select("blocked_until")
    .eq("identifier", identifier)
    .maybeSingle();
  if (!data) return 0;
  const until = new Date(data.blocked_until).getTime();
  return until > Date.now() ? until : 0;
}

async function block(identifier: string, reason: string) {
  await admin.from("otp_blocks").upsert(
    {
      identifier,
      reason,
      blocked_until: new Date(Date.now() + BLOCK_MINUTES * 60 * 1000).toISOString(),
    },
    { onConflict: "identifier" },
  );
}

async function countSince(column: "phone" | "ip", value: string, sinceMs: number) {
  const { count } = await admin
    .from("phone_otps")
    .select("id", { count: "exact", head: true })
    .eq(column, value)
    .gte("created_at", new Date(Date.now() - sinceMs).toISOString());
  return count ?? 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ip = clientIp(req);

  try {
    const { action, phone, code } = await req.json().catch(() => ({}));
    const msisdn = normalizePhone(String(phone || ""));
    if (!msisdn) return json({ error: "Enter a valid phone number" }, 400);
    if (action !== "send" && action !== "verify") return json({ error: "Unknown action" }, 400);

    // Temporary blocks (per phone and per IP) apply to both actions.
    for (const key of [`phone:${msisdn}`, `ip:${ip}`]) {
      const until = await isBlocked(key);
      if (until) {
        return json(
          {
            error: "Too many attempts. Please try again later.",
            retry_after: Math.ceil((until - Date.now()) / 1000),
          },
          429,
        );
      }
    }

    if (action === "send") {
      // 1. cooldown between codes
      const { data: last } = await admin
        .from("phone_otps")
        .select("created_at")
        .eq("phone", msisdn)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (last) {
        const elapsed = (Date.now() - new Date(last.created_at).getTime()) / 1000;
        if (elapsed < RESEND_COOLDOWN_SECONDS) {
          const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
          return json({ error: `Please wait ${wait}s before requesting another code`, retry_after: wait }, 429);
        }
      }

      // 2. per-phone burst + daily caps
      if (await countSince("phone", msisdn, 10 * 60 * 1000) >= MAX_PER_PHONE_10MIN) {
        return json({ error: "Too many codes requested. Try again in a few minutes." }, 429);
      }
      if (await countSince("phone", msisdn, 24 * 60 * 60 * 1000) >= MAX_PER_PHONE_24H) {
        await block(`phone:${msisdn}`, "daily code limit");
        return json({ error: "Daily verification limit reached for this number. Try again tomorrow." }, 429);
      }

      // 3. per-IP caps
      if (ip !== "unknown") {
        if (await countSince("ip", ip, 60 * 60 * 1000) >= MAX_PER_IP_HOUR) {
          await block(`ip:${ip}`, "hourly IP code limit");
          return json({ error: "Too many verification requests from this device. Try again later." }, 429);
        }
        if (await countSince("ip", ip, 24 * 60 * 60 * 1000) >= MAX_PER_IP_24H) {
          await block(`ip:${ip}`, "daily IP code limit");
          return json({ error: "Too many verification requests from this device. Try again tomorrow." }, 429);
        }
      }

      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const { error } = await admin.from("phone_otps").insert({
        phone: msisdn,
        code_hash: await hash(otp),
        ip,
      });
      if (error) return json({ error: error.message }, 500);

      try {
        const sent = await sendSms(msisdn, `Your Makiwa verification code is ${otp}. It expires in 10 minutes.`);
        if (!sent.ok) {
          return json({ error: "Could not deliver the SMS. Please try again.", details: sent.body }, 502);
        }
      } catch (e) {
        console.error("phone-otp send error", e);
        return json({
          error: "We could not send the verification SMS right now. Please try again shortly.",
          details: (e as Error).message,
        }, 502);
      }

      return json({ ok: true, phone: msisdn, cooldown: RESEND_COOLDOWN_SECONDS });
    }

    // ----- verify -----
    const supplied = String(code || "").trim();
    if (!/^\d{6}$/.test(supplied)) return json({ error: "Enter the 6-digit code" }, 400);

    // per-IP failed verification throttle
    if (ip !== "unknown") {
      const { count: recentFailures } = await admin
        .from("phone_otps")
        .select("id", { count: "exact", head: true })
        .eq("ip", ip)
        .eq("verified", false)
        .gte("attempts", 1)
        .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
      if ((recentFailures ?? 0) >= MAX_FAILED_VERIFIES_PER_IP_HOUR) {
        await block(`ip:${ip}`, "failed verification flood");
        return json({ error: "Too many failed attempts. Try again later." }, 429);
      }
    }

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
    if (rec.attempts >= MAX_VERIFY_ATTEMPTS) {
      await block(`phone:${msisdn}`, "code attempt limit");
      return json({ error: "Too many attempts. Request a new code later." }, 429);
    }

    if (rec.code_hash !== (await hash(supplied))) {
      const attempts = rec.attempts + 1;
      await admin.from("phone_otps").update({ attempts }).eq("id", rec.id);
      if (attempts >= MAX_VERIFY_ATTEMPTS) await block(`phone:${msisdn}`, "code attempt limit");
      return json({ error: "Incorrect code", remaining: Math.max(0, MAX_VERIFY_ATTEMPTS - attempts) }, 400);
    }

    await admin.from("phone_otps").update({ verified: true }).eq("id", rec.id);
    return json({ ok: true, phone: msisdn });
  } catch (e) {
    console.error("phone-otp error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
