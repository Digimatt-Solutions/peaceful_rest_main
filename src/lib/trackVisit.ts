import { canTrack, onConsentChange } from "./consent";
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

export const trackVisit = async (path: string) => {
  if (!(await canTrack("analytics"))) {
    const off = onConsentChange(() => { off(); void trackVisit(path); });
    return;
  }
  try {
    const key = `${STORAGE_KEY}:${path}`;
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last < THROTTLE_MS) return;
    sessionStorage.setItem(key, String(Date.now()));

    const ua = navigator.userAgent;
    if (!(await canTrack("analytics"))) return;
    let referrer: string | null = null;
    try { referrer = document.referrer ? new URL(document.referrer).origin : null; } catch {}

    await supabase.from("site_visits").insert({
      path,
      referrer,
      country: null,
      country_code: null,
      city: null,
      device: detectDevice(ua),
      browser: detectBrowser(ua),
      os: detectOS(ua),
      user_agent: null,
    });
  } catch {
    // silent
  }
};
