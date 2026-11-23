import { SITE } from "./constants";

const FALLBACK = "/account";

/**
 * Only allow same-site, path-only redirect targets after login/callback.
 *
 * Rejects anything that browsers could treat as a different host:
 *   - protocol-relative `//evil.com`
 *   - backslash tricks `/\evil.com` (normalised to `//evil.com`)
 *   - absolute URLs, control characters, and backslashes anywhere
 * and finally confirms the resolved URL stays on SITE.url's origin.
 */
export function safeNext(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return FALLBACK;
  if (raw.length > 2048) return FALLBACK;
  if (raw[0] !== "/") return FALLBACK;
  if (raw[1] === "/" || raw[1] === "\\") return FALLBACK;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return FALLBACK;
  try {
    const base = new URL(SITE.url);
    const resolved = new URL(raw, base);
    if (resolved.origin !== base.origin) return FALLBACK;
    return resolved.pathname + resolved.search + resolved.hash;
  } catch {
    return FALLBACK;
  }
}
