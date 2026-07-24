import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SeverityTag from "@/components/SeverityTag";
import type { Severity } from "@/lib/types";

export const dynamic = "force-dynamic";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return { title: `${params.slug} — country by country` };
}

/** Phase 2 — one app, every country where it's tracked. */
export default async function AppDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("country_apps")
    .select(
      "us_app_name, local_alternative_name, severity, why_short, countries!inner(name, slug, flag_emoji, status)"
    )
    .eq("countries.status", "published");

  const rows = ((data as any[]) ?? []).filter(
    (r) => slugify(r.us_app_name) === params.slug
  );

  if (rows.length === 0) notFound();

  const appName = rows[0].us_app_name as string;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/apps" className="text-sm text-slate-500 hover:text-brand-navy">
        ← All apps
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold text-brand-navy">{appName}</h1>
      <p className="mt-2 text-slate-600">
        How {appName} works in each country we track, and the local alternative
        where it doesn't.
      </p>

      <ul className="mt-6 space-y-3">
        {rows
          .sort((a, b) => a.countries.name.localeCompare(b.countries.name))
          .map((r, i) => (
            <li key={i} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/country/${r.countries.slug}`}
                  className="font-semibold text-brand-navy hover:underline"
                >
                  {r.countries.flag_emoji} {r.countries.name}
                </Link>
                <SeverityTag severity={r.severity as Severity} />
              </div>
              <p className="mt-1 text-sm text-slate-600">{r.why_short}</p>
              {r.local_alternative_name && (
                <p className="mt-1 text-xs text-slate-500">
                  Use instead: <span className="font-medium">{r.local_alternative_name}</span>
                </p>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}
