import Link from "next/link";
import { Compass, ShieldCheck, Download, MapPinned } from "lucide-react";
import { getPublishedCountries } from "@/lib/queries";
import CountryGrid from "@/components/CountryGrid";
import CardmasterCTA from "@/components/CardmasterCTA";

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
          <CardmasterCTA />
        </aside>
      </div>
    </div>
  );
}
