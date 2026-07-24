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
  try {
    const { error } = await supabase.functions.invoke("draft-country", {
      body: { country_name: name.trim() },
    });
    if (error) throw error;
  } catch (e: any) {
    return {
      ok: false,
      message:
        "AI drafting isn't available yet — deploy the draft-country edge function and set ANTHROPIC_API_KEY. (" +
        (e?.message ?? "invoke failed") +
        ")",
    };
  }

  revalidatePath("/admin");
  return { ok: true, message: `Draft requested for ${name}. Review it below before publishing.` };
}
