import { supabase } from "@/integrations/supabase/client";

export type ActivityAction =
  | "login" | "logout" | "signup"
  | "create" | "update" | "delete"
  | "role_change" | "user_delete"
  | "condolence" | "donation" | "memorial_create" | "memorial_update"
  | "tribute" | "fundraiser_create" | "fundraiser_update";

export const logActivity = async (
  action: ActivityAction | string,
  opts: {
    entity_type?: string;
    entity_id?: string;
    description?: string;
    metadata?: Record<string, any>;
  } = {}
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles").select("full_name,email").eq("id", user.id).maybeSingle();
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      actor_email: profile?.email || user.email || null,
      actor_name: profile?.full_name || user.email?.split("@")[0] || "User",
      action,
      entity_type: opts.entity_type || null,
      entity_id: opts.entity_id || null,
      description: opts.description || null,
      metadata: opts.metadata || {},
    });
  } catch (e) {
    // best-effort; ignore
    console.warn("activity log failed", e);
  }
};
