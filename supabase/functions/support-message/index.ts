// Supabase Edge Function: support-message
// Receives Support Center submissions (contact + feedback) and emails them to
// the support inbox via Resend. Public (no login required) — but the recipient
// is FIXED to the support address, so it can't be used to relay to arbitrary
// addresses. The visitor's email (if provided and valid) becomes the reply-to.
//
// Abuse controls:
//   * CORS restricted to the site origin — browsers elsewhere get 403. Set
//     SUPPORT_ALLOW_LOCALHOST=1 to also accept http://localhost:3000 in dev.
//   * Per-IP rate limit (5 / hour, keyed on a SHA-256 of the first X-Forwarded-For
//     hop) and a global ceiling (60 / hour), backed by public.consume_rate_limit
//     (migration 0009). Fails closed; the client falls back to mailto: so no
//     message is lost.
//   * Optional Cloudflare Turnstile: when TURNSTILE_SECRET is set, the request
//     must include a valid `turnstile_token` (the form needs the matching site
//     key). Not required — leave the secret unset to skip the check.
//   * Strict input validation: whitelisted `kind`, bounded lengths, RFC-ish
//     email check for reply-to (prevents header injection), bounded meta,
//     CR/LF stripped from the subject. Errors returned to callers are generic.
//
// Deploy:  supabase functions deploy support-message --no-verify-jwt
// Secrets: supabase secrets set RESEND_API_KEY=re_...  RESEND_FROM="AppPassport <hello@traveltechnician.info>"
// Optional: supabase secrets set SUPPORT_ALLOW_LOCALHOST=1   TURNSTILE_SECRET=0x...
//
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPPORT_TO = "support@traveltechnician.info";

const ALLOWED_ORIGINS = new Set<string>([
  "https://passport.traveltechnician.info",
  ...(Deno.env.get("SUPPORT_ALLOW_LOCALHOST") === "1" ? ["http://localhost:3000"] : []),
]);

const PER_IP_LIMIT = 5; // submissions
const PER_IP_WINDOW = 60 * 60; // seconds (1 hour)
const GLOBAL_LIMIT = 60;
const GLOBAL_WINDOW = 60 * 60;

async function turnstileOk(token: unknown, ip: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET");
  if (!secret) return true; // not configured — check disabled
  if (typeof token !== "string" || !token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    });
    const j = await res.json();
    return j?.success === true;
  } catch {
    return false;
  }
}

const KINDS = new Set(["contact", "feedback"]);
// Pragmatic email check: one @, no whitespace/control chars, sane length.
const EMAIL_RE = /^[^\s@<>()[\],;:"\\]+@[^\s@<>()[\],;:"\\]+\.[A-Za-z]{2,}$/;

function esc(s: string) {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string)
  );
}

function corsFor(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : [...ALLOWED_ORIGINS][0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "unknown";
}

async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const CORS = corsFor(origin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });

  // Browsers always send Origin on cross-site POSTs; reject unknown sites.
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return Response.json({ error: "Origin not allowed" }, { status: 403, headers: CORS });
  }

  try {
    // --- Rate limiting (fails closed) ---------------------------------------
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const ipKey = `support:ip:${await sha256(clientIp(req))}`;
    const [{ data: ipOk, error: ipErr }, { data: globalOk, error: gErr }] = await Promise.all([
      supabase.rpc("consume_rate_limit", { p_key: ipKey, p_limit: PER_IP_LIMIT, p_window_seconds: PER_IP_WINDOW }),
      supabase.rpc("consume_rate_limit", { p_key: "support:global", p_limit: GLOBAL_LIMIT, p_window_seconds: GLOBAL_WINDOW }),
    ]);
    if (ipErr || gErr) {
      console.error("rate limit unavailable:", ipErr?.message ?? gErr?.message);
      return Response.json({ error: "Temporarily unavailable" }, { status: 503, headers: CORS });
    }
    if (ipOk === false || globalOk === false) {
      return Response.json(
        { error: "Too many messages — please try again later." },
        { status: 429, headers: { ...CORS, "Retry-After": String(PER_IP_WINDOW) } },
      );
    }
    // Opportunistic cleanup; ignore failures.
    if (Math.random() < 0.05) supabase.rpc("purge_rate_limits", { p_older_than_seconds: 86400 }).then(() => {}, () => {});

    // --- Input validation ----------------------------------------------------
    let input: any;
    try {
      input = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400, headers: CORS });
    }
    if (!(await turnstileOk(input?.turnstile_token, clientIp(req)))) {
      return Response.json({ error: "Verification failed" }, { status: 403, headers: CORS });
    }

    const kind = KINDS.has(input?.kind) ? (input.kind as string) : "contact";
    const subject = typeof input?.subject === "string" ? input.subject.trim() : "";
    const body = typeof input?.body === "string" ? input.body.trim() : "";
    if (!subject || !body) {
      return Response.json({ error: "subject and body are required" }, { status: 400, headers: CORS });
    }
    if (body.length > 8000 || subject.length > 300) {
      return Response.json({ error: "Message too long" }, { status: 400, headers: CORS });
    }

    let fromEmail: string | null = null;
    if (input?.from_email) {
      const candidate = String(input.from_email).trim();
      if (candidate.length > 254 || !EMAIL_RE.test(candidate)) {
        return Response.json({ error: "Invalid email address" }, { status: 400, headers: CORS });
      }
      fromEmail = candidate;
    }

    const meta: [string, string][] = [];
    if (input?.meta && typeof input.meta === "object" && !Array.isArray(input.meta)) {
      for (const [k, v] of Object.entries(input.meta).slice(0, 10)) {
        if (v === null || v === undefined || v === "") continue;
        meta.push([String(k).slice(0, 60), String(v).slice(0, 200)]);
      }
    }

    const key = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("RESEND_FROM") ?? "AppPassport <onboarding@resend.dev>";
    if (!key) {
      return Response.json({ error: "RESEND_API_KEY not set" }, { status: 500, headers: CORS });
    }

    // --- Compose + send ------------------------------------------------------
    const label = kind === "feedback" ? "Feedback" : "Contact";
    const metaRows = meta
      .map(([k, v]) => `<tr><td style="padding:2px 10px 2px 0;color:#64748b">${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`)
      .join("");

    const html = `<div style="font:15px system-ui,-apple-system,sans-serif;color:#0f2a43">
      <p style="color:#64748b;margin:0 0 8px">New AppPassport ${esc(label)} submission</p>
      <h2 style="margin:0 0 8px">${esc(subject)}</h2>
      ${metaRows ? `<table style="border-collapse:collapse;margin:0 0 12px">${metaRows}</table>` : ""}
      <div style="white-space:pre-wrap;border-left:3px solid #1f8fa8;padding:8px 12px;background:#f7f9fa">${esc(body)}</div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
      <p style="color:#94a3b8;font-size:12px">From: ${fromEmail ? esc(fromEmail) : "no email provided"} · AppPassport Support Center</p>
    </div>`;

    const payload: Record<string, unknown> = {
      from,
      to: [SUPPORT_TO],
      subject: `[AppPassport ${label}] ${subject.replace(/[\r\n]+/g, " ")}`.slice(0, 200),
      html,
    };
    if (fromEmail) payload.reply_to = fromEmail;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("resend error:", res.status, await res.text());
      return Response.json({ error: "Email provider rejected the message" }, { status: 502, headers: CORS });
    }
    return Response.json({ ok: true }, { headers: CORS });
  } catch (e) {
    console.error("support-message:", e);
    return Response.json({ error: "Unexpected error" }, { status: 500, headers: CORS });
  }
});
