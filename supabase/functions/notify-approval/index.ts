// Supabase Edge Function: notify-approval
// Emails a user when their account is approved or rejected. Uses Resend.
//
// Deploy:  supabase functions deploy notify-approval
// Secrets: supabase secrets set RESEND_API_KEY=re_...  RESEND_FROM="AppPassport <hello@traveltechnician.info>"
//
// deno-lint-ignore-file no-explicit-any

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const { email, decision } = await req.json();
    if (!email || !decision) {
      return Response.json({ error: "email and decision required" }, { status: 400 });
    }

    const key = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("RESEND_FROM") ?? "AppPassport <onboarding@resend.dev>";
    if (!key) return Response.json({ error: "RESEND_API_KEY not set" }, { status: 500 });

    const approved = decision === "approved";
    const subject = approved
      ? "Your AppPassport account is approved 🎉"
      : "About your AppPassport account";
    const body = approved
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
        to: [email],
        subject,
        html: `<div style="font:15px system-ui">${body}<hr><p style="color:#94a3b8;font-size:12px">The Travel Technician</p></div>`,
      }),
    });

    if (!res.ok) {
      return Response.json({ error: await res.text() }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
