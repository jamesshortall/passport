import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublishedCountries } from "@/lib/queries";
import TripPlanner, { type PlanRow } from "@/components/TripPlanner";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Trip Planner" };

/** Phase 2 — Trip Planner. Aggregates "download before you fly" across
 *  multiple selected countries. Pure query/aggregation, no new tables. */
export default async function PlanPage() {
  const countries = await getPublishedCountries();

  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("country_apps")
    .select(
      "country_id, us_app_name, local_alternative_name, severity, setup_effort, why_short"
    );

  const rows = (data as PlanRow[]) ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-brand-navy">Trip Planner</h1>
      <p className="mt-2 text-slate-600">
        Going to more than one country? Pick them all and get a single,
        deduplicated "download before you fly" checklist.
      </p>
      <TripPlanner
        countries={countries.map((c) => ({ id: c.id, name: c.name, flag: c.flag_emoji }))}
        rows={rows}
      />
    </div>
  );
}
