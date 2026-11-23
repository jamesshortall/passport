"use client";

import { useState, useTransition } from "react";
import { generateCountryDraft } from "@/app/admin/actions";

export default function GenerateDraftForm() {
  const [name, setName] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await generateCountryDraft(name);
      setNote(res.message ?? (res.ok ? "Done" : "Failed"));
      if (res.ok) setName("");
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Country name (e.g. Vietnam)"
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-accent px-3 py-1.5 text-sm font-medium text-brand-navy hover:bg-brand-accentdark disabled:opacity-50"
      >
        {pending ? "Researching…" : "✨ Generate Draft"}
      </button>
      {note && <span className="w-full text-xs text-slate-500">{note}</span>}
    </form>
  );
}
