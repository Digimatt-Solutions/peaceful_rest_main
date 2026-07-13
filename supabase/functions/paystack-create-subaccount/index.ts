// Create a Paystack subaccount for a memorial's payout bank account.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { memorial_id, account_number, bank_code, bank_name, account_name } = await req.json();
    if (!memorial_id || !account_number || !bank_code || !bank_name || !account_name) {
      return json({ error: "memorial_id, account_number, bank_code, bank_name and account_name are required" }, 400);
    }

    const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!secret) return json({ error: "PAYSTACK_SECRET_KEY not configured" }, 500);

    // Require authenticated caller who owns / admins this memorial
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Not authenticated" }, 401);

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await anon.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Authorization check: memorial admin, creator, or super admin
    const { data: memorial } = await admin.from("memorials").select("id, full_name, created_by").eq("id", memorial_id).maybeSingle();
    if (!memorial) return json({ error: "Memorial not found" }, 404);

    const { data: memAdmin } = await admin.from("memorial_admins").select("id").eq("memorial_id", memorial_id).eq("user_id", user.id).maybeSingle();
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    const isSuper = roleRow?.role === "super_admin" || roleRow?.role === "admin";
    const isOwner = memorial.created_by === user.id;
    if (!isOwner && !memAdmin && !isSuper) return json({ error: "Not authorized for this memorial" }, 403);

    // Create Paystack subaccount (0% cut here — we pass transaction_charge per donation)
    const businessName = `Makiwa · ${memorial.full_name}`.slice(0, 100);
    const psRes = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name: businessName,
        settlement_bank: bank_code,
        account_number,
        percentage_charge: 0,
        description: `Payout account for memorial ${memorial.id}`,
        primary_contact_name: account_name,
      }),
    });
    const psJson = await psRes.json();
    if (!psRes.ok || !psJson.status) {
      return json({ error: psJson.message || "Paystack subaccount creation failed" }, 400);
    }

    // Deactivate any existing active bank account for this memorial
    await admin.from("memorial_bank_accounts")
      .update({ is_active: false })
      .eq("memorial_id", memorial_id)
      .eq("is_active", true);

    const { data: inserted, error: insErr } = await admin.from("memorial_bank_accounts").insert({
      memorial_id,
      account_name,
      account_number,
      bank_code,
      bank_name,
      country: "KE",
      resolved_account_name: psJson.data.account_name || account_name,
      paystack_subaccount_code: psJson.data.subaccount_code,
      paystack_subaccount_id: String(psJson.data.id),
      is_active: true,
      created_by: user.id,
    }).select().maybeSingle();
    if (insErr) return json({ error: insErr.message }, 500);

    // Activate any draft fundraisers for this memorial and attach the bank account
    await admin.from("fundraisers")
      .update({ bank_account_id: inserted!.id, status: "active" })
      .eq("memorial_id", memorial_id)
      .eq("status", "draft");

    return json({ bank_account: inserted });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
