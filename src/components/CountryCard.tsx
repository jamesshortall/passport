import Link from "next/link";
import type { Country } from "@/lib/types";

export default function CountryCard({ country }: { country: Country }) {
  return (
    <Link
      href={`/country/${country.slug}`}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-accent hover:shadow-md"
    >
      <span className="text-3xl" aria-hidden>
        {country.flag_emoji || "🏳️"}
      </span>
      <div className="min-w-0">
        <h3 className="truncate font-semibold text-slate-900 group-hover:text-brand-navy">
          {country.name}
        </h3>
        {country.region && (
          <p className="text-xs text-slate-500">{country.region}</p>
        )}
      </div>
      {country.country_alert && (
        <span className="ml-auto shrink-0 text-lg" title="Has a country alert" aria-hidden>
          ⚠️
        </span>
      )}
    </Link>
  );
}
