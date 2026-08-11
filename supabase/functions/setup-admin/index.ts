// One-time super admin bootstrap. Permanently disabled once a super admin exists.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const action = body?.action ?? "create";

    const { data: existing, error: existErr } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "super_admin")
      .limit(1);
    if (existErr) throw existErr;
    const adminExists = !!existing?.length;

    if (action === "status") return json({ admin_exists: adminExists });

    if (adminExists) {
      return json({ error: "Setup is closed. An administrator already exists." }, 409);
    }

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.fullName ?? "Administrator").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "A valid email is required" }, 400);
    if (password.length < 10) return json({ error: "Password must be at least 10 characters" }, 400);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "super_admin", is_setup_admin: true },
    });
    if (createErr) throw createErr;
    const userId = created.user?.id;
    if (!userId) throw new Error("Account creation failed");

    // Guarantee the super_admin role even if the signup trigger defaulted it.
    await admin.from("user_roles").delete().eq("user_id", userId);
    const { error: roleErr } = await admin.from("user_roles").insert({ user_id: userId, role: "super_admin" });
    if (roleErr) throw roleErr;

    await admin.from("profiles").update({ full_name: fullName, email }).eq("id", userId);
    await admin.from("activity_logs").insert({
      user_id: userId,
      actor_email: email,
      actor_name: fullName,
      action: "admin_setup",
      entity_type: "user",
      entity_id: userId,
      description: `Initial super admin account created for ${email}`,
    });

    return json({ success: true, userId });
  } catch (e) {
    return json({ error: (e as Error).message || "Unexpected error" }, 400);
  }
});
