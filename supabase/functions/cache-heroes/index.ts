// Supabase Edge Function: cache-heroes
// Downloads each country's external hero photo once, stores it in the
// `country-heroes` Storage bucket, and repoints hero_image_url at the fast
// Supabase CDN. Also generates a static 480x300 thumbnail at
// `country-heroes/thumbs/<path>` that the browse grid loads directly (fast,
// CDN-cached, no on-the-fly transform). Admin-gated. Idempotent.
//
// Deploy:  supabase functions deploy cache-heroes
//
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "country-heroes";
const THUMB_W = 480;
const THUMB_H = 300;

// Fetch a medium size (fast + good enough for hero and cards) from the source.
function mediumize(url: string): string {
  if (url.includes("loremflickr.com")) {
    return url.replace(/(loremflickr\.com\/)\d+\/\d+/, "$11000/560");
  }
  if (url.includes("images.unsplash.com")) {
    let u = url.replace(/([?&])w=\d+/, "$1w=1000").replace(/([?&])q=\d+/, "$1q=70");
    if (!/[?&]w=\d+/.test(u)) u += (u.includes("?") ? "&" : "?") + "w=1000&q=70";
    return u;
  }
  return url;
}

function extFor(ct: string): string {
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("avif")) return "avif";
  return "jpg";
}

// Storage path (inside BUCKET) of a hero already stored in our bucket.
function storagePathOf(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return url.slice(i + marker.length).split("?")[0];
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Admin gate.
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { data: profile } = await supabase
      .from("profiles").select("role, approval_status").eq("user_id", user.id).single();
    if (!profile || profile.role !== "admin" || profile.approval_status !== "approved") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    // Does a thumb already exist for this storage path?
    async function thumbExists(path: string): Promise<boolean> {
      const slash = path.lastIndexOf("/");
      const dir = slash === -1 ? "thumbs" : `thumbs/${path.slice(0, slash)}`;
      const name = slash === -1 ? path : path.slice(slash + 1);
      const { data } = await supabase.storage.from(BUCKET).list(dir, { search: name, limit: 100 });
      return (data ?? []).some((o: any) => o.name === name);
    }

    // Generate a static thumb from the stored object via the render endpoint.
    // `bust` forces a fresh transform when the underlying object was replaced.
    async function generateThumb(path: string, bust: boolean): Promise<boolean> {
      const cb = bust ? `&cb=${Date.now()}` : "";
      const renderUrl =
        `${SUPABASE_URL}/storage/v1/render/image/public/${BUCKET}/${path}` +
        `?width=${THUMB_W}&height=${THUMB_H}&resize=cover&quality=60${cb}`;
      const res = await fetch(renderUrl);
      if (!res.ok) return false;
      const ct = res.headers.get("content-type") || "image/jpeg";
      if (!ct.startsWith("image/")) return false;
      const bytes = new Uint8Array(await res.arrayBuffer());
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(`thumbs/${path}`, bytes, {
          contentType: ct,
          upsert: true,
          cacheControl: "31536000",
        });
      return !error;
    }

    const { data: countries } = await supabase
      .from("countries")
      .select("id, slug, hero_image_url")
      .not("hero_image_url", "is", null);

    let cached = 0;
    let skipped = 0;
    let thumbed = 0;
    let thumbSkipped = 0;
    const failed: string[] = [];
    const thumbFailed: string[] = [];

    for (const c of (countries ?? []) as any[]) {
      const src: string = c.hero_image_url;
      let storagePath: string | null = null;
      let replaced = false;

      if (src.includes(`/object/public/${BUCKET}/`)) {
        // Already in our bucket — just make sure a thumb exists.
        storagePath = storagePathOf(src);
        skipped++;
      } else {
        // External hero — download it into our bucket, then repoint the URL.
        try {
          const res = await fetch(mediumize(src), { redirect: "follow" });
          if (!res.ok) { failed.push(c.slug); continue; }
          const ct = res.headers.get("content-type") || "image/jpeg";
          if (!ct.startsWith("image/")) { failed.push(c.slug); continue; }
          const bytes = new Uint8Array(await res.arrayBuffer());
          const path = `${c.slug}.${extFor(ct)}`;
          const { error: upErr } = await supabase.storage
            .from(BUCKET)
            .upload(path, bytes, { contentType: ct, upsert: true, cacheControl: "31536000" });
          if (upErr) { failed.push(c.slug); continue; }
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
          await supabase.from("countries").update({ hero_image_url: pub.publicUrl }).eq("id", c.id);
          storagePath = path;
          replaced = true;
          cached++;
        } catch {
          failed.push(c.slug);
          continue;
        }
      }

      if (!storagePath) { thumbFailed.push(c.slug); continue; }

      // Regenerate the thumb whenever we just replaced the hero; otherwise only
      // create it if it's missing (backfills countries that never had one).
      if (replaced || !(await thumbExists(storagePath))) {
        const ok = await generateThumb(storagePath, replaced);
        if (ok) thumbed++;
        else thumbFailed.push(c.slug);
      } else {
        thumbSkipped++;
      }
    }

    return Response.json({
      ok: true,
      cached,
      skipped,
      thumbed,
      thumbSkipped,
      failed,
      thumbFailed,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
