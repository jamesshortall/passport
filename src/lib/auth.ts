import { createSupabaseServerClient } from "./supabase/server";
import type { Profile } from "./types";

/** The signed-in user's profile, or null if not signed in. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (data as Profile) ?? null;
}

export async function requireAdmin(): Promise<Profile | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin" || profile.approval_status !== "approved") {
    return null;
  }
  return profile;
}
