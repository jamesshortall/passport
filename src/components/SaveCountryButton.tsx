"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ApprovalStatus } from "@/lib/types";

/**
 * Auth-gated "Save" toggle for favorites. Only APPROVED users can save (RLS
 * enforces this too — the UI just fails gracefully). Pending users are told
 * their account is awaiting approval.
 */
export default function SaveCountryButton({ countryId }: { countryId: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [approval, setApproval] = useState<ApprovalStatus | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setReady(true);
        return;
      }
      setUserId(user.id);

      const [{ data: profile }, { data: fav }] = await Promise.all([
        supabase.from("profiles").select("approval_status").eq("user_id", user.id).maybeSingle(),
        supabase.from("favorites").select("id").eq("user_id", user.id).eq("country_id", countryId).maybeSingle(),
      ]);
      setApproval((profile?.approval_status as ApprovalStatus) ?? "pending");
      setSaved(!!fav);
      setReady(true);
    })();
  }, [countryId]);

  async function toggle() {
    if (!userId) return;
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    if (saved) {
      await supabase.from("favorites").delete().eq("user_id", userId).eq("country_id", countryId);
      setSaved(false);
    } else {
      const { error } = await supabase.from("favorites").insert({ user_id: userId, country_id: countryId });
      if (!error) setSaved(true);
    }
    setBusy(false);
  }

  if (!ready) return null;

  if (!userId) {
    return (
      <Link
        href="/login"
        className="shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
      >
        ☆ Save
      </Link>
    );
  }

  if (approval !== "approved") {
    return (
      <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
        Awaiting approval
      </span>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm disabled:opacity-50 ${
        saved
          ? "border-brand-accent bg-brand-accent/10 text-brand-accentdark"
          : "border-slate-300 text-slate-600 hover:bg-slate-50"
      }`}
    >
      {saved ? "★ Saved" : "☆ Save"}
    </button>
  );
}
