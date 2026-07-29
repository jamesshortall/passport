// Produce a small thumbnail variant of a hero image URL so country cards don't
// download full-size photos. Handles the sources we use, including Supabase
// Storage (via the on-the-fly image-transformation endpoint); leaves unknown
// URLs untouched.
export function thumbUrl(url: string | null, w = 480, h = 300): string | null {
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
    // the CDN returns a resized ~30KB thumbnail instead of the full-size hero.
    // Without this the browse grid pulls dozens of full images at once, which
    // is slow and causes intermittent load failures on refresh.
    if (url.includes("/storage/v1/object/public/")) {
      const rendered = url.replace(
        "/storage/v1/object/public/",
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
