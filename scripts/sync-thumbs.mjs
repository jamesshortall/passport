// Sync country thumbnails into public/ so they're served first-party by the
// app's own origin instead of cross-origin from Supabase Storage's CDN.
//
// Why: the browse grid loads ~17 thumbnails per page. Fetching each from
// Supabase means a separate TLS handshake to another host plus frequent cold
// CDN misses to the us-west-2 origin — a slow waterfall. Serving them from
// public/ puts them on the same HTTP/2 connection as the page and on local
// disk, which is dramatically faster.
//
// Runs automatically before `next build` (see package.json "prebuild"). It is
// intentionally non-fatal: if Supabase is unreachable or env is missing, it
// warns and exits 0 so the build still succeeds — the app falls back to the
// Supabase URL for any thumbnail that isn't present locally.
//
// Manual run:  node scripts/sync-thumbs.mjs
// Skip:        SKIP_THUMB_SYNC=1 npm run build

import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const BUCKET = "country-heroes";
const OUT_DIR = join("public", BUCKET, "thumbs");
const THUMB_W = 480;
const THUMB_H = 300;

if (process.env.SKIP_THUMB_SYNC === "1") {
  console.log("[sync-thumbs] SKIP_THUMB_SYNC=1 — skipping.");
  process.exit(0);
}

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn("[sync-thumbs] Missing Supabase env — skipping (app will use remote thumbnails).");
  process.exit(0);
}

// Storage path (inside BUCKET) for a hero already stored in our bucket.
function storagePathOf(heroUrl) {
  const marker = `/object/public/${BUCKET}/`;
  const i = heroUrl.indexOf(marker);
  if (i === -1) return null;
  return heroUrl.slice(i + marker.length).split("?")[0];
}

async function fetchOk(u) {
  try {
    const res = await fetch(u);
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

async function main() {
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("countries")
    .select("slug, hero_image_url")
    .not("hero_image_url", "is", null);

  if (error) {
    console.warn(`[sync-thumbs] countries query failed (${error.message}) — skipping.`);
    return;
  }

  let wrote = 0;
  const missing = [];
  for (const c of data ?? []) {
    const sp = storagePathOf(c.hero_image_url);
    if (!sp) continue; // non-Supabase hero (e.g. Unsplash) — no local copy

    // Prefer the pre-generated static thumb; fall back to an on-the-fly render
    // (covers countries whose static thumb hasn't been generated yet).
    const staticThumb = `${url}/storage/v1/object/public/${BUCKET}/thumbs/${sp}`;
    const rendered = `${url}/storage/v1/render/image/public/${BUCKET}/${sp}?width=${THUMB_W}&height=${THUMB_H}&resize=cover&quality=60`;

    const res = (await fetchOk(staticThumb)) || (await fetchOk(rendered));
    if (!res) {
      missing.push(c.slug);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const dest = join(OUT_DIR, sp);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    wrote++;
  }

  console.log(
    `[sync-thumbs] wrote ${wrote} thumbnails to ${OUT_DIR}` +
      (missing.length ? ` — no thumb for: ${missing.join(", ")}` : "")
  );
}

main().catch((e) => {
  console.warn(`[sync-thumbs] non-fatal error: ${e?.message ?? e}`);
  process.exit(0);
});
