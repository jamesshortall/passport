// Supabase Edge Function: digest-favorites
// Batched email digest: for each user who favorited a country that changed
// since the last run, send ONE summary email. Schedule daily/weekly via
// Supabase cron (pg_cron / scheduled functions) — never per-change.
//
// Security: this function runs with the service role and emails every user who
// saved a changed country, so it must only be callable by the scheduler. Every
// request must carry `x-cron-secret: <CRON_SECRET>` (constant-time compare);
// 401 when missing/wrong, 500 when the secret isn't configured. Because the
// scheduler has no user JWT, deploy with JWT verification off and rely on the
// shared secret instead. Errors returned to callers are generic.
//
// Deploy:  supabase functions deploy digest-favorites --no-verify-jwt
// Secrets: supabase secrets set CRON_SECRET=$(openssl rand -hex 32)   # 32+ random bytes
//          (plus RESEND_API_KEY, RESEND_FROM)
// Schedule (daily 8am UTC) with pg_cron + pg_net, sending the header:
//   create extension if not exists pg_cron; create extension if not exists pg_net;
//   select cron.schedule('digest-favorites', '0 8 * * *', $$
//     select net.http_post(
//       url     := 'https://<project-ref>.supabase.co/functions/v1/digest-favorites',
//       headers := jsonb_build_object('content-type', 'application/json',
//                                     'x-cron-secret', '<CRON_SECRET>'),
//       body    := '{}'::jsonb);
//   $$);
// (Or use the dashboard scheduler and add the x-cron-secret header there.)
//
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://passport.traveltechnician.info";
const CHANGE_LIMIT = 500; // most recent changes considered per run
const FAV_PAGE = 1000; // favorites fetched per page

// Constant-time string comparison: hash both sides to equal-length digests,
// then XOR every byte so timing doesn't depend on where they first differ.
async function secretsMatch(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const ua = new Uint8Array(da);
  const ub = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < ua.length; i++) diff |= ua[i] ^ ub[i];
  return diff === 0 && a.length === b.length;
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // --- Gate: shared secret from the scheduler ------------------------------
  const expected = Deno.env.get("CRON_SECRET") ?? "";
  if (!expected) {
    console.error("digest-favorites: CRON_SECRET not configured");
    return Response.json({ error: "Not configured" }, { status: 500 });
  }
  const provided = req.headers.get("x-cron-secret") ?? "";
  if (!(await secretsMatch(provided, expected))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const key = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("RESEND_FROM") ?? "AppPassport <onboarding@resend.dev>";

    // Window: changes in the last 24h (adjust to your cron cadence).
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const { data: changes, error: chErr } = await supabase
      .from("change_log")
      .select("country_id, change_summary, changed_at, countries(name, slug)")
      .gte("changed_at", since)
      .order("changed_at", { ascending: false })
      .limit(CHANGE_LIMIT);
    if (chErr) throw chErr;

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

    // Find approved users who favorited any changed country, a page at a time.
    const changedIds = Array.from(byCountry.keys());
    const byUser = new Map<string, { countries: Set<string> }>();
    for (let offset = 0; ; offset += FAV_PAGE) {
      const { data: favs, error: favErr } = await supabase
        .from("favorites")
        .select("user_id, country_id, profiles!inner(email, approval_status)")
        .in("country_id", changedIds)
        .order("id")
        .range(offset, offset + FAV_PAGE - 1);
      if (favErr) throw favErr;
      for (const f of (favs as any[]) ?? []) {
        if (f.profiles?.approval_status !== "approved" || !f.profiles?.email) continue;
        const u = byUser.get(f.profiles.email) ?? { countries: new Set<string>() };
        u.countries.add(f.country_id);
        byUser.set(f.profiles.email, u);
      }
      if (!favs || favs.length < FAV_PAGE) break;
    }

    if (!key) {
      return Response.json({ ok: true, wouldSend: byUser.size, note: "RESEND_API_KEY not set" });
    }

    let sent = 0;
    for (const [email, info] of byUser) {
      const sections = Array.from(info.countries)
        .map((id) => {
          const c = byCountry.get(id)!;
          const items = c.items.map((i) => `<li>${esc(i)}</li>`).join("");
          return `<h3 style="margin:12px 0 4px">${esc(c.name)}</h3><ul>${items}</ul>
            <a href="${SITE_URL}/country/${encodeURIComponent(c.slug)}">View ${esc(c.name)} →</a>`;
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
      else console.error("digest-favorites: resend error", res.status, await res.text());
    }

    return Response.json({ ok: true, sent });
  } catch (e) {
    console.error("digest-favorites:", e);
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
});
