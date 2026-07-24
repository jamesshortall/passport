"use client";

import { useState } from "react";

export default function CountryAlertBanner({
  alert,
  detail,
}: {
  alert: string;
  detail: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-hidden>
          ⚠️
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-amber-900">Heads up before you go</p>
          <p className="mt-1 text-sm text-amber-800">{alert}</p>
          {detail && (
            <>
              {open && (
                <p className="mt-2 text-sm leading-relaxed text-amber-800">{detail}</p>
              )}
              <button
                onClick={() => setOpen((o) => !o)}
                className="mt-2 text-xs font-medium text-amber-900 underline"
                aria-expanded={open}
              >
                {open ? "Show less" : "Read more"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
