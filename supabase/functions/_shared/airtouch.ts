// Airtouch bulk SMS helper (shared by phone-otp and broadcast-sms)

const API_URL = Deno.env.get("AIRTOUCH_API_URL") ||
  "https://sms.airtouch.co.ke/api/services/sendsms/";

export function normalizePhone(raw: string): string | null {
  const digits = (raw || "").replace(/[^\d+]/g, "");
  if (!digits) return null;
  let n = digits.replace(/^\+/, "");
  if (n.startsWith("0")) n = "254" + n.slice(1);
  else if (n.startsWith("7") || n.startsWith("1")) n = "254" + n;
  if (n.length < 10 || n.length > 15) return null;
  return n;
}

export interface SmsResult {
  phone: string;
  ok: boolean;
  status: number;
  body: string;
}

export async function sendSms(to: string, message: string): Promise<SmsResult> {
  const apikey = Deno.env.get("AIRTOUCH_API_KEY");
  const partnerID = Deno.env.get("AIRTOUCH_PARTNER_ID");
  const shortcode = Deno.env.get("AIRTOUCH_SENDER_ID");

  if (!apikey || !partnerID || !shortcode) {
    throw new Error(
      "Airtouch SMS is not configured (AIRTOUCH_API_KEY, AIRTOUCH_PARTNER_ID, AIRTOUCH_SENDER_ID).",
    );
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ apikey, partnerID, shortcode, mobile: to, message }),
  });

  const body = await res.text();
  // Airtouch/celcomafrica style APIs can return 200 with an error code in the body
  const ok = res.ok && !/"?respons?e-code"?\s*:\s*(?!200)/i.test(body);
  if (!ok) console.error(`Airtouch send failed [${res.status}] ${body}`);
  return { phone: to, ok, status: res.status, body };
}
