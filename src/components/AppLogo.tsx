"use client";

import { useState } from "react";
import { domainForApp, logoUrlForDomain } from "@/lib/appLogos";

/**
 * Shows an app's brand logo. Falls back to a lettered avatar (guaranteed to
 * look intentional) when we have no domain or the logo fails to load.
 */
export default function AppLogo({ name, size = 40 }: { name: string; size?: number }) {
  const domain = domainForApp(name);
  const [failed, setFailed] = useState(false);
  const letter = (name.trim()[0] || "?").toUpperCase();

  const showImg = domain && !failed;

  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white"
      style={{ width: size, height: size }}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrlForDomain(domain!)}
          alt=""
          width={size - 12}
          height={size - 12}
          onError={() => setFailed(true)}
          className="object-contain"
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center bg-brand-navy/5 font-display font-bold text-brand-navy"
          style={{ fontSize: size * 0.42 }}
        >
          {letter}
        </span>
      )}
    </span>
  );
}
