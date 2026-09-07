"use client";

import { useEffect, useState } from "react";

/** Shows an "available offline" badge once this page has been cached by the SW. */
export default function OfflineBadge() {
  const [cached, setCached] = useState(false);

  useEffect(() => {
    if (!("caches" in window)) return;
    caches
      .match(window.location.pathname)
      .then((res) => setCached(!!res))
      .catch(() => {});
  }, []);

  if (!cached) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
      ⬇ Available offline
    </span>
  );
}
