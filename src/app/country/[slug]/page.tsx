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

      <div className="mt-3">
        <CountryHero
          name={country.name}
          region={country.region}
          flagEmoji={country.flag_emoji}
          imageUrl={country.hero_image_url}
          hasAlert={!!country.country_alert}
        />
      </div>

      <div className="mt-3 flex items-center justify-end">
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
