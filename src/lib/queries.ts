import { createSupabaseServerClient } from "./supabase/server";
import type {
  Country,
  CountryApp,
  AppCategory,
  CategoryWithApps,
  ChangeLogRow,
} from "./types";

/**
 * All published countries for the browse grid. RLS already hides drafts, but
 * we filter explicitly too for clarity. Rendered per-request (no static gen).
 */
export async function getPublishedCountries(): Promise<Country[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("countries")
    .select("*")
    .eq("status", "published")
    .order("name");

  if (error) {
    console.error("getPublishedCountries:", error.message);
    return [];
  }
  return (data as Country[]) ?? [];
}

/** A single country by slug. Returns null if not found or not visible. */
export async function getCountryBySlug(slug: string): Promise<Country | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("countries")
    .select("*")
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
  countryId: string
): Promise<CategoryWithApps[]> {
  const supabase = createSupabaseServerClient();

  const [{ data: categories }, { data: apps }] = await Promise.all([
    supabase.from("app_categories").select("*").order("sort_order"),
    supabase
      .from("country_apps")
      .select("*")
      .eq("country_id", countryId)
      .order("severity"),
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

/** Recent change-log entries for the /updates feed. */
export async function getRecentChanges(limit = 50): Promise<ChangeLogRow[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("change_log")
    .select("*")
    .order("changed_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentChanges:", error.message);
    return [];
  }
  return (data as ChangeLogRow[]) ?? [];
}
