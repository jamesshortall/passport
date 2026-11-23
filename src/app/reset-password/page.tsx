"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import UpdatePasswordForm from "@/components/UpdatePasswordForm";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setStatus(data.user ? "ready" : "invalid");
    });
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-extrabold text-brand-navy">Set a new password</h1>

      {status === "checking" && <p className="mt-3 text-sm text-slate-500">Verifying your link…</p>}

      {status === "invalid" && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This reset link is invalid or has expired. Request a new one from the{" "}
          <Link href="/login" className="font-medium underline">sign-in page</Link>.
        </div>
      )}

      {status === "ready" && (
        <>
          <p className="mt-1 text-sm text-slate-500">Choose a new password for your account.</p>
          <div className="mt-5">
            <UpdatePasswordForm submitLabel="Save new password" redirectTo="/account" />
          </div>
        </>
      )}
    </div>
  );
}
