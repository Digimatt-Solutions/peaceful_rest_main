// List supported banks for a country (default: Kenya) via Paystack.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const country = url.searchParams.get("country") || "kenya";
    const currency = url.searchParams.get("currency") || "KES";
    const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!secret) return json({ error: "PAYSTACK_SECRET_KEY not configured" }, 500);

    const psRes = await fetch(
      `https://api.paystack.co/bank?country=${encodeURIComponent(country)}&currency=${encodeURIComponent(currency)}&perPage=100`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const psJson = await psRes.json();
    if (!psRes.ok || !psJson.status) return json({ error: psJson.message || "Failed" }, 400);

    const banks = (psJson.data || []).map((b: any) => ({ name: b.name, code: b.code, slug: b.slug }));
    return json({ banks });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
