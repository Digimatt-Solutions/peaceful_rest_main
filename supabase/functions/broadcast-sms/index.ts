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

const TARGET_ROLES: Record<string, string[]> = {
  all: ["super_admin", "admin", "memorial_admin", "mourner", "user"],
  memorial_admins: ["memorial_admin"],
  mourners: ["mourner", "user"],
  super_admins: ["super_admin", "admin"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims } = await anon.auth.getClaims(authHeader.replace("Bearer ", ""));
    const userId = claims?.claims?.sub as string | undefined;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = (roles || []).some((r) => r.role === "super_admin" || r.role === "admin");
    if (!isAdmin) return json({ error: "Only super admins can broadcast SMS" }, 403);

    const { target, message } = await req.json().catch(() => ({}));
    const text = String(message || "").trim();
    if (!text || text.length > 480) return json({ error: "Message must be 1-480 characters" }, 400);
    const roleList = TARGET_ROLES[String(target || "all")];
    if (!roleList) return json({ error: "Invalid target" }, 400);

    const { data: targetRoles, error: rErr } = await admin
      .from("user_roles")
      .select("user_id")
      .in("role", roleList);
    if (rErr) return json({ error: rErr.message }, 500);

    const ids = [...new Set((targetRoles || []).map((r) => r.user_id))];
    if (!ids.length) return json({ sent: 0, failed: 0, skipped: 0 });

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, phone")
      .in("id", ids);

    const numbers = [
      ...new Set(
        (profiles || [])
          .map((p) => normalizePhone(p.phone || ""))
          .filter((p): p is string => !!p),
      ),
    ];
    const skipped = ids.length - numbers.length;

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const n of numbers) {
      try {
        const res = await sendSms(n, text);
        if (res.ok) sent++;
        else {
          failed++;
          if (errors.length < 3) errors.push(res.body.slice(0, 200));
        }
      } catch (e) {
        failed++;
        if (errors.length < 3) errors.push((e as Error).message);
      }
    }

    return json({ sent, failed, skipped, errors });
  } catch (e) {
    console.error("broadcast-sms error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
