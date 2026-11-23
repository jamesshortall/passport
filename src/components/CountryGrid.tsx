"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import type { Country } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import CountryCard from "./CountryCard";

// Sentinel "region" value for the signed-in-only saved-countries view.
const FAVORITES = "My Favorites";

export default function CountryGrid({ countries }: { countries: Country[] }) {
  const [query, setQuery] = useState("");
  // Default to a single region so the browse grid only loads that region's
  // images up front, rather than every country's hero at once.
  const [region, setRegion] = useState<string>("North America");

  // Signed-in user's saved country IDs. null until loaded / when signed out —
  // the "My Favorites" chip only appears once we have a set.
  const [favoriteIds, setFavoriteIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("favorites")
        .select("country_id")
        .eq("user_id", user.id);
      setFavoriteIds(new Set((data ?? []).map((f) => f.country_id as string)));
    })();
  }, []);

  const regions = useMemo(() => {
    const set = new Set(countries.map((c) => c.region).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [countries]);

  const isFav = region === FAVORITES;
  // Guard against the default region not existing in the data (favorites is a
  // valid non-region selection and must not be reset to a real region).
  const activeRegion =
    isFav || regions.includes(region) ? region : regions[0] ?? region;

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    return countries.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.region?.toLowerCase().includes(q) ?? false);
      // While searching, look across every region; otherwise scope to the
      // selected chip (a real region, or the user's saved countries).
      const matchesRegion = q
        ? true
        : activeRegion === FAVORITES
        ? favoriteIds?.has(c.id) ?? false
        : c.region === activeRegion;
      return matchesQuery && matchesRegion;
    });
  }, [countries, q, activeRegion, favoriteIds]);

  const showFavoritesEmpty =
    !q && activeRegion === FAVORITES && filtered.length === 0;

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
          {/* Saved-countries filter — only shown to signed-in users. */}
          {favoriteIds && (
            <button
              onClick={() => setRegion(FAVORITES)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition ${
                !q && isFav
                  ? "border-brand-navy bg-brand-navy text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:border-brand-teal hover:text-brand-navy"
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${!q && isFav ? "fill-current" : ""}`} />
              {FAVORITES}
            </button>
          )}
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

      {showFavoritesEmpty ? (
        <p className="mt-10 text-center text-slate-400">
          You haven&apos;t saved any countries yet. Open a country and tap{" "}
          <span className="whitespace-nowrap font-medium text-slate-500">☆ Save</span>{" "}
          to add it here.
        </p>
      ) : filtered.length === 0 ? (
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
