import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabasePublicClient } from "./supabase/public";
import type {
  Country,
  CountryApp,
  AppCategory,
  CategoryWithApps,
  ChangeLogRow,
} from "./types";

// Explicit column lists (mirrors src/lib/types.ts) — never `select("*")`.
export const COUNTRY_COLUMNS =
  "id, name, slug, flag_emoji, region, status, country_alert, country_alert_detail, hero_image_url, last_updated, created_at";
export const CATEGORY_COLUMNS = "id, name, sort_order";
export const COUNTRY_APP_COLUMNS =
  "id, country_id, category_id, us_app_id, us_app_name, us_app_works, local_alternative_name, why_short, setup_effort, detail_paragraph, severity, app_store_link, last_verified_at";
export const CHANGE_LOG_COLUMNS = "id, country_id, app_id, change_summary, changed_at";

// Upper bounds so a runaway table can never produce an unbounded page.
const MAX_COUNTRIES = 500;
const MAX_APPS_PER_COUNTRY = 500;
const MAX_APP_ROWS = 20000;

/** URL slug for an app name (shared by /apps and /apps/[slug]). */
export function slugifyAppName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * All public reads use the cookie-less anon client so the pages that call them
 * can be statically cached (ISR). RLS limits anon to published content. The
 * admin preview passes its own session-bound client to see drafts.
 */
type Client = SupabaseClient;
const pub = () => createSupabasePublicClient();

/** All published countries for the browse grid. */
export async function getPublishedCountries(): Promise<Country[]> {
  const { data, error } = await pub()
    .from("countries")
    .select(COUNTRY_COLUMNS)
    .eq("status", "published")
    .order("name")
    .limit(MAX_COUNTRIES);

  if (error) {
    console.error("getPublishedCountries:", error.message);
    return [];
  }
  return (data as Country[]) ?? [];
}

/** Published slugs, for generateStaticParams. Never throws (build-safe). */
export async function getPublishedSlugs(): Promise<string[]> {
  try {
    const { data, error } = await pub()
      .from("countries")
      .select("slug")
      .eq("status", "published")
      .limit(MAX_COUNTRIES);
    if (error) throw error;
    return ((data as { slug: string }[]) ?? []).map((r) => r.slug);
  } catch (e) {
    console.error("getPublishedSlugs:", (e as Error).message);
    return [];
  }
}

/** A single country by slug. Returns null if not found or not visible. */
export async function getCountryBySlug(
  slug: string,
  client: Client = pub()
): Promise<Country | null> {
  const { data, error } = await client
    .from("countries")
    .select(COUNTRY_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("getCountryBySlug:", error.message);
    return null;
  }
  return (data as Country) ?? null;
}

/**
 * Categories populated with the country's apps. Only categories that have at
 * least one app row are returned — empty categories are never rendered.
 */
export async function getCategoriesForCountry(
  countryId: string,
  client: Client = pub()
): Promise<CategoryWithApps[]> {
  const [{ data: categories }, { data: apps }] = await Promise.all([
    client.from("app_categories").select(CATEGORY_COLUMNS).order("sort_order").limit(100),
    client
      .from("country_apps")
      .select(COUNTRY_APP_COLUMNS)
      .eq("country_id", countryId)
      .order("severity")
      .limit(MAX_APPS_PER_COUNTRY),
  ]);

  const cats = (categories as AppCategory[]) ?? [];
  const rows = (apps as CountryApp[]) ?? [];

  return cats
    .map((cat) => ({
      ...cat,
      apps: rows.filter((a) => a.category_id === cat.id),
    }))
    .filter((cat) => cat.apps.length > 0);
}

/** Most-recent verification timestamp across a country's apps. */
export function latestVerifiedAt(cats: CategoryWithApps[]): string | null {
  const all = cats.flatMap((c) => c.apps.map((a) => a.last_verified_at));
  if (all.length === 0) return null;
  return all.sort().reverse()[0];
}

/** Recent change-log entries for the /updates feed (capped at 200). */
export async function getRecentChanges(limit = 50): Promise<ChangeLogRow[]> {
  const { data, error } = await pub()
    .from("change_log")
    .select(CHANGE_LOG_COLUMNS)
    .order("changed_at", { ascending: false })
    .limit(Math.min(limit, 200));

  if (error) {
    console.error("getRecentChanges:", error.message);
    return [];
  }
  return (data as ChangeLogRow[]) ?? [];
}

export type PublishedAppRow = {
  us_app_name: string;
  local_alternative_name: string | null;
  severity: CountryApp["severity"];
  setup_effort: CountryApp["setup_effort"];
  why_short: string;
  country_id: string;
  countries: { name: string; slug: string; flag_emoji: string | null; status: string };
};

/** Every app row across published countries (powers /apps, /apps/[slug]). */
export async function getPublishedAppRows(): Promise<PublishedAppRow[]> {
  const { data, error } = await pub()
    .from("country_apps")
    .select(
      "us_app_name, local_alternative_name, severity, setup_effort, why_short, country_id, countries!inner(name, slug, flag_emoji, status)"
    )
    .eq("countries.status", "published")
    .limit(MAX_APP_ROWS);

  if (error) {
    console.error("getPublishedAppRows:", error.message);
    return [];
  }
  return (data as unknown as PublishedAppRow[]) ?? [];
}

/** Distinct app slugs across published countries, for generateStaticParams. */
export async function getPublishedAppSlugs(): Promise<string[]> {
  try {
    const rows = await getPublishedAppRows();
    return Array.from(new Set(rows.map((r) => slugifyAppName(r.us_app_name)))).filter(Boolean);
  } catch {
    return [];
  }
}
