// Supabase Edge Function: support-message
// Receives Support Center submissions (contact + feedback) and emails them to
// the support inbox via Resend. Public (no login required) — but the recipient
// is FIXED to the support address, so it can't be used to relay to arbitrary
// addresses. The visitor's email (if provided) becomes the reply-to.
//
// Deploy:  supabase functions deploy support-message --no-verify-jwt
// Secrets: supabase secrets set RESEND_API_KEY=re_...  RESEND_FROM="AppPassport <hello@traveltechnician.info>"
//
// deno-lint-ignore-file no-explicit-any

const SUPPORT_TO = "support@traveltechnician.info";

function esc(s: string) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });

  try {
    const { kind, subject, body, from_email, meta } = await req.json();

    if (!subject || !body) {
      return Response.json({ error: "subject and body are required" }, { status: 400, headers: CORS });
    }
    // Basic abuse guards.
    if (String(body).length > 8000 || String(subject).length > 300) {
      return Response.json({ error: "Message too long" }, { status: 400, headers: CORS });
    }

    const key = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("RESEND_FROM") ?? "AppPassport <onboarding@resend.dev>";
    if (!key) {
      return Response.json({ error: "RESEND_API_KEY not set" }, { status: 500, headers: CORS });
    }

    const label = kind === "feedback" ? "Feedback" : "Contact";
    const metaRows = Object.entries(meta ?? {})
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td style="padding:2px 10px 2px 0;color:#64748b">${esc(k)}</td><td><strong>${esc(String(v))}</strong></td></tr>`)
      .join("");

    const html = `<div style="font:15px system-ui,-apple-system,sans-serif;color:#0f2a43">
      <p style="color:#64748b;margin:0 0 8px">New AppPassport ${esc(label)} submission</p>
      <h2 style="margin:0 0 8px">${esc(subject)}</h2>
      ${metaRows ? `<table style="border-collapse:collapse;margin:0 0 12px">${metaRows}</table>` : ""}
      <div style="white-space:pre-wrap;border-left:3px solid #1f8fa8;padding:8px 12px;background:#f7f9fa">${esc(body)}</div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
      <p style="color:#94a3b8;font-size:12px">From: ${from_email ? esc(from_email) : "no email provided"} · AppPassport Support Center</p>
    </div>`;

    const payload: any = {
      from,
      to: [SUPPORT_TO],
      subject: `[AppPassport ${label}] ${subject}`.slice(0, 200),
      html,
    };
    if (from_email) payload.reply_to = from_email;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return Response.json({ error: await res.text() }, { status: 502, headers: CORS });
    }
    return Response.json({ ok: true }, { headers: CORS });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500, headers: CORS });
  }
});
