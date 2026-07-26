// Produce a small thumbnail variant of a hero image URL so country cards don't
// download full-size (1600px) photos. Handles the sources we use; leaves
// unknown URLs (e.g. Supabase Storage uploads) untouched.
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
  } catch {
    /* fall through */
  }
  return url;
}
