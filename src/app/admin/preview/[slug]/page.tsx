import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCountryBySlug, getCategoriesForCountry } from "@/lib/queries";
import CountryView from "@/components/CountryView";

// Admin-only, per-request: previews DRAFT countries with the admin's own
// session (RLS lets admins read drafts). The public /country/[slug] page is
// cached and anon-only, so drafts 404 there by design.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draft preview", robots: { index: false } };

export default async function AdminPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-brand-navy">Admin access required</h1>
        <Link href="/login?next=/admin" className="mt-4 inline-block rounded-full bg-brand-navy px-5 py-2 text-sm text-white">
          Sign in
        </Link>
      </div>
    );
  }

  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const country = await getCountryBySlug(slug, supabase);
  if (!country) notFound();

  const categories = await getCategoriesForCountry(country.id, supabase);
  return <CountryView country={country} categories={categories} preview />;
}
