"use client";

import { useState } from "react";
import type { CountryApp } from "@/lib/types";
import { WORKS_META } from "@/lib/constants";
import SeverityTag from "./SeverityTag";
import SetupEffortBadge from "./SetupEffortBadge";
import ReportAccuracy from "./ReportAccuracy";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function AppEntryCard({ app }: { app: CountryApp }) {
  const [open, setOpen] = useState(false);
  const works = WORKS_META[app.us_app_works];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden title={works.label}>
              {works.icon}
            </span>
            <h3 className="truncate font-semibold text-slate-900">
              {app.us_app_name}
            </h3>
          </div>
          {app.local_alternative_name ? (
            <p className="mt-0.5 text-sm text-slate-500">
              Use instead:{" "}
              <span className="font-medium text-brand-navy">
                {app.local_alternative_name}
              </span>
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-slate-400">No direct substitute</p>
          )}
        </div>
        <SeverityTag severity={app.severity} />
      </div>

      <p className="mt-2 text-sm text-slate-700">{app.why_short}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SetupEffortBadge effort={app.setup_effort} />
        {app.app_store_link && (
          <a
            href={app.app_store_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-brand-navy underline hover:text-brand-accentdark"
          >
            Get the app →
          </a>
        )}
        {app.detail_paragraph && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="ml-auto text-xs font-medium text-slate-500 hover:text-brand-navy"
            aria-expanded={open}
          >
            {open ? "Show less ▲" : "Learn more ▼"}
          </button>
        )}
      </div>

      {open && app.detail_paragraph && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
          {app.detail_paragraph}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
        <span className="text-[11px] text-slate-400">
          Last verified: {formatDate(app.last_verified_at)}
        </span>
        <ReportAccuracy countryAppId={app.id} />
      </div>
    </div>
  );
}
