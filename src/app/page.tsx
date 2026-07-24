import { getPublishedCountries } from "@/lib/queries";
import CountryGrid from "@/components/CountryGrid";
import CardmasterCTA from "@/components/CardmasterCTA";

// Rendered dynamically so newly published countries appear without a redeploy.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const countries = await getPublishedCountries();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
          Which apps actually work where you're going?
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Apple Pay, Google Maps and WhatsApp don't always work abroad — or
          aren't the best option. Pick a country to see what to download before
          you fly.
        </p>
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
