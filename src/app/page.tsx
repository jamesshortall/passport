import Link from "next/link";
import { Compass, ShieldCheck, Download, MapPinned } from "lucide-react";
import { getPublishedCountries } from "@/lib/queries";
import CountryGrid from "@/components/CountryGrid";
import CardmasterCTA from "@/components/CardmasterCTA";
import PromoCTA from "@/components/PromoCTA";
import RotatingPromos from "@/components/RotatingPromos";
import { SITE } from "@/lib/constants";

// Rendered dynamically so newly published countries appear without a redeploy.
export const dynamic = "force-dynamic";

// Decorative hero photo (loaded as a CSS background so a broken URL simply
// reveals the gradient underneath — no broken-image icon).
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1920&q=70";

const STEPS = [
  {
    icon: MapPinned,
    title: "Pick your country",
    body: "Search or browse. Every country breaks down the apps that matter for travelers.",
  },
  {
    icon: ShieldCheck,
    title: "See what works",
    body: "Clear ✅ / ⚠️ / ❌ for each US app, the local alternative, and a plain-English why.",
  },
  {
    icon: Download,
    title: "Download before you fly",
    body: "Set up the right apps in advance — even build a checklist across multiple countries.",
  },
];

export default async function HomePage() {
  const countries = await getPublishedCountries();

  // Sidebar promo cards. The rotation offset is decided in middleware
  // Rotated client-side on every page load (see RotatingPromos) so no single
  // property is permanently pinned to the top slot.
  const promoCards = [
    <CardmasterCTA key="cardmaster" />,
    <PromoCTA
      key="site"
      accent="teal"
      href={SITE.brand.main}
      logoSrc="/brand/tt-logo.png"
      logoAlt="Travel Technician — Smarter Travel. Better Rewards."
      eyebrow="From The Travel Technician"
      title="Visit Travel Technician"
      description="Smarter travel, better rewards. Guides, tips, and tools to help you get more out of every trip."
      cta="Explore the site"
    />,
    <PromoCTA
      key="blog"
      accent="navy"
      href={SITE.brand.blog}
      logoSrc="/brand/tt-blog.png"
      logoAlt="The Travel Technician — Travel Blog"
      eyebrow="From The Travel Technician"
      title="Read the Travel Blog"
      description="Explore more, travel smarter — destination deep-dives, gear, and real-world travel advice."
      cta="Read the blog"
    />,
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Hero */}
      <section className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-brand-navylight to-brand-tealdark">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
          style={{ backgroundImage: `url(${HERO_PHOTO})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-navy/90 via-brand-navy/60 to-transparent" aria-hidden />
        <div className="relative px-6 py-14 sm:px-12 sm:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-teallight ring-1 ring-white/15">
              <Compass className="h-3.5 w-3.5" /> by The Travel Technician
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl">
              Which apps actually work where you're going?
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
              Apple Pay, Google Maps and WhatsApp don't always work abroad — or
              aren't the best option. See exactly what to download before you fly,
              country by country.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#browse"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-navy shadow-sm transition hover:bg-brand-paper"
              >
                Browse countries
              </a>
              <Link
                href="/plan"
                className="rounded-full border border-white/30 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Plan a trip →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mb-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-tealdark">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="mt-3 font-semibold text-brand-navy">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Browse */}
      <div id="browse" className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          <h2 className="mb-4 font-display text-2xl font-bold text-brand-navy">
            Browse countries
          </h2>
          {countries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              No countries published yet. Add and publish countries from the{" "}
              <a href="/admin" className="underline">
                admin panel
              </a>
              .
            </div>
          ) : (
            <CountryGrid countries={countries} />
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <RotatingPromos cards={promoCards} />
        </aside>
      </div>

      {/* What AppPassport is (purpose) — kept at the bottom so it stays out of
          the way of browsing, but remains available for context & SEO. */}
      <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <h2 className="font-display text-2xl font-bold text-brand-navy">What is AppPassport?</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-slate-700">
          AppPassport is a free travel guide that tells US travelers which of
          their everyday apps — like Apple Pay, Google Maps, WhatsApp, and Uber —
          actually work in each country, and which local alternative to download
          instead. For every country we break down payments, messaging, maps,
          ride-hailing, internet access, and social media, so you know exactly
          what to set up before you fly.
        </p>
        <p className="mt-3 max-w-3xl leading-relaxed text-slate-700">
          Browsing every country is completely free and requires no account.
          You only need to <strong>create a free account — with your email or
          with Google</strong> — if you want to save countries as favorites and
          get notified when their information changes. When you sign in with
          Google, we use only your basic profile (name and email) to create and
          identify your account; we never post anything or access anything else.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Read our{" "}
          <Link href="/privacy" className="font-medium text-brand-teal underline hover:text-brand-tealdark">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="font-medium text-brand-teal underline hover:text-brand-tealdark">
            Terms of Service
          </Link>
          . AppPassport is part of{" "}
          <a href="https://www.traveltechnician.info" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-teal underline hover:text-brand-tealdark">
            The Travel Technician
          </a>
          .
        </p>
      </section>
    </div>
  );
}
