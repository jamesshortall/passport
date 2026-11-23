// Supabase Edge Function: backfill-heroes
// Sources a hero photo for countries from the Unsplash API. Admin-gated.
//
// Modes (JSON body, all optional):
//   {}                        -> fill only countries with no hero yet (default)
//   { "force": true }         -> re-source EVERY country (overwrite existing)
//   { "slugs": ["georgia"] }  -> re-source only these countries (overwrite)
//
// After running this, run `cache-heroes` to copy the new photos into Storage
// and (re)generate the fast /thumbs/ used by the browse grid.
//
// Deploy:  supabase functions deploy backfill-heroes
// Secrets: supabase secrets set UNSPLASH_ACCESS_KEY=your_unsplash_access_key
//
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { heroQuery } from "../_shared/heroQuery.ts";

// Fetch a scenic, country-specific hero. Searches several results and prefers a
// landscape-oriented one so cards/heroes crop well.
async function fetchHero(
  name: string,
  slug: string,
  key: string
): Promise<string | null> {
  try {
    const url =
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(heroQuery(name, slug))}` +
      `&orientation=landscape&per_page=10&content_filter=high`;
    const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
    if (!res.ok) return null;
    const j = await res.json();
    const results: any[] = j.results ?? [];
    if (results.length === 0) return null;
    // Prefer a genuinely landscape (wider-than-tall) photo; fall back to first.
    const p =
      results.find((r) => (r.width ?? 0) > (r.height ?? 0) * 1.2) ?? results[0];
    // Best-effort download trigger (Unsplash API guideline).
    if (p.links?.download_location) {
      fetch(p.links.download_location, {
        headers: { Authorization: `Client-ID ${key}` },
      }).catch(() => {});
    }
    return `${p.urls.raw}&w=1600&q=70&fit=crop&auto=format`;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

    const key = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!key) return Response.json({ error: "UNSPLASH_ACCESS_KEY not set" }, { status: 500 });

    // Validate the key up front so we return a clear reason instead of
    // silently reporting "no match" for every country.
    const test = await fetch(
      "https://api.unsplash.com/search/photos?query=paris&per_page=1",
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    if (!test.ok) {
      const body = (await test.text()).slice(0, 300);
      return Response.json(
        { error: `Unsplash rejected the key (HTTP ${test.status}). Make sure you used the ACCESS key, not the Secret key. ${body}` },
        { status: 502 }
      );
    }

    // Parse optional targeting from the request body.
    let reqBody: any = {};
    try {
      reqBody = await req.json();
    } catch {
      /* no body — default mode */
    }
    const slugs: string[] | undefined = Array.isArray(reqBody?.slugs) ? reqBody.slugs : undefined;
    const force = reqBody?.force === true;

    let q = supabase.from("countries").select("id, name, slug");
    if (slugs && slugs.length > 0) {
      q = q.in("slug", slugs);
    } else if (!force) {
      q = q.is("hero_image_url", null);
    }
    const { data: countries } = await q;

    let updated = 0;
    const missed: string[] = [];
    for (const c of countries ?? []) {
      const heroUrl = await fetchHero((c as any).name, (c as any).slug, key);
      if (heroUrl) {
        await supabase.from("countries").update({ hero_image_url: heroUrl }).eq("id", (c as any).id);
        updated++;
      } else {
        missed.push((c as any).name);
      }
      await sleep(300); // stay well under Unsplash rate limits
    }

    return Response.json({ ok: true, updated, missed });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
