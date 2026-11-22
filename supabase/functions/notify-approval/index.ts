// Supabase Edge Function: notify-approval
// Emails a user when their account is approved or rejected. Uses Resend.
//
// Security: ADMIN-ONLY. The caller must present a valid Supabase user JWT for
// an approved admin (same gate as cache-heroes / draft-country). The function
// accepts the reviewed `profile_id` and looks the email address up server-side,
// so it can never be used to send mail to an arbitrary address. Errors returned
// to the caller are generic; details go to the function logs.
//
// Deploy:  supabase functions deploy notify-approval
// Secrets: supabase secrets set RESEND_API_KEY=re_...  RESEND_FROM="AppPassport <hello@traveltechnician.info>"
//
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DECISIONS = new Set(["approved", "rejected"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // --- Gate: caller must be an approved admin ---------------------------
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Service-role client: admin check + recipient lookup bypass RLS.
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: caller } = await admin
      .from("profiles")
      .select("role, approval_status")
      .eq("user_id", user.id)
      .single();
    if (!caller || caller.role !== "admin" || caller.approval_status !== "approved") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    // --- Input: which profile was reviewed, and the outcome ------------------
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    const profileId = typeof body.profile_id === "string" ? body.profile_id : "";
    const decision = typeof body.decision === "string" ? body.decision : "";
    if (!UUID_RE.test(profileId) || !DECISIONS.has(decision)) {
      return Response.json({ error: "profile_id and decision (approved|rejected) required" }, { status: 400 });
    }

    // Recipient comes from the database, never from the request.
    const { data: target } = await admin
      .from("profiles")
      .select("email, approval_status")
      .eq("id", profileId)
      .maybeSingle();
    if (!target?.email) return Response.json({ error: "Profile not found" }, { status: 404 });
    // Only notify about the decision actually recorded on the profile.
    if (target.approval_status !== decision) {
      return Response.json({ error: "Decision does not match profile status" }, { status: 409 });
    }

    const key = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("RESEND_FROM") ?? "AppPassport <onboarding@resend.dev>";
    if (!key) {
      console.error("notify-approval: RESEND_API_KEY not set");
      return Response.json({ error: "Email not configured" }, { status: 500 });
    }

    const approved = decision === "approved";
    const subject = approved
      ? "Your AppPassport account is approved 🎉"
      : "About your AppPassport account";
    const html = approved
      ? `<p>Good news — your AppPassport account has been approved.</p>
         <p>You can now save countries and get update alerts. Happy travels!</p>
         <p><a href="https://passport.traveltechnician.info">Open AppPassport</a></p>`
      : `<p>Thanks for your interest in AppPassport.</p>
         <p>Your account wasn't approved at this time. If you think this was a mistake,
         reply to this email or reach us via The Travel Technician.</p>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from,
        to: [target.email],
        subject,
        html: `<div style="font:15px system-ui">${html}<hr><p style="color:#94a3b8;font-size:12px">The Travel Technician</p></div>`,
      }),
    });

    if (!res.ok) {
      console.error("notify-approval: resend error", res.status, await res.text());
      return Response.json({ error: "Email provider error" }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("notify-approval:", e);
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
});
