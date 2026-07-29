"use client";

import { useState } from "react";
import Flag from "./Flag";
import { thumbUrl } from "@/lib/imageUrl";

/**
 * Photo thumbnail for a country card. Branded gradient base always renders;
 * the photo fades in on top and falls back gracefully if it fails to load.
 */
export default function CountryThumb({
  imageUrl,
  flagEmoji,
  hasAlert,
  className = "h-32",
}: {
  imageUrl: string | null;
  flagEmoji: string | null;
  hasAlert?: boolean;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const showPhoto = imageUrl && !failed;

  // Retry a stalled/failed thumbnail once before falling back to the gradient,
  // so a transient network blip doesn't leave a permanent gap on refresh.
  const base = thumbUrl(imageUrl, 480, 300);
  const src =
    base && attempt > 0
      ? `${base}${base.includes("?") ? "&" : "?"}retry=${attempt}`
      : base;

  return (
    <div className={`relative w-full overflow-hidden bg-gradient-to-br from-brand-navy via-brand-navylight to-brand-tealdark ${className}`}>
      {showPhoto && (
        <img
          src={src!}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => (attempt < 1 ? setAttempt((a) => a + 1) : setFailed(true))}
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      <div className="absolute left-2.5 top-2.5">
        <Flag emoji={flagEmoji} size="1.6rem" className="ring-2 ring-white/80 shadow" />
      </div>
      {hasAlert && (
        <span className="absolute right-2.5 top-2.5 rounded-full bg-amber-400/95 px-2 py-0.5 text-[10px] font-bold text-amber-950 shadow">
          ALERT
        </span>
      )}
    </div>
  );
}
