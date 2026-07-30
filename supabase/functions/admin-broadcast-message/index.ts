import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", caller.id).maybeSingle();
    const callerRole = roleRow?.role;
    if (callerRole !== "super_admin" && callerRole !== "admin") {
      throw new Error("Super admin access required");
    }

    const body = await req.json();
    const target = String(body?.target ?? "");
    const content = String(body?.content ?? "").trim();
    if (!content) throw new Error("Message cannot be empty");
    if (content.length > 4000) throw new Error("Message too long");

    const roleMap: Record<string, string[]> = {
      all: [],
      memorial_admins: ["memorial_admin"],
      mourners: ["mourner", "user"],
      super_admins: ["super_admin", "admin"],
    };
    if (!(target in roleMap)) throw new Error("Invalid target audience");

    let query = admin.from("user_roles").select("user_id");
    const roles = roleMap[target];
    if (roles.length) query = query.in("role", roles);
    const { data: rows, error: rowsErr } = await query;
    if (rowsErr) throw rowsErr;

    const ids = Array.from(
      new Set((rows || []).map((r: { user_id: string }) => r.user_id))
    ).filter((id) => id !== caller.id);

    if (!ids.length) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), { headers: corsHeaders });
    }

    const payload = ids.map((rid) => ({
      sender_id: caller.id,
      recipient_id: rid,
      content,
      is_broadcast: true,
    }));

    const { error } = await admin.from("messages").insert(payload);
    if (error) throw error;

    await admin.from("activity_logs").insert({
      user_id: caller.id,
      actor_email: caller.email,
      action: "chat_broadcast",
      entity_type: "message",
      description: `Broadcast message sent to ${ids.length} ${target.replace("_", " ")}`,
      metadata: { target, recipients: ids.length, preview: content.slice(0, 120) },
    });

    return new Response(JSON.stringify({ success: true, sent: ids.length }), { headers: corsHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Broadcast failed";
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: corsHeaders });
  }
});
