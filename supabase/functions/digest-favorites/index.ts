// Supabase Edge Function: digest-favorites
// Batched email digest: for each user who favorited a country that changed
// since the last run, send ONE summary email. Schedule daily/weekly via
// Supabase cron (pg_cron / scheduled functions) — never per-change.
//
// Deploy:  supabase functions deploy digest-favorites
// Secrets: RESEND_API_KEY, RESEND_FROM
// Schedule (daily 8am UTC): see supabase/README or dashboard scheduled functions.
//
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const key = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("RESEND_FROM") ?? "AppPassport <onboarding@resend.dev>";

    // Window: changes in the last 24h (adjust to your cron cadence).
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const { data: changes } = await supabase
      .from("change_log")
      .select("country_id, change_summary, changed_at, countries(name, slug)")
      .gte("changed_at", since);

    if (!changes || changes.length === 0) {
      return Response.json({ ok: true, sent: 0, note: "no changes in window" });
    }

    // country_id -> list of change summaries
    const byCountry = new Map<string, { name: string; slug: string; items: string[] }>();
    for (const c of changes as any[]) {
      if (!c.country_id) continue;
      const entry = byCountry.get(c.country_id) ?? {
        name: c.countries?.name ?? "A country",
        slug: c.countries?.slug ?? "",
        items: [],
      };
      entry.items.push(c.change_summary);
      byCountry.set(c.country_id, entry);
    }

    // Find approved users who favorited any changed country.
    const changedIds = Array.from(byCountry.keys());
    const { data: favs } = await supabase
      .from("favorites")
      .select("user_id, country_id, profiles!inner(email, approval_status)")
      .in("country_id", changedIds);

    // user email -> countries changed
    const byUser = new Map<string, { countries: Set<string> }>();
    for (const f of (favs as any[]) ?? []) {
      if (f.profiles?.approval_status !== "approved" || !f.profiles?.email) continue;
      const u = byUser.get(f.profiles.email) ?? { countries: new Set<string>() };
      u.countries.add(f.country_id);
      byUser.set(f.profiles.email, u);
    }

    if (!key) {
      return Response.json({ ok: true, wouldSend: byUser.size, note: "RESEND_API_KEY not set" });
    }

    let sent = 0;
    for (const [email, info] of byUser) {
      const sections = Array.from(info.countries)
        .map((id) => {
          const c = byCountry.get(id)!;
          const items = c.items.map((i) => `<li>${i}</li>`).join("");
          return `<h3 style="margin:12px 0 4px">${c.name}</h3><ul>${items}</ul>
            <a href="https://passport.traveltechnician.info/country/${c.slug}">View ${c.name} →</a>`;
        })
        .join("");

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({
          from,
          to: [email],
          subject: "Updates to countries you saved on AppPassport",
          html: `<div style="font:15px system-ui"><p>Here's what changed in the countries you saved:</p>${sections}<hr><p style="color:#94a3b8;font-size:12px">The Travel Technician</p></div>`,
        }),
      });
      if (res.ok) sent++;
    }

    return Response.json({ ok: true, sent });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
