import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const FIELDS = `full_name, national_id, gender, date_of_birth (YYYY-MM-DD), date_of_death (YYYY-MM-DD), location, short_tribute, biography, burial_details, service_schedule, venue`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { file_data, mime, filename, text } = await req.json();
    if (!file_data && !text) {
      return new Response(JSON.stringify({ error: "No document was provided." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Document reading is not configured." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content: any[] = [{
      type: "input_text",
      text:
        `Read this funeral/obituary document and extract these memorial fields: ${FIELDS}. ` +
        `Return JSON only. Use an empty string for anything not stated. Do not invent facts. ` +
        `Keep biography, burial_details and service_schedule as plain text copied or lightly tidied from the document.`,
    }];

    if (text) {
      content.push({ type: "input_text", text: String(text).slice(0, 40000) });
    } else if (String(mime || "").startsWith("image/")) {
      content.push({ type: "input_image", image_url: file_data });
    } else {
      content.push({ type: "input_file", filename: filename || "document.pdf", file_data });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: [{ role: "user", content }],
        stream: true,
        reasoning: { effort: "low" },
        text: {
          format: {
            type: "json_schema",
            name: "obituary_fields",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                full_name: { type: "string" },
                national_id: { type: "string" },
                gender: { type: "string" },
                date_of_birth: { type: "string" },
                date_of_death: { type: "string" },
                location: { type: "string" },
                short_tribute: { type: "string" },
                biography: { type: "string" },
                burial_details: { type: "string" },
                service_schedule: { type: "string" },
                venue: { type: "string" },
              },
              required: [
                "full_name", "national_id", "gender", "date_of_birth", "date_of_death",
                "location", "short_tribute", "biography", "burial_details", "service_schedule", "venue",
              ],
            },
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text();
      const message = res.status === 429
        ? "Too many requests right now. Please try again shortly."
        : res.status === 402
        ? "The document reading service is out of credit. Please contact support."
        : "We could not read that document. Please fill the form in manually.";
      console.error("gateway error", res.status, detail);
      return new Response(JSON.stringify({ error: message }), {
        status: res.status === 429 ? 429 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Accumulate the streamed text.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let out = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") out += evt.delta;
          if (evt.type === "response.completed" && !out && evt.response?.output_text) out = evt.response.output_text;
        } catch { /* ignore partial frames */ }
      }
    }

    let fields: Record<string, string> = {};
    try { fields = JSON.parse(out); } catch { /* fall through */ }

    if (!Object.keys(fields).length) {
      return new Response(JSON.stringify({ error: "No details could be read from that document." }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ fields }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Something went wrong reading the document." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
