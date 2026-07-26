import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCountryBySlug,
  getCategoriesForCountry,
  latestVerifiedAt,
} from "@/lib/queries";
import CountryAlertBanner from "@/components/CountryAlertBanner";
import CategorySection from "@/components/CategorySection";
import CardmasterCTA from "@/components/CardmasterCTA";
import SaveCountryButton from "@/components/SaveCountryButton";
import OfflineBadge from "@/components/OfflineBadge";
import CountryHero from "@/components/CountryHero";

// Server-rendered per request — NO generateStaticParams, so a country
// published in Supabase is live immediately with no redeploy.
export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const country = await getCountryBySlug(params.slug);
  if (!country) return { title: "Country not found" };
  return {
    title: `${country.name} — which apps to use`,
    description: `Which US apps work in ${country.name}, and the local alternatives to download before you go.`,
  };
}

export default async function CountryPage({
  params,
}: {
  params: { slug: string };
}) {
  const country = await getCountryBySlug(params.slug);
  if (!country) notFound();

  const categories = await getCategoriesForCountry(country.id);
  const verifiedAt = latestVerifiedAt(categories) ?? country.last_updated;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-500 hover:text-brand-navy">
        ← All countries
      </Link>

      {country.status === "draft" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          <span aria-hidden>🔒</span>
          <span className="font-semibold">Draft preview</span>
          <span className="text-amber-800">
            — this country isn't public yet. Review the content below, then publish it from the{" "}
            <Link href="/admin" className="underline">admin panel</Link>.
          </span>
        </div>
      )}

      <div className="mt-3">
        <CountryHero
          name={country.name}
          region={country.region}
          flagEmoji={country.flag_emoji}
          imageUrl={country.hero_image_url}
          hasAlert={!!country.country_alert}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {(() => {
          const apps = categories.flatMap((c) => c.apps);
          const blocked = apps.filter((a) => a.severity === "blocked").length;
          const fine = apps.filter((a) => a.severity === "works_fine").length;
          return (
            <div className="flex gap-2">
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-card">
                <b className="font-display text-brand-navy">{apps.length}</b>{" "}
                <span className="text-slate-500">apps tracked</span>
              </span>
              {blocked > 0 && (
                <span className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-sm">
                  <b className="font-display text-red-700">{blocked}</b>{" "}
                  <span className="text-red-600">blocked</span>
                </span>
              )}
              {fine > 0 && (
                <span className="rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 text-sm">
                  <b className="font-display text-green-700">{fine}</b>{" "}
                  <span className="text-green-600">work fine</span>
                </span>
              )}
            </div>
          );
        })()}
        <SaveCountryButton countryId={country.id} />
      </div>

      {/* Last verified + prominent link to the accuracy disclaimer */}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span>Last verified: {formatDate(verifiedAt)}</span>
        <OfflineBadge />
        <span aria-hidden>·</span>
        <Link
          href="/disclaimer"
          className="font-medium text-brand-navy underline hover:text-brand-accentdark"
        >
          How current is this? Read our accuracy disclaimer
        </Link>
      </div>

      {country.country_alert && (
        <div className="mt-5">
          <CountryAlertBanner
            alert={country.country_alert}
            detail={country.country_alert_detail}
          />
        </div>
      )}

      {categories.length === 0 ? (
        <p className="mt-10 text-slate-500">
          No app details published for {country.name} yet.
        </p>
      ) : (
        categories.map((cat) => <CategorySection key={cat.id} category={cat} />)
      )}

      {/* Cross-promotion — below the guide content, before the footer */}
      <div className="mt-12">
        <CardmasterCTA />
      </div>
    </div>
  );
}
