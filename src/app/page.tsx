import { getPublishedCountries } from "@/lib/queries";
import CountryGrid from "@/components/CountryGrid";
import CardmasterCTA from "@/components/CardmasterCTA";

// Rendered dynamically so newly published countries appear without a redeploy.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const countries = await getPublishedCountries();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-brand-navylight to-brand-tealdark px-6 py-10 sm:px-10 sm:py-14">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 opacity-10"
          style={{
            backgroundImage: "url(/brand/emblem-mark.png)",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="relative max-w-2xl">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-brand-teallight">
            by The Travel Technician
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Which apps actually work where you're going?
          </h1>
          <p className="mt-3 text-base text-slate-200 sm:text-lg">
            Apple Pay, Google Maps and WhatsApp don't always work abroad — or
            aren't the best option. Pick a country to see exactly what to
            download before you fly.
          </p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>
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

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <CardmasterCTA />
        </aside>
      </div>
    </div>
  );
}
