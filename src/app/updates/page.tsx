import type { Metadata } from "next";
import { getRecentChanges } from "@/lib/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Flag from "@/components/Flag";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recent updates" };

export default async function UpdatesPage() {
  const changes = await getRecentChanges(80);

  // Resolve country names for display.
  const supabase = createSupabaseServerClient();
  const { data: countries } = await supabase.from("countries").select("id, name, slug, flag_emoji");
  const byId = new Map((countries ?? []).map((c: any) => [c.id, c]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-brand-navy">What changed recently</h1>
      <p className="mt-2 text-slate-600">
        A running log of edits across every country — handy for returning
        travelers.
      </p>

      {changes.length === 0 ? (
        <p className="mt-10 text-slate-400">No changes logged yet.</p>
      ) : (
        <ol className="mt-6 space-y-3">
          {changes.map((c) => {
            const country = c.country_id ? byId.get(c.country_id) : null;
            return (
              <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm text-slate-800">
                    {country && (
                      <a href={`/country/${country.slug}`} className="inline-flex items-center gap-1.5 font-semibold text-brand-navy hover:underline">
                        <Flag emoji={country.flag_emoji} size="1rem" /> {country.name}
                      </a>
                    )}{" "}
                    <span>{c.change_summary}</span>
                  </p>
                  <time className="shrink-0 text-xs text-slate-400">
                    {new Date(c.changed_at).toLocaleDateString()}
                  </time>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
