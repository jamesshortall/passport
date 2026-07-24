import Link from "next/link";
import type { Country } from "@/lib/types";
import Flag from "./Flag";

export default function CountryCard({ country }: { country: Country }) {
  return (
    <Link
      href={`/country/${country.slug}`}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-teal hover:shadow-md"
    >
      <Flag emoji={country.flag_emoji} size="2rem" />
      <div className="min-w-0">
        <h3 className="truncate font-semibold text-slate-900 group-hover:text-brand-navy">
          {country.name}
        </h3>
        {country.region && (
          <p className="text-xs text-slate-500">{country.region}</p>
        )}
      </div>
      <span className="ml-auto flex shrink-0 items-center gap-2">
        {country.country_alert && (
          <span className="text-lg" title="Has a country alert" aria-hidden>
            ⚠️
          </span>
        )}
        <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-teal">
          →
        </span>
      </span>
    </Link>
  );
}
