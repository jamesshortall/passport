"use client";

import { useMemo, useState } from "react";
import type { Country } from "@/lib/types";
import CountryCard from "./CountryCard";

export default function CountryGrid({ countries }: { countries: Country[] }) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<string>("All");

  const regions = useMemo(() => {
    const set = new Set(countries.map((c) => c.region).filter(Boolean) as string[]);
    return ["All", ...Array.from(set).sort()];
  }, [countries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return countries.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.region?.toLowerCase().includes(q) ?? false);
      const matchesRegion = region === "All" || c.region === region;
      return matchesQuery && matchesRegion;
    });
  }, [countries, query, region]);

  return (
    <div>
      <div className="flex flex-col gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a country or region…"
          className="w-full rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
          aria-label="Search countries"
        />
        {/* Region chips sit UNDERNEATH the search and wrap, so they never
            collide with the sidebar/CTA on the right. */}
        <div className="flex flex-wrap gap-2">
          {regions.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                region === r
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
