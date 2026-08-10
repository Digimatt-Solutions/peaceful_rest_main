// Airtouch bulk SMS helper (shared by phone-otp and broadcast-sms)

// The primary gateway host (sms.airtouch.co.ke) has repeatedly served an
// expired/mismatched TLS certificate and 502s. Allow overriding via secret and
// fall back through known hosts so a single bad host does not break signup.
const CONFIGURED = Deno.env.get("AIRTOUCH_API_URL");

const ENDPOINTS = CONFIGURED
  ? [CONFIGURED]
  : [
    "https://sms.airtouch.co.ke/api/services/sendsms/",
    "https://client.airtouch.co.ke/api/services/sendsms/",
  ];

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
  const password = Deno.env.get("AIRTOUCH_PASSWORD");
  const username = Deno.env.get("AIRTOUCH_USERNAME") || senderId;

  if (!senderId || !password || !username) {
    throw new Error(
      "Airtouch SMS is not configured (AIRTOUCH_USERNAME, AIRTOUCH_SENDER_ID, AIRTOUCH_PASSWORD).",
    );
  }

  const payload = JSON.stringify({
    username,
    password,
    senderId,
    shortcode: senderId,
    mobile: to,
    msisdn: to,
    message,
  });


  const failures: string[] = [];

  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: payload,
        signal: AbortSignal.timeout(15000),
      });

      const body = await res.text();
      if (res.status >= 500 || res.status === 404) {
        failures.push(`${url} -> HTTP ${res.status}`);
        continue;
      }

      // Airtouch style APIs can return 200 with an error code in the body
      const ok = res.ok && !/"?respons?e-code"?\s*:\s*(?!200)/i.test(body);
      if (!ok) console.error(`Airtouch send failed [${res.status}] ${body}`);
      return { phone: to, ok, status: res.status, body };
    } catch (e) {
      const msg = (e as Error).message;
      console.error(`Airtouch request to ${url} failed: ${msg}`);
      failures.push(`${url} -> ${msg}`);
    }
  }

  throw new Error(
    "The SMS gateway is currently unreachable. " +
      "Please confirm the Airtouch API URL/credentials. Details: " +
      failures.join(" | "),
  );
}
