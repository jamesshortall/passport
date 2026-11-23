"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "apppassport.cookie-consent";

type Consent = "accepted" | "rejected";

/**
 * Lightweight EU cookie-consent banner (accept / reject / manage). Not a full
 * CMP — stores the choice in localStorage. The Cookie Policy references this.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function choose(consent: Consent) {
    try {
      localStorage.setItem(STORAGE_KEY, consent);
    } catch {
      /* ignore storage errors */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          We use essential cookies to keep AppPassport working, plus optional
          analytics to improve it. See our{" "}
          <Link href="/cookies" className="underline hover:text-brand-navy">
            Cookie Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/cookies"
            className="rounded-full border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Manage
          </Link>
          <button
            onClick={() => choose("rejected")}
            className="rounded-full border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Reject
          </button>
          <button
            onClick={() => choose("accepted")}
            className="rounded-full bg-brand-navy px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-navylight"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
