// Daily anniversary reminder delivery.
// Runs from pg_cron once a day; also safe to call manually (idempotent per day).
// Dates are evaluated in Africa/Nairobi so reminders land on the right local day.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { normalizePhone, sendSms } from "../_shared/airtouch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TZ = "Africa/Nairobi";

/** YYYY-MM-DD for "now" in Nairobi, independent of the server timezone. */
function localToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  return parts; // en-CA gives YYYY-MM-DD
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Month/day match, ignoring the year (handles Feb 29 by falling back to Feb 28). */
function isAnniversaryOn(baseIso: string, targetIso: string): boolean {
  const base = baseIso.slice(0, 10);
  if (base.slice(5) === targetIso.slice(5)) return true;
  return base.slice(5) === "02-29" && targetIso.slice(5) === "02-28";
}

function yearsSince(baseIso: string, targetIso: string): number {
  return Number(targetIso.slice(0, 4)) - Number(baseIso.slice(0, 4));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const today = localToday();
  const leadDay = addDays(today, 7);
  let sent = 0, skipped = 0, failed = 0;

  try {
    const { data: reminders, error } = await admin
      .from("anniversary_reminders")
      .select("id, user_id, memorial_id, last_notified_on");
    if (error) throw error;
    if (!reminders?.length) {
      return new Response(JSON.stringify({ today, sent: 0, skipped: 0, failed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const memorialIds = [...new Set(reminders.map((r) => r.memorial_id))];
    const userIds = [...new Set(reminders.map((r) => r.user_id))];

    const [{ data: memorials }, { data: profiles }, { data: customs }] = await Promise.all([
      admin.from("memorials").select("id, full_name, date_of_death, created_at").in("id", memorialIds),
      admin.from("profiles").select("id, full_name, phone, anniversary_muted, deleted_at").in("id", userIds),
      admin.from("anniversaries").select("memorial_id, title, remembrance_date").in("memorial_id", memorialIds),
    ]);

    const memorialById = new Map((memorials || []).map((m) => [m.id, m]));
    const profileById = new Map((profiles || []).map((p) => [p.id, p]));

    for (const r of reminders) {
      const memorial = memorialById.get(r.memorial_id);
      const profile = profileById.get(r.user_id);
      if (!memorial || !profile) { skipped++; continue; }
      if (profile.anniversary_muted || profile.deleted_at) { skipped++; continue; }
      if (r.last_notified_on === today) { skipped++; continue; }

      const base = (memorial.date_of_death || memorial.created_at || "").slice(0, 10);
      if (!base) { skipped++; continue; }

      // Custom remembrance days for this memorial, today or in a week.
      const custom = (customs || []).find(
        (c) => c.memorial_id === r.memorial_id &&
          (c.remembrance_date === today || c.remembrance_date === leadDay),
      );

      let message: string | null = null;
      if (isAnniversaryOn(base, today)) {
        message = `Makiwa: Today marks ${yearsSince(base, today)} year(s) since ${memorial.full_name} passed on. Light a candle and share a memory on Makiwa.`;
      } else if (isAnniversaryOn(base, leadDay)) {
        message = `Makiwa: In one week we remember ${memorial.full_name} (${yearsSince(base, leadDay)} year anniversary). Plan how you would like to honour the day.`;
      } else if (custom) {
        const when = custom.remembrance_date === today ? "today" : "in one week";
        message = `Makiwa: "${custom.title}" for ${memorial.full_name} is ${when}.`;
      }

      if (!message) { skipped++; continue; }

      const phone = normalizePhone(profile.phone || "");
      if (!phone) { skipped++; continue; }

      try {
        const res = await sendSms(phone, message);
        if (!res.ok) throw new Error(res.body);
        sent++;
        await admin.from("anniversary_reminders").update({ last_notified_on: today }).eq("id", r.id);
        await admin.from("activity_logs").insert({
          user_id: r.user_id,
          action: "anniversary_reminder_sent",
          entity_type: "memorial",
          entity_id: r.memorial_id,
          description: `Anniversary reminder sent for ${memorial.full_name}`,
          metadata: { date: today },
        });
      } catch (e) {
        failed++;
        console.error("reminder failed", r.id, (e as Error).message);
      }
    }

    return new Response(JSON.stringify({ today, sent, skipped, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
