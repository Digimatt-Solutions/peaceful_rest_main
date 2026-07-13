// Resolve a bank account number against a bank code via Paystack.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { account_number, bank_code } = await req.json();
    if (!account_number || !bank_code) return json({ error: "account_number and bank_code required" }, 400);

    const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!secret) return json({ error: "PAYSTACK_SECRET_KEY not configured" }, 500);

    const psRes = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(String(account_number))}&bank_code=${encodeURIComponent(String(bank_code))}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const psJson = await psRes.json();
    if (!psRes.ok || !psJson.status) {
      return json({ error: psJson.message || "Could not resolve account", resolved: false }, 200);
    }
    return json({
      resolved: true,
      account_number: psJson.data.account_number,
      account_name: psJson.data.account_name,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
