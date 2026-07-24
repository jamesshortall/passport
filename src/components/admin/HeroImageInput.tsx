"use client";

import { useState, useTransition } from "react";
import { setCountryHeroImage } from "@/app/admin/actions";

/** Inline hero-image URL editor for a country row in /admin. */
export default function HeroImageInput({
  countryId,
  initial,
}: {
  countryId: string;
  initial: string | null;
}) {
  const [url, setUrl] = useState(initial ?? "");
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const res = await setCountryHeroImage(countryId, url);
      setNote(res.message ?? (res.ok ? "Saved" : "Failed"));
    });
  }

  return (
    <div className="flex w-full items-center gap-2">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Hero image URL (https://…)"
        className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
      />
      <button
        onClick={save}
        disabled={pending}
        className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        {pending ? "…" : "Save image"}
      </button>
      {note && <span className="shrink-0 text-xs text-slate-400">{note}</span>}
    </div>
  );
}
