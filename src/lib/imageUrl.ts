// Helpers for producing small thumbnail variants of hero images so country
// cards don't download full-size photos.
//
// Two strategies:
//  - staticThumbUrl(): points at a pre-generated static thumbnail object in
//    Supabase Storage (fast, CDN-cached, no on-the-fly transform / quota). This
//    is the preferred source for the browse grid.
//  - renderThumbUrl(): resizes on the fly (Supabase render/image endpoint, or
//    query params for Unsplash/loremflickr). Slower and quota-limited, so it is
//    used only for the large detail-page hero and as a fallback when a static
//    thumbnail doesn't exist yet (e.g. a newly added country).

const STORAGE_PUBLIC_PREFIX = "/storage/v1/object/public/";
const HERO_BUCKET = "country-heroes";

/** On-the-fly resized variant. Leaves unknown hosts untouched. */
export function renderThumbUrl(
  url: string | null,
  w = 480,
  h = 300
): string | null {
  if (!url) return url;
  try {
    // loremflickr: https://loremflickr.com/1600/600/<tag>?lock=..
    if (url.includes("loremflickr.com")) {
      return url.replace(/(loremflickr\.com\/)\d+\/\d+/, `$1${w}/${h}`);
    }
    // Unsplash CDN: control size via query params.
    if (url.includes("images.unsplash.com")) {
      let u = url
        .replace(/([?&])w=\d+/, `$1w=${w}`)
        .replace(/([?&])q=\d+/, `$1q=55`);
      if (!/[?&]w=\d+/.test(u)) u += (u.includes("?") ? "&" : "?") + `w=${w}&q=55`;
      return u;
    }
    // Supabase Storage public object: rewrite to the render/image endpoint so
    // the CDN returns a resized thumbnail instead of the full-size hero.
    if (url.includes(STORAGE_PUBLIC_PREFIX)) {
      const rendered = url.replace(
        STORAGE_PUBLIC_PREFIX,
        "/storage/v1/render/image/public/"
      );
      const sep = rendered.includes("?") ? "&" : "?";
      return `${rendered}${sep}width=${w}&height=${h}&resize=cover&quality=60`;
    }
  } catch {
    /* fall through */
  }
  return url;
}

/**
 * Preferred card thumbnail: the pre-generated static thumb object stored
 * alongside the hero at `country-heroes/thumbs/<path>`. Serving a plain static
 * file (not the transform endpoint) is far faster and avoids the image
 * transformation quota, which was causing thumbnails to load slowly or fail.
 *
 * For non-Supabase hosts (Unsplash/loremflickr) there is no static thumb, so we
 * fall back to their query-param resize, which is already fast and CDN-cached.
 */
export function staticThumbUrl(url: string | null): string | null {
  if (!url) return url;
  const marker = `${STORAGE_PUBLIC_PREFIX}${HERO_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i !== -1) {
    const prefix = url.slice(0, i + marker.length);
    const rest = url.slice(i + marker.length);
    // Already a thumb — don't nest thumbs/thumbs.
    if (rest.startsWith("thumbs/")) return url;
    return `${prefix}thumbs/${rest}`;
  }
  return renderThumbUrl(url, 480, 300);
}

/**
 * First-party thumbnail path, served from the app's own origin out of
 * `public/country-heroes/thumbs/<path>` (populated at build time by
 * scripts/sync-thumbs.mjs). Serving these locally avoids a cross-origin
 * handshake to Supabase and cold CDN misses, which is the fastest option for
 * the browse grid. Returns null for non-Supabase heroes (no local copy).
 */
export function localThumbUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `${STORAGE_PUBLIC_PREFIX}${HERO_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  let rest = url.slice(i + marker.length).split("?")[0];
  if (rest.startsWith("thumbs/")) rest = rest.slice("thumbs/".length);
  return `/${HERO_BUCKET}/thumbs/${rest}`;
}

/**
 * Backwards-compatible on-the-fly resize. Retained for the detail-page hero,
 * which needs a large (1200-wide) render that the 480×300 static thumbs can't
 * supply without upscaling.
 */
export function thumbUrl(url: string | null, w = 480, h = 300): string | null {
  return renderThumbUrl(url, w, h);
}
