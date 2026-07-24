import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SITE, SEVERITY_META } from "@/lib/constants";
import type { Severity } from "@/lib/types";

export const dynamic = "force-dynamic";

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string)
  );
}

/**
 * Lightweight, standalone embed for external blogs. `?country=` or path slug.
 * Renders a compact "Apps you'll need" card (severity tags only), links back to
 * the full country page, and carries a "Powered by The Travel Technician"
 * credit. No React, no login required, minimal bytes.
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = createSupabaseServerClient();

  const { data: country } = await supabase
    .from("countries")
    .select("id, name, slug, flag_emoji, status")
    .eq("slug", params.slug)
    .eq("status", "published")
    .maybeSingle();

  const headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "public, max-age=300",
    // Allow embedding anywhere (this is a public widget by design).
    "X-Frame-Options": "ALLOWALL",
  };

  if (!country) {
    return new Response(
      `<!doctype html><meta charset="utf-8"><body style="font:14px system-ui;padding:16px">Country not found. <a href="${SITE.url}">AppPassport</a></body>`,
      { status: 404, headers }
    );
  }

  const { data: apps } = await supabase
    .from("country_apps")
    .select("us_app_name, local_alternative_name, severity")
    .eq("country_id", country.id)
    .order("severity");

  const rows = (apps as { us_app_name: string; local_alternative_name: string | null; severity: Severity }[]) ?? [];

  const items = rows
    .map((a) => {
      const meta = SEVERITY_META[a.severity];
      const alt = a.local_alternative_name
        ? ` → <strong>${esc(a.local_alternative_name)}</strong>`
        : "";
      return `<li style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #eee">
        <span>${meta.dot}</span>
        <span style="flex:1">${esc(a.us_app_name)}${alt}</span>
      </li>`;
    })
    .join("");

  const countryUrl = `${SITE.url}/country/${country.slug}`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Apps you'll need in ${esc(country.name)}</title></head>
<body style="margin:0;font:14px/1.4 system-ui,-apple-system,sans-serif;color:#0f2a43">
  <div style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;max-width:360px">
    <div style="background:#0f2a43;color:#fff;padding:12px 14px;font-weight:700">
      ${country.flag_emoji ?? ""} Apps you'll need in ${esc(country.name)}
    </div>
    <ul style="list-style:none;margin:0;padding:8px 14px">${items || "<li style='padding:8px 0;color:#64748b'>No data yet</li>"}</ul>
    <a href="${countryUrl}" target="_blank" rel="noopener"
       style="display:block;background:#f4a259;color:#0f2a43;text-align:center;padding:10px;font-weight:600;text-decoration:none">
      See the full guide →
    </a>
    <div style="padding:8px 14px;font-size:11px;color:#94a3b8;text-align:center">
      Powered by <a href="${SITE.brand.main}" target="_blank" rel="noopener" style="color:#94a3b8">The Travel Technician</a>
    </div>
  </div>
</body></html>`;

  return new Response(html, { headers });
}
