import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Country } from "@/lib/types";
import CountryThumb from "./CountryThumb";

export default function CountryCard({ country }: { country: Country }) {
  return (
    <Link
      href={`/country/${country.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:border-brand-teal/50 hover:shadow-cardhover"
    >
      <CountryThumb
        imageUrl={country.hero_image_url}
        flagEmoji={country.flag_emoji}
        hasAlert={!!country.country_alert}
        className="h-28"
      />
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900 group-hover:text-brand-navy">
            {country.name}
          </h3>
          {country.region && (
            <p className="text-xs text-slate-500">{country.region}</p>
          )}
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-teal" />
      </div>
    </Link>
  );
}
