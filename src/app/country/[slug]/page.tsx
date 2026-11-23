import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCountryBySlug,
  getCategoriesForCountry,
  getPublishedSlugs,
} from "@/lib/queries";
import CountryView from "@/components/CountryView";

// Cached + regenerated every 5 minutes (ISR). Published slugs are pre-built;
// `dynamicParams` lets a country published after the build render on first
// request, and admin actions call revalidatePath so edits show up immediately.
// Reads use the cookie-less anon client, so RLS hides drafts (404) and no
// per-user data can end up in the cached HTML.
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const country = await getCountryBySlug(slug);
  if (!country) return { title: "Country not found" };
  return {
    title: `${country.name} — which apps to use`,
    description: `Which US apps work in ${country.name}, and the local alternatives to download before you go.`,
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const country = await getCountryBySlug(slug);
  if (!country || country.status !== "published") notFound();

  const categories = await getCategoriesForCountry(country.id);
  return <CountryView country={country} categories={categories} />;
}
