// Airtouch bulk SMS helper (shared by phone-otp and broadcast-sms)
// Uses the same gateway/format proven working in production:
// GET https://client.airtouch.co.ke:9012/sms/api/?issn=<senderId>&msisdn=<phone>&text=<msg>&username=<u>&password=<p>

const BASE_URL = Deno.env.get("AIRTOUCH_API_URL") ||
  "https://client.airtouch.co.ke:9012/sms/api/";

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
  const senderId = Deno.env.get("AIRTOUCH_SENDER_ID");
  const username = Deno.env.get("AIRTOUCH_USERNAME");
  const password = Deno.env.get("AIRTOUCH_PASSWORD");

  if (!username || !password) {
    throw new Error(
      "Airtouch SMS is not configured (AIRTOUCH_USERNAME, AIRTOUCH_PASSWORD).",
    );
  }

  const url = `${BASE_URL}?issn=${encodeURIComponent(senderId || username)}` +
    `&msisdn=${encodeURIComponent(to)}` +
    `&text=${encodeURIComponent(message)}` +
    `&username=${encodeURIComponent(username)}` +
    `&password=${encodeURIComponent(password)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    const body = await res.text();
    if (!res.ok) console.error(`Airtouch send failed [${res.status}] ${body}`);
    return { phone: to, ok: res.ok, status: res.status, body };
  } catch (e) {
    const msg = (e as Error).message;
    console.error(`Airtouch request failed: ${msg}`);
    throw new Error(
      `The SMS gateway is currently unreachable. Details: ${msg}`,
    );
  }
}
