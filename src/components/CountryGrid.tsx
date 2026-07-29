"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Country } from "@/lib/types";
import CountryCard from "./CountryCard";

export default function CountryGrid({ countries }: { countries: Country[] }) {
  const [query, setQuery] = useState("");
  // Default to a single region so the browse grid only loads that region's
  // images up front, rather than every country's hero at once.
  const [region, setRegion] = useState<string>("North America");

  const regions = useMemo(() => {
    const set = new Set(countries.map((c) => c.region).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [countries]);

  // Guard against the default region not existing in the data.
  const activeRegion = regions.includes(region) ? region : regions[0] ?? region;

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    return countries.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.region?.toLowerCase().includes(q) ?? false);
      // While searching, look across every region; otherwise scope to the
      // selected region chip.
      const matchesRegion = q ? true : c.region === activeRegion;
      return matchesQuery && matchesRegion;
    });
  }, [countries, q, activeRegion]);

  return (
    <div>
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a country or region…"
            className="w-full rounded-full border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm shadow-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
            aria-label="Search countries"
          />
        </div>
        {/* Region chips sit UNDERNEATH the search and wrap, so they never
            collide with the sidebar/CTA on the right. */}
        <div className="flex flex-wrap gap-2">
          {regions.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                !q && activeRegion === r
                  ? "border-brand-navy bg-brand-navy text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:border-brand-teal hover:text-brand-navy"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-slate-400">
          No countries match “{query}”. Try another search.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CountryCard key={c.id} country={c} />
          ))}
        </div>
      )}
    </div>
  );
}
