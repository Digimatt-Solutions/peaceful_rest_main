import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "mw_last_visit";
const THROTTLE_MS = 30 * 60 * 1000; // throttle to one ping per 30 min per path

const detectBrowser = (ua: string) => {
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\//i.test(ua)) return "Opera";
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "Safari";
  return "Other";
};

const detectOS = (ua: string) => {
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Other";
};

const detectDevice = (ua: string) => {
  if (/Mobi|Android.*Mobile|iPhone|iPod/i.test(ua)) return "Mobile";
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return "Tablet";
  return "Desktop";
};

let geoCache: { country: string | null; country_code: string | null; city: string | null } | null = null;

const getGeo = async () => {
  if (geoCache) return geoCache;
  try {
    const cached = sessionStorage.getItem("mw_geo");
    if (cached) {
      geoCache = JSON.parse(cached);
      return geoCache;
    }
  } catch {}
  try {
    const r = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!r.ok) throw new Error("geo fail");
    const j = await r.json();
    geoCache = {
      country: j.country_name || null,
      country_code: j.country_code || null,
      city: j.city || null,
    };
    try { sessionStorage.setItem("mw_geo", JSON.stringify(geoCache)); } catch {}
    return geoCache;
  } catch {
    geoCache = { country: null, country_code: null, city: null };
    return geoCache;
  }
};

export const trackVisit = async (path: string) => {
  try {
    const key = `${STORAGE_KEY}:${path}`;
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last < THROTTLE_MS) return;
    sessionStorage.setItem(key, String(Date.now()));

    const ua = navigator.userAgent;
    const geo = await getGeo();

    await supabase.from("site_visits").insert({
      path,
      referrer: document.referrer || null,
      country: geo?.country ?? null,
      country_code: geo?.country_code ?? null,
      city: geo?.city ?? null,
      device: detectDevice(ua),
      browser: detectBrowser(ua),
      os: detectOS(ua),
      user_agent: ua,
    });
  } catch {
    // silent
  }
};
