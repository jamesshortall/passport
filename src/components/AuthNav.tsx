"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import SignOutButton from "./SignOutButton";

type AuthState = "unknown" | "anon" | "signed-in";

/**
 * Tracks the browser's Supabase session so auth-aware UI can live inside
 * statically cached pages. The server never reads the session for public
 * pages (that would bake one visitor's state into HTML served to everyone);
 * the client resolves it after hydration and keeps it in sync on auth changes.
 */
function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>("unknown");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) setState(session ? "signed-in" : "anon");
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? "signed-in" : "anon");
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

/** Renders children only for signed-in visitors (nothing until known). */
export function AuthOnly({ children }: { children: ReactNode }) {
  const state = useAuthState();
  return state === "signed-in" ? <>{children}</> : null;
}

/** Header auth controls: Support link + Account / Sign out, or Sign in. */
export default function AuthNav() {
  const state = useAuthState();

  // Reserve the slot while the session is being resolved so the nav doesn't
  // jump; nothing user-specific is ever in the server-rendered HTML.
  if (state === "unknown") {
    return <span className="inline-block h-8 w-20" aria-hidden />;
  }

  if (state === "anon") {
    return (
      <Link
        href="/login"
        className="rounded-full bg-brand-navy px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-navylight"
      >
        Sign in
      </Link>
    );
  }

  return (
    <span className="flex items-center gap-1.5">
      <Link
        href="/support"
        className="hidden rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-brand-navy lg:inline"
      >
        Support
      </Link>
      <Link
        href="/account"
        className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-brand-navy"
      >
        Account
      </Link>
      <SignOutButton />
    </span>
  );
}
