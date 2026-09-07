"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

type ActionResult = { ok: boolean; message?: string };

/** Approve or reject a pending profile. Writes reviewed_by/at and (best-effort)
 *  notifies the user by email via the notify-approval edge function. */
export async function reviewProfile(
  profileId: string,
  decision: "approved" | "rejected"
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "Not authorized" };

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      approval_status: decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.user_id,
    })
    .eq("id", profileId)
    .select("email")
    .maybeSingle();

  if (error) return { ok: false, message: error.message };

  // Best-effort approval email; ignore failures so the action still succeeds.
  try {
    await supabase.functions.invoke("notify-approval", {
      body: { email: data?.email, decision },
    });
  } catch {
    /* email provider not configured yet — non-fatal */
  }

  revalidatePath("/admin");
  return { ok: true };
}

/** Publish or unpublish a country. Publishing makes it live immediately. */
export async function setCountryStatus(
  countryId: string,
  status: "draft" | "published"
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "Not authorized" };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("countries")
    .update({ status })
    .eq("id", countryId);

  if (error) return { ok: false, message: error.message };

  // Log the publish/unpublish action to the update feed.
  await supabase.from("change_log").insert({
    country_id: countryId,
    change_summary: status === "published" ? "Country published" : "Country unpublished",
    changed_by: admin.user_id,
  });

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

/** Backfill hero photos for all countries missing one (via Unsplash). */
export async function backfillHeroImages(): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "Not authorized" };

  const supabase = createSupabaseServerClient();
  try {
    const { data, error } = await supabase.functions.invoke("backfill-heroes", { body: {} });
    if (error) {
      // Surface the function's actual error body (e.g. "UNSPLASH_ACCESS_KEY not set").
      let detail = error.message ?? "invoke failed";
      try {
        const body = await (error as any).context?.json?.();
        if (body?.error) detail = body.error;
      } catch {
        /* ignore */
      }
      return { ok: false, message: `Backfill failed: ${detail}` };
    }
    const res = data as { updated?: number; missed?: string[] };
    revalidatePath("/admin");
    revalidatePath("/");
    return {
      ok: true,
      message: `Added photos to ${res.updated ?? 0} countries.${
        res.missed && res.missed.length ? ` No match for: ${res.missed.join(", ")}.` : ""
      }`,
    };
  } catch (e: any) {
    return { ok: false, message: `Backfill failed: ${e?.message ?? "unknown error"}` };
  }
}

/** Download external hero photos into Supabase Storage (fast CDN) and repoint
 *  each country's hero at the stored copy. Idempotent. */
export async function cacheHeroImages(): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "Not authorized" };

  const supabase = createSupabaseServerClient();
  try {
    const { data, error } = await supabase.functions.invoke("cache-heroes", { body: {} });
    if (error) {
      let detail = error.message ?? "invoke failed";
      try {
        const body = await (error as any).context?.json?.();
        if (body?.error) detail = body.error;
      } catch {
        /* ignore */
      }
      return { ok: false, message: `Caching failed: ${detail}` };
    }
    const res = data as {
      cached?: number;
      skipped?: number;
      thumbed?: number;
      failed?: string[];
      thumbFailed?: string[];
    };
    revalidatePath("/admin");
    revalidatePath("/");
    return {
      ok: true,
      message:
        `Cached ${res.cached ?? 0} to storage (${res.skipped ?? 0} already done). ` +
        `Generated ${res.thumbed ?? 0} thumbnails.` +
        (res.failed && res.failed.length ? ` Failed: ${res.failed.join(", ")}.` : "") +
        (res.thumbFailed && res.thumbFailed.length
          ? ` Thumb failed: ${res.thumbFailed.join(", ")}.`
          : ""),
    };
  } catch (e: any) {
    return { ok: false, message: `Caching failed: ${e?.message ?? "unknown error"}` };
  }
}

/** Re-source ONE country's hero with the scenic/landmark query, then cache it
 *  to Storage and regenerate its thumbnail. Use on countries whose photo is
 *  off-topic or not country-specific. */
export async function resourceCountryHero(slug: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "Not authorized" };

  const supabase = createSupabaseServerClient();
  const readError = async (error: any, fallback: string) => {
    let detail = error?.message ?? fallback;
    try {
      const body = await error?.context?.json?.();
      if (body?.error) detail = body.error;
    } catch {
      /* ignore */
    }
    return detail;
  };

  try {
    const { data: bf, error: bfErr } = await supabase.functions.invoke("backfill-heroes", {
      body: { slugs: [slug] },
    });
    if (bfErr) {
      return { ok: false, message: `Re-source failed: ${await readError(bfErr, "invoke failed")}` };
    }
    if ((bf as { updated?: number })?.updated === 0) {
      return { ok: false, message: `No new photo found for ${slug}. Try a manual URL below.` };
    }
    const { error: chErr } = await supabase.functions.invoke("cache-heroes", { body: {} });
    if (chErr) {
      return {
        ok: false,
        message: `New photo set for ${slug}, but caching/thumbnailing failed: ${await readError(
          chErr,
          "invoke failed"
        )}. Click "Cache photos to storage" to retry.`,
      };
    }
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath(`/country/${slug}`);
    return { ok: true, message: `Re-sourced a scenic photo for ${slug} and refreshed its thumbnail.` };
  } catch (e: any) {
    return { ok: false, message: `Re-source failed: ${e?.message ?? "unknown error"}` };
  }
}

/** Set (or clear) a country's hero image URL. Goes live immediately. */
export async function setCountryHeroImage(
  countryId: string,
  url: string
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "Not authorized" };

  const trimmed = url.trim();
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("countries")
    .update({ hero_image_url: trimmed || null })
    .eq("id", countryId);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  revalidatePath(`/country`);
  return { ok: true, message: trimmed ? "Hero image updated" : "Hero image cleared" };
}

/** Permanently delete a country and everything tied to it (app entries,
 *  favorites, change log, reports, refresh proposals via cascade) plus its
 *  stored hero images — a clean slate so it can be re-drafted from scratch. */
export async function deleteCountry(countryId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "Not authorized" };

  const supabase = createSupabaseServerClient();

  const { data: country } = await supabase
    .from("countries")
    .select("slug, name")
    .eq("id", countryId)
    .maybeSingle();

  // Best-effort: remove hero images from storage (cached "<slug>.ext" files and
  // any admin uploads under the "<countryId>/" folder).
  try {
    const paths: string[] = country?.slug
      ? ["jpg", "png", "webp", "avif"].map((e) => `${country.slug}.${e}`)
      : [];
    const { data: folder } = await supabase.storage.from("country-heroes").list(countryId);
    if (folder) paths.push(...folder.map((f) => `${countryId}/${f.name}`));
    if (paths.length) await supabase.storage.from("country-heroes").remove(paths);
  } catch {
    /* non-fatal */
  }

  // Deleting the country cascades to country_apps, favorites, change_log,
  // refresh_proposals (and reports via country_apps).
  const { error } = await supabase.from("countries").delete().eq("id", countryId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, message: `Deleted ${country?.name ?? "country"}.` };
}

/** Mark a user report as reviewed. */
export async function resolveReport(reportId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "Not authorized" };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("reports")
    .update({ status: "reviewed" })
    .eq("id", reportId);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

/** Kick off AI drafting for a brand-new country (calls the draft-country
 *  edge function). Inserts a `draft` country on success. */
export async function generateCountryDraft(name: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "Not authorized" };
  if (!name.trim()) return { ok: false, message: "Enter a country name" };

  const supabase = createSupabaseServerClient();
  let normalized: string[] = [];
  try {
    const { data, error } = await supabase.functions.invoke("draft-country", {
      body: { country_name: name.trim() },
    });
    if (error) throw error;
    normalized = (data as { normalized?: string[] })?.normalized ?? [];
  } catch (e: any) {
    return {
      ok: false,
      message:
        "AI drafting isn't available yet — deploy the draft-country edge function and set OPENAI_API_KEY. (" +
        (e?.message ?? "invoke failed") +
        ")",
    };
  }

  revalidatePath("/admin");
  // Surface any status badges the function had to reconcile with `works`, so
  // the admin knows exactly which rows to eyeball before publishing.
  const note = normalized.length
    ? ` ⚠ Auto-corrected ${normalized.length} status badge${normalized.length === 1 ? "" : "s"} that contradicted the works value — review: ${normalized.join("; ")}`
    : "";
  return { ok: true, message: `Draft requested for ${name}. Review it below before publishing.${note}` };
}
