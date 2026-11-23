import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/constants";
import { safeNext } from "@/lib/safeRedirect";

// Route handlers that set session cookies must be dynamic.
export const dynamic = "force-dynamic";

// Hosts we are willing to redirect back to when they appear in request
// headers. Anything else falls back to the configured SITE.url, so a spoofed
// Host / X-Forwarded-Host header can never send users to another site.
const ALLOWED_HOSTS = new Set<string>([
  "passport.traveltechnician.info",
  ...(process.env.NODE_ENV === "development" ? ["localhost:3000", "127.0.0.1:3000"] : []),
]);

/**
 * Resolve the absolute base URL to redirect back to.
 *
 * Behind a reverse proxy (nginx on IONOS) `request.url` reports the upstream
 * origin (http://localhost:3000), so the configured site URL is the default.
 * Forwarded headers are honoured only when they name an allow-listed host.
 */
function resolveBaseUrl(request: Request): string {
  const configured = SITE.url.replace(/\/$/, "");
  const h = request.headers;
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim().toLowerCase();
  if (host && ALLOWED_HOSTS.has(host)) {
    const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
    return `${proto}://${host}`;
  }
  return configured;
}

// Exchanges the OAuth/magic-link code for a session, then redirects.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const base = resolveBaseUrl(request);

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${base}${next}`);
      }
      console.error("auth/callback: exchange failed:", error.message);
      return NextResponse.redirect(`${base}/login?error=auth&reason=exchange_failed`);
    } catch (e) {
      // Never let the handler crash the worker — always send the user
      // somewhere useful instead of surfacing a 500/502.
      console.error("auth/callback:", e instanceof Error ? e.message : e);
      return NextResponse.redirect(`${base}/login?error=auth&reason=callback_failed`);
    }
  }

  return NextResponse.redirect(`${base}/login?error=auth&reason=missing_code`);
}
