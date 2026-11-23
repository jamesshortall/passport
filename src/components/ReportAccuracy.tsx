"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * "Still accurate? 👍 👎" control. A 👎 opens an optional note and files a row
 * in `reports` for admin review. Anonymous reports are allowed (user_id null).
 */
export default function ReportAccuracy({ countryAppId }: { countryAppId: string }) {
  const [state, setState] = useState<"idle" | "note" | "sent">("idle");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(withNote: boolean) {
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("reports").insert({
      country_apps_id: countryAppId,
      user_id: user?.id ?? null,
      note: withNote ? note.trim() || null : null,
      status: "open",
    });
    setBusy(false);
    setState("sent");
  }

  if (state === "sent") {
    return <span className="text-[11px] text-green-600">Thanks — flagged for review</span>;
  }

  if (state === "note") {
    return (
      <div className="flex items-center gap-1">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What's out of date? (optional)"
          className="w-40 rounded border border-slate-300 px-2 py-0.5 text-xs"
        />
        <button
          disabled={busy}
          onClick={() => submit(true)}
          className="rounded bg-brand-navy px-2 py-0.5 text-xs text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-400">
      <span>Still accurate?</span>
      <button
        title="Yes, accurate"
        onClick={() => setState("sent")}
        className="hover:scale-110"
        aria-label="Still accurate"
      >
        👍
      </button>
      <button
        title="No, out of date"
        onClick={() => setState("note")}
        className="hover:scale-110"
        aria-label="Out of date"
      >
        👎
      </button>
    </div>
  );
}
