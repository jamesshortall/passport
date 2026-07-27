import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminButton from "@/components/admin/AdminButton";
import GenerateDraftForm from "@/components/admin/GenerateDraftForm";
import HeroImageInput from "@/components/admin/HeroImageInput";
import { reviewProfile, setCountryStatus, resolveReport, backfillHeroImages, cacheHeroImages, deleteCountry } from "./actions";
import type { Country, Profile, ReportRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const STALE_DAYS = 90;

export default async function AdminPage() {
  const admin = await requireAdmin();

  if (!admin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-brand-navy">Admin access required</h1>
        <p className="mt-2 text-slate-500">
          You need an approved admin account to view this page.
        </p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-brand-navy px-5 py-2 text-sm text-white">
          Sign in
        </Link>
      </div>
    );
  }

  const supabase = createSupabaseServerClient();
  const staleCutoff = new Date(Date.now() - STALE_DAYS * 86400000).toISOString();

  const [
    { data: pending },
    { data: countries },
    { data: reports },
    { data: staleApps },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("approval_status", "pending").order("requested_at"),
    supabase.from("countries").select("*").order("name"),
    supabase.from("reports").select("*").eq("status", "open").order("created_at", { ascending: false }),
    supabase
      .from("country_apps")
      .select("id, us_app_name, country_id, last_verified_at")
      .lt("last_verified_at", staleCutoff)
      .order("last_verified_at")
      .limit(50),
  ]);

  const pendingProfiles = (pending as Profile[]) ?? [];
  const allCountries = (countries as Country[]) ?? [];
  const openReports = (reports as ReportRow[]) ?? [];
  const stale = (staleApps as { id: string; us_app_name: string; last_verified_at: string }[]) ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-brand-navy">Admin</h1>
        <span className="text-sm text-slate-500">{admin.email}</span>
      </div>

      {/* --- AI drafting ------------------------------------------------- */}
      <section className="mt-8 rounded-2xl border-2 border-dashed border-brand-accent/50 bg-brand-accent/5 p-5">
        <h2 className="font-bold text-brand-navy">Generate Draft for New Country</h2>
        <p className="mt-1 text-sm text-slate-600">
          Researches a country with OpenAI + web search and inserts it as a{" "}
          <strong>draft</strong>. Nothing is auto-published — review it below first.
        </p>
        <div className="mt-3">
          <GenerateDraftForm />
        </div>
        <div className="mt-4 border-t border-brand-accent/20 pt-3">
          <p className="mb-2 text-sm text-slate-600">
            Missing country photos? Fetch a hero image for every country that
            doesn't have one (uses Unsplash).
          </p>
          <div className="flex flex-wrap gap-2">
            <AdminButton
              action={backfillHeroImages}
              label="🖼️ Backfill hero images"
              className="border border-brand-teal/40 bg-brand-teal/10 text-brand-tealdark hover:bg-brand-teal/20"
            />
            <AdminButton
              action={cacheHeroImages}
              label="⚡ Cache photos to storage (faster)"
              className="border border-brand-navy/30 bg-brand-navy/5 text-brand-navy hover:bg-brand-navy/10"
              confirm="Download each country's photo into Supabase Storage and repoint to the fast CDN?"
            />
          </div>
        </div>
      </section>

      {/* --- Draft countries pending review ----------------------------- */}
      {(() => {
        const drafts = allCountries.filter((c) => c.status === "draft");
        return (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-brand-navy">
              Draft Countries — pending review{" "}
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                {drafts.length}
              </span>
            </h2>
            {drafts.length === 0 ? (
              <p className="text-sm text-slate-400">No drafts awaiting review.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-amber-200 bg-amber-50/40">
                {drafts.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="flex items-center gap-2">
                      <span aria-hidden>{c.flag_emoji}</span>
                      <span className="text-sm font-medium text-slate-800">{c.name}</span>
                      {c.region && <span className="text-xs text-slate-400">{c.region}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/country/${c.slug}`}
                        target="_blank"
                        className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-brand-navy hover:bg-slate-50"
                      >
                        Preview ↗
                      </Link>
                      <AdminButton
                        action={setCountryStatus.bind(null, c.id, "published")}
                        label="Publish"
                        className="bg-brand-navy text-white hover:bg-brand-navylight"
                        confirm="Publish this country? It will go live immediately."
                      />
                      <AdminButton
                        action={deleteCountry.bind(null, c.id)}
                        label="Delete"
                        className="border border-red-300 text-red-600 hover:bg-red-50"
                        confirm={`Permanently delete ${c.name} and ALL its data? This cannot be undone.`}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })()}

      {/* --- Pending approvals ------------------------------------------ */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-brand-navy">
          Pending Approvals{" "}
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
            {pendingProfiles.length}
          </span>
        </h2>
        {pendingProfiles.length === 0 ? (
          <p className="text-sm text-slate-400">No accounts awaiting approval.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {pendingProfiles.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{p.email}</p>
                  <p className="text-xs text-slate-400">
                    Requested {new Date(p.requested_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <AdminButton
                    action={reviewProfile.bind(null, p.id, "approved")}
                    label="Approve"
                    className="bg-green-600 text-white hover:bg-green-700"
                  />
                  <AdminButton
                    action={reviewProfile.bind(null, p.id, "rejected")}
                    label="Reject"
                    className="border border-slate-300 text-slate-600 hover:bg-slate-50"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- Countries -------------------------------------------------- */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-brand-navy">Countries</h2>
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {allCountries.map((c) => (
            <li key={c.id} className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span aria-hidden>{c.flag_emoji}</span>
                  <span className="text-sm font-medium text-slate-800">{c.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      c.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/country/${c.slug}`}
                    target="_blank"
                    className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-brand-navy hover:bg-slate-50"
                  >
                    {c.status === "published" ? "View ↗" : "Preview ↗"}
                  </Link>
                  {c.status === "published" ? (
                    <AdminButton
                      action={setCountryStatus.bind(null, c.id, "draft")}
                      label="Unpublish"
                      className="border border-slate-300 text-slate-600 hover:bg-slate-50"
                    />
                  ) : (
                    <AdminButton
                      action={setCountryStatus.bind(null, c.id, "published")}
                      label="Publish"
                      className="bg-brand-navy text-white hover:bg-brand-navylight"
                      confirm="Publish this country? It will go live immediately."
                    />
                  )}
                  <AdminButton
                    action={deleteCountry.bind(null, c.id)}
                    label="Delete"
                    className="border border-red-300 text-red-600 hover:bg-red-50"
                    confirm={`Permanently delete ${c.name} and ALL its data (app entries, hero image, favorites)? This cannot be undone.`}
                  />
                </div>
              </div>
              <HeroImageInput countryId={c.id} initial={c.hero_image_url} />
            </li>
          ))}
        </ul>
      </section>

      {/* --- Reports queue ---------------------------------------------- */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-brand-navy">
          "Report Outdated" Queue{" "}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {openReports.length}
          </span>
        </h2>
        {openReports.length === 0 ? (
          <p className="text-sm text-slate-400">No open reports.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {openReports.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 p-3">
                <div>
                  <p className="text-sm text-slate-700">{r.note || "(no note)"}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(r.created_at).toLocaleString()} ·{" "}
                    {r.user_id ? "account" : "anonymous"} · entry {r.country_apps_id?.slice(0, 8)}
                  </p>
                </div>
                <AdminButton
                  action={resolveReport.bind(null, r.id)}
                  label="Mark reviewed"
                  className="border border-slate-300 text-slate-600 hover:bg-slate-50"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- Needs review (stale 90+ days) ------------------------------ */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-brand-navy">
          Needs Review{" "}
          <span className="text-sm font-normal text-slate-400">
            (not verified in {STALE_DAYS}+ days)
          </span>
        </h2>
        {stale.length === 0 ? (
          <p className="text-sm text-slate-400">Everything's been verified recently. 🎉</p>
        ) : (
          <ul className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
            {stale.map((s) => (
              <li key={s.id} className="flex justify-between py-1">
                <span>{s.us_app_name}</span>
                <span className="text-xs text-slate-400">
                  {new Date(s.last_verified_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
