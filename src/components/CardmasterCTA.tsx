import { SITE } from "@/lib/constants";

/**
 * Cross-promotion card for Jim's other app, Cardmaster. Deliberately styled
 * distinctly from the country data so it never reads as part of the guide.
 * Copy is placeholder — Jim will supply the real pitch + app store link.
 */
export default function CardmasterCTA() {
  return (
    <aside className="rounded-2xl border-2 border-dashed border-brand-accent/60 bg-gradient-to-br from-brand-accent/10 to-white p-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>
          💳
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-accentdark">
            From The Travel Technician
          </p>
          <h3 className="mt-1 font-bold text-brand-navy">Also check out Cardmaster</h3>
          <p className="mt-1 text-sm text-slate-600">
            Get the most out of your travel rewards cards — know which card to
            use where, so you never leave points on the table abroad.
          </p>
          <a
            href={SITE.brand.cardmaster}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-full bg-brand-navy px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-navylight"
          >
            Learn more →
          </a>
        </div>
      </div>
    </aside>
  );
}
