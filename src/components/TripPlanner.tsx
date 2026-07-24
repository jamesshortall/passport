"use client";

import { useMemo, useState } from "react";
import type { Severity, SetupEffort } from "@/lib/types";
import { SETUP_META } from "@/lib/constants";

export interface PlanRow {
  country_id: string;
  us_app_name: string;
  local_alternative_name: string | null;
  severity: Severity;
  setup_effort: SetupEffort;
  why_short: string;
}

type CountryOpt = { id: string; name: string; flag: string | null };

// Rank so the "most action needed" wins when an app appears in several countries.
const EFFORT_RANK: Record<SetupEffort, number> = {
  none: 0,
  before_you_land: 1,
  hard_needs_local_id: 2,
};

export default function TripPlanner({
  countries,
  rows,
}: {
  countries: CountryOpt[];
  rows: PlanRow[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const nameById = useMemo(
    () => new Map(countries.map((c) => [c.id, c.name])),
    [countries]
  );

  // Deduplicate by app name; keep the highest-effort variant and note which
  // selected countries need it.
  const checklist = useMemo(() => {
    if (selected.size < 1) return [];
    const byApp = new Map<
      string,
      {
        app: string;
        alt: string | null;
        effort: SetupEffort;
        severity: Severity;
        why: string;
        countries: Set<string>;
      }
    >();

    for (const r of rows) {
      if (!selected.has(r.country_id)) continue;
      // Only surface things that actually need attention (not "works fine, no setup").
      if (r.setup_effort === "none" && r.severity === "works_fine") continue;

      const key = r.us_app_name;
      const existing = byApp.get(key);
      if (!existing) {
        byApp.set(key, {
          app: r.us_app_name,
          alt: r.local_alternative_name,
          effort: r.setup_effort,
          severity: r.severity,
          why: r.why_short,
          countries: new Set([nameById.get(r.country_id) ?? ""]),
        });
      } else {
        existing.countries.add(nameById.get(r.country_id) ?? "");
        if (EFFORT_RANK[r.setup_effort] > EFFORT_RANK[existing.effort]) {
          existing.effort = r.setup_effort;
          existing.alt = r.local_alternative_name ?? existing.alt;
          existing.why = r.why_short;
        }
      }
    }

    return Array.from(byApp.values()).sort(
      (a, b) => EFFORT_RANK[b.effort] - EFFORT_RANK[a.effort]
    );
  }, [rows, selected, nameById]);

  function copyChecklist() {
    const text = checklist
      .map(
        (c) =>
          `☐ ${c.alt || c.app} — ${c.why} (${Array.from(c.countries).join(", ")})`
      )
      .join("\n");
    navigator.clipboard?.writeText(
      `Download before you fly:\n\n${text}\n\nvia AppPassport`
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {countries.map((c) => (
          <button
            key={c.id}
            onClick={() => toggle(c.id)}
            className={`rounded-full border px-3 py-1 text-sm ${
              selected.has(c.id)
                ? "border-brand-navy bg-brand-navy text-white"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {c.flag} {c.name}
          </button>
        ))}
      </div>

      {selected.size === 0 ? (
        <p className="mt-8 text-slate-400">Select one or more countries to build your list.</p>
      ) : (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-navy">
              Download before you fly ({checklist.length})
            </h2>
            {checklist.length > 0 && (
              <button
                onClick={copyChecklist}
                className="rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
              >
                Copy as checklist
              </button>
            )}
          </div>

          {checklist.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              Good news — nothing special to download for the countries you
              picked. Your usual apps should work.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {checklist.map((c) => (
                <li key={c.app} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {c.alt || c.app}
                    </span>
                    {c.alt && (
                      <span className="text-xs text-slate-400">(instead of {c.app})</span>
                    )}
                    <span
                      className={`ml-auto rounded-md border px-2 py-0.5 text-xs ${SETUP_META[c.effort].className}`}
                    >
                      {SETUP_META[c.effort].label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{c.why}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    For: {Array.from(c.countries).join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
