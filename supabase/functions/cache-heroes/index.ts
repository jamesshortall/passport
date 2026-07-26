// Supabase Edge Function: cache-heroes
// Downloads each country's external hero photo once, stores it in the
// `country-heroes` Storage bucket, and repoints hero_image_url at the fast
// Supabase CDN. Admin-gated. Idempotent — skips heroes already in our bucket.
//
// Deploy:  supabase functions deploy cache-heroes
//
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "country-heroes";

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

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Admin gate.
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
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

    const { data: countries } = await supabase
      .from("countries")
      .select("id, slug, hero_image_url")
      .not("hero_image_url", "is", null);

    let cached = 0;
    let skipped = 0;
    const failed: string[] = [];

    for (const c of (countries ?? []) as any[]) {
      const src: string = c.hero_image_url;
      // Already stored in our bucket — nothing to do.
      if (src.includes(`/storage/v1/object/public/${BUCKET}/`)) {
        skipped++;
        continue;
      }
      try {
        const res = await fetch(mediumize(src), { redirect: "follow" });
        if (!res.ok) {
          failed.push(c.slug);
          continue;
        }
        const ct = res.headers.get("content-type") || "image/jpeg";
        if (!ct.startsWith("image/")) {
          failed.push(c.slug);
          continue;
        }
        const bytes = new Uint8Array(await res.arrayBuffer());
        const path = `${c.slug}.${extFor(ct)}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, bytes, { contentType: ct, upsert: true, cacheControl: "31536000" });
        if (upErr) {
          failed.push(c.slug);
          continue;
        }
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        await supabase.from("countries").update({ hero_image_url: pub.publicUrl }).eq("id", c.id);
        cached++;
      } catch {
        failed.push(c.slug);
      }
    }

    return Response.json({ ok: true, cached, skipped, failed });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
