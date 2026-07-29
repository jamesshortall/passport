import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/constants";

// Route handlers that set session cookies must be dynamic.
export const dynamic = "force-dynamic";

// Only allow same-site relative redirects to avoid open-redirect issues.
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/account";
}

/**
 * Resolve the absolute base URL to redirect back to.
 *
 * Behind a reverse proxy (nginx on IONOS) `request.url` often reports the
 * upstream origin (e.g. http://localhost:3000), which would send the browser
 * to localhost after login. Prefer the proxied host headers, then the
 * configured site URL, and only fall back to the request origin.
 */
function resolveBaseUrl(request: Request): string {
  const h = request.headers;
  const forwardedHost = h.get("x-forwarded-host") ?? h.get("host");
  const forwardedProto = h.get("x-forwarded-proto") ?? "https";
  if (forwardedHost && !forwardedHost.startsWith("localhost") && !forwardedHost.startsWith("127.")) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  if (SITE.url) return SITE.url.replace(/\/$/, "");
  return new URL(request.url).origin;
}

// Exchanges the OAuth/magic-link code for a session, then redirects.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const base = resolveBaseUrl(request);

  if (code) {
    try {
      const supabase = createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${base}${next}`);
      }
      return NextResponse.redirect(
        `${base}/login?error=auth&reason=${encodeURIComponent(error.message)}`
      );
    } catch (e) {
      // Never let the handler crash the worker — always send the user
      // somewhere useful instead of surfacing a 500/502.
      const reason = e instanceof Error ? e.message : "callback_failed";
      return NextResponse.redirect(
        `${base}/login?error=auth&reason=${encodeURIComponent(reason)}`
      );
    }
  }

  return NextResponse.redirect(`${base}/login?error=auth`);
}
