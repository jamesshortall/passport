import Image from "next/image";
import { SITE } from "@/lib/constants";

/**
 * Cross-promotion card for Jim's other app, Cardmaster. Deliberately styled
 * distinctly (gold accent, real logo) so it never reads as part of the guide.
 * Copy is placeholder — Jim will supply the real pitch + app store link.
 */
export default function CardmasterCTA() {
  return (
    <aside className="overflow-hidden rounded-2xl border border-brand-gold/40 bg-gradient-to-b from-brand-gold/10 to-white shadow-sm">
      <div className="border-b border-brand-gold/20 bg-brand-navy px-5 py-4">
        <Image
          src="/brand/cardmaster.png"
          alt="Cardmaster — powered by The Travel Technician"
          width={320}
          height={200}
          className="mx-auto h-28 w-auto object-contain"
        />
      </div>
      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-golddark">
          From The Travel Technician
        </p>
        <h3 className="mt-1 font-bold text-brand-navy">Also check out Cardmaster</h3>
        <p className="mt-1 text-sm text-slate-600">
          Get the most out of your travel rewards cards — know which card to use
          where, so you never leave points on the table abroad.
        </p>
        <a
          href={SITE.brand.cardmaster}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-gold px-4 py-1.5 text-sm font-semibold text-brand-navy hover:bg-brand-golddark hover:text-white"
        >
          Learn more →
        </a>
      </div>
    </aside>
  );
}
