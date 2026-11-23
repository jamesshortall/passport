"use client";

import { useState, useTransition } from "react";

type Result = { ok: boolean; message?: string };

/** Generic button that runs a server action and surfaces the result inline. */
export default function AdminButton({
  action,
  label,
  className = "",
  confirm,
}: {
  action: () => Promise<Result>;
  label: string;
  className?: string;
  confirm?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  function run() {
    if (confirm && !window.confirm(confirm)) return;
    startTransition(async () => {
      const res = await action();
      if (!res.ok) setNote(res.message ?? "Something went wrong");
      else if (res.message) setNote(res.message);
    });
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        onClick={run}
        disabled={pending}
        className={`rounded-md px-3 py-1 text-sm font-medium disabled:opacity-50 ${className}`}
      >
        {pending ? "…" : label}
      </button>
      {note && <span className="mt-1 text-xs text-slate-500">{note}</span>}
    </span>
  );
}
