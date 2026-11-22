import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-less Supabase client for PUBLIC catalog reads (countries, apps,
 * categories, change log). It runs as `anon`, so RLS only ever returns
 * published content, and because it never touches `cookies()` the pages that
 * use it can be statically rendered and cached (ISR) instead of being rebuilt
 * for every visitor. Never use it for anything per-user.
 *
 * When the env vars are absent (e.g. a CI build without secrets) a placeholder
 * project is used so the build can still prerender; every query then fails
 * and the callers fall back to empty results. Production builds must set
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example).
 */
export function createSupabasePublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("Supabase env not set — public reads will return no data.");
  }
  return createClient(
    url || "https://placeholder.supabase.co",
    key || "placeholder-anon-key",
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}
