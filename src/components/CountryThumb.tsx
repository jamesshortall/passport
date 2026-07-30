"use client";

import { useMemo, useState } from "react";
import Flag from "./Flag";
import { renderThumbUrl, staticThumbUrl } from "@/lib/imageUrl";

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
  const [idx, setIdx] = useState(0);

  // Try the fast pre-generated static thumb first, then fall back to the
  // on-the-fly transform (covers newly added countries with no static thumb
  // yet), then the gradient base. Ordered, de-duplicated list of sources.
  const sources = useMemo(() => {
    const list = [staticThumbUrl(imageUrl), renderThumbUrl(imageUrl, 480, 300)];
    return Array.from(new Set(list.filter((s): s is string => Boolean(s))));
  }, [imageUrl]);

  const src = sources[idx];
  const showPhoto = Boolean(src) && !failed;

  return (
    <div className={`relative w-full overflow-hidden bg-gradient-to-br from-brand-navy via-brand-navylight to-brand-tealdark ${className}`}>
      {showPhoto && (
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false);
            if (idx + 1 < sources.length) setIdx((i) => i + 1);
            else setFailed(true);
          }}
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
