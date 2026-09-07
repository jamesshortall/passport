import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "All apps" };

/**
 * Phase 2 — App Inventory. Lists every US app we track (derived from
 * country_apps across published countries) with how many countries cover it.
 * Uses the free-text us_app_name until the canonical `apps` table is populated.
 */
export default async function AppsIndexPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("country_apps")
    .select("us_app_name, country_id, countries!inner(status)")
    .eq("countries.status", "published");

  const counts = new Map<string, number>();
  for (const row of (data as any[]) ?? []) {
    counts.set(row.us_app_name, (counts.get(row.us_app_name) ?? 0) + 1);
  }
  const apps = Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-brand-navy">Apps we track</h1>
      <p className="mt-2 text-slate-600">
        Pick an app to see how it fares country by country — the inverse of a
        country page.
      </p>

      {apps.length === 0 ? (
        <p className="mt-10 text-slate-400">No apps tracked yet.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map(([name, count]) => (
            <Link
              key={name}
              href={`/apps/${encodeURIComponent(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))}`}
              className="rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-accent"
            >
              <p className="font-semibold text-slate-900">{name}</p>
              <p className="text-xs text-slate-500">
                {count} {count === 1 ? "country" : "countries"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
