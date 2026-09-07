"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Sets a new password for the currently-authenticated session (used both for
 * "change password" on the account page and "reset password" after clicking
 * the emailed recovery link, since both result in an active session).
 */
export default function UpdatePasswordForm({
  submitLabel = "Update password",
  redirectTo,
}: {
  submitLabel?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (pw.length < 8) return setErr("Use at least 8 characters.");
    if (pw !== confirm) return setErr("Passwords don't match.");

    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr(error.message);

    setDone(true);
    setPw("");
    setConfirm("");
    if (redirectTo) {
      setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, 1200);
    }
  }

  if (done) {
    return (
      <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
        ✅ Password updated{redirectTo ? " — redirecting…" : "."}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {err && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">{err}</p>
      )}
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="New password (min 8 characters)"
        autoComplete="new-password"
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        autoComplete="new-password"
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-brand-navy px-5 py-2 text-sm font-semibold text-white hover:bg-brand-navylight disabled:opacity-50"
      >
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
