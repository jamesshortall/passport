"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SITE } from "@/lib/constants";

type Mode = "signin" | "signup";

// Only allow same-site relative redirects to avoid open-redirect issues.
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/account";
}

export default function LoginPage() {
  const router = useRouter();
  const [next, setNext] = useState("/account");
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(safeNext(params.get("next")));
  }, []);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    const supabase = createSupabaseBrowserClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${SITE.url}/auth/callback` },
      });
      setBusy(false);
      if (error) return setErr(error.message);
      setMsg(
        "Account created! Your account is awaiting admin approval — you'll get an email when it's reviewed. If email confirmation is on, confirm your address first."
      );
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setErr(error.message);
      router.push(next);
      router.refresh();
    }
  }

  async function handleGoogle() {
    setErr(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${SITE.url}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setErr(error.message);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-extrabold text-brand-navy">
        {mode === "signin" ? "Sign in" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Save countries and get update alerts. New accounts need admin approval
        before authenticated features unlock.
      </p>

      {err && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}
      {msg && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {msg}
        </div>
      )}

      <form onSubmit={handleEmail} className="mt-6 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navylight disabled:opacity-50"
        >
          {busy ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        onClick={handleGoogle}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-slate-500">
        {mode === "signin" ? (
          <>
            No account?{" "}
            <button onClick={() => setMode("signup")} className="font-medium text-brand-navy underline">
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have one?{" "}
            <button onClick={() => setMode("signin")} className="font-medium text-brand-navy underline">
              Sign in
            </button>
          </>
        )}
      </p>

      <p className="mt-8 text-center text-xs text-slate-400">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline">Terms</Link> and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}
