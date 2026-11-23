import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedAppRows, getPublishedAppSlugs, slugifyAppName } from "@/lib/queries";
import SeverityTag from "@/components/SeverityTag";
import Flag from "@/components/Flag";

// Public catalog page: cached and regenerated every 5 minutes (ISR). Known app
// slugs are pre-built; new ones render on first request.
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getPublishedAppSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug} — country by country` };
}

/** Phase 2 — one app, every country where it's tracked. */
export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rows = (await getPublishedAppRows()).filter(
    (r) => slugifyAppName(r.us_app_name) === slug
  );

  if (rows.length === 0) notFound();

  const appName = rows[0].us_app_name;

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
                  className="inline-flex items-center gap-2 font-semibold text-brand-navy hover:underline"
                >
                  <Flag emoji={r.countries.flag_emoji} size="1.25rem" /> {r.countries.name}
                </Link>
                <SeverityTag severity={r.severity} />
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
