"use client";

import { useState } from "react";
import Flag from "./Flag";
import { thumbUrl } from "@/lib/imageUrl";

/**
 * Country page hero banner. A branded navy→teal gradient is always the base
 * layer, so the header looks polished even with no photo or a broken URL. When
 * `imageUrl` loads successfully, the photograph fades in on top with a dark
 * overlay for text legibility. If it errors, we silently keep the gradient.
 */
export default function CountryHero({
  name,
  region,
  flagEmoji,
  imageUrl,
  hasAlert,
}: {
  name: string;
  region: string | null;
  flagEmoji: string | null;
  imageUrl: string | null;
  hasAlert?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showPhoto = imageUrl && !failed;

  return (
    <div className="relative h-60 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy via-brand-navylight to-brand-tealdark sm:h-72">
      {/* Subtle emblem watermark on the gradient base */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-56 w-56 opacity-10"
        style={{
          backgroundImage: "url(/brand/emblem-mark.png)",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
        }}
      />

      {showPhoto && (
        // Plain <img> (not next/image) so onError can gracefully fall back.
        <img
          src={thumbUrl(imageUrl, 1200, 500)!}
          alt={`${name} landscape`}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Legibility overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-5">
        <Flag emoji={flagEmoji} size="3rem" className="ring-2 ring-white/70" />
        <div className="min-w-0">
          {region && (
            <p className="text-xs font-medium uppercase tracking-wider text-white/80">
              {region}
            </p>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-4xl">
            {name}
          </h1>
        </div>
        {hasAlert && (
          <span className="ml-auto hidden items-center gap-1 rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold text-amber-950 sm:inline-flex">
            ⚠️ Travel alert
          </span>
        )}
      </div>
    </div>
  );
}
