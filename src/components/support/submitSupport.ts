import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SITE } from "@/lib/constants";

export type SubmitResult = { ok: boolean; via: "email" | "mailto" | "error"; message: string };

/**
 * Sends a support message. Tries the `support-message` Edge Function (which
 * emails support@ via Resend); if that isn't configured/available yet, falls
 * back to opening the visitor's mail client with a prefilled message so nothing
 * is ever lost.
 */
export async function submitSupport(input: {
  kind: "contact" | "feedback";
  subject: string;
  body: string;
  fromEmail?: string;
  meta?: Record<string, string>;
}): Promise<SubmitResult> {
  const metaLines = input.meta
    ? Object.entries(input.meta)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")
    : "";
  const fullBody = [metaLines, metaLines ? "\n" : "", input.body].join("").trim();

  // 1) Try the server-side email (Resend edge function).
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.functions.invoke("support-message", {
      body: {
        kind: input.kind,
        subject: input.subject,
        body: fullBody,
        from_email: input.fromEmail ?? null,
        meta: input.meta ?? {},
      },
    });
    if (!error && (data as any)?.ok) {
      return { ok: true, via: "email", message: "Message sent — thanks! We'll be in touch." };
    }
  } catch {
    /* fall through to mailto */
  }

  // 2) Fallback: open the mail client prefilled.
  const subject = encodeURIComponent(`[AppPassport] ${input.subject}`);
  const bodyParts = [fullBody];
  if (input.fromEmail) bodyParts.push(`\n\nReply to: ${input.fromEmail}`);
  const body = encodeURIComponent(bodyParts.join(""));
  const href = `mailto:${SITE.supportEmail}?subject=${subject}&body=${body}`;
  if (typeof window !== "undefined") window.location.href = href;

  return {
    ok: true,
    via: "mailto",
    message: "Opening your email app to send the message to our support team…",
  };
}
