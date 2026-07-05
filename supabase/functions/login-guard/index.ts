// Login rate-limit guard: 5 attempts then lock for 1 hour per email.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 60;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, email } = await req.json();
    if (!email || typeof email !== "string") {
      return json({ error: "email required" }, 400);
    }
    const key = email.trim().toLowerCase();
    if (!["check", "fail", "success"].includes(action)) {
      return json({ error: "invalid action" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: row } = await admin
      .from("login_attempts")
      .select("attempts, locked_until")
      .eq("email", key)
      .maybeSingle();

    const now = Date.now();
    const lockedUntil = row?.locked_until ? new Date(row.locked_until).getTime() : 0;
    const isLocked = lockedUntil > now;

    if (action === "check") {
      return json({
        locked: isLocked,
        locked_until: isLocked ? new Date(lockedUntil).toISOString() : null,
        attempts: row?.attempts ?? 0,
        remaining: Math.max(0, MAX_ATTEMPTS - (row?.attempts ?? 0)),
      });
    }

    if (action === "success") {
      await admin.from("login_attempts").upsert({
        email: key, attempts: 0, locked_until: null, updated_at: new Date().toISOString(),
      });
      return json({ ok: true });
    }

    // action === "fail"
    if (isLocked) {
      return json({ locked: true, locked_until: new Date(lockedUntil).toISOString(), remaining: 0 });
    }
    const attempts = (row?.attempts ?? 0) + 1;
    let newLockedUntil: string | null = null;
    if (attempts >= MAX_ATTEMPTS) {
      newLockedUntil = new Date(now + LOCK_MINUTES * 60 * 1000).toISOString();
    }
    await admin.from("login_attempts").upsert({
      email: key,
      attempts: newLockedUntil ? 0 : attempts,
      locked_until: newLockedUntil,
      updated_at: new Date().toISOString(),
    });
    return json({
      locked: !!newLockedUntil,
      locked_until: newLockedUntil,
      attempts: newLockedUntil ? 0 : attempts,
      remaining: newLockedUntil ? 0 : Math.max(0, MAX_ATTEMPTS - attempts),
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
