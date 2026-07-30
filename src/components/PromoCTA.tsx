import Image from "next/image";

type Accent = "teal" | "navy";

type PromoCTAProps = {
  href: string;
  logoSrc: string;
  logoAlt: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  accent: Accent;
};

// Bold, saturated color schemes so the Travel Technician cards stand out in the
// sidebar (and read as a distinct family from the gold Cardmaster card). Each
// card is a full-color panel with a white logo chip and a high-contrast button.
const ACCENTS: Record<
  Accent,
  {
    card: string;
    eyebrow: string;
    title: string;
    desc: string;
    button: string;
  }
> = {
  teal: {
    card: "bg-gradient-to-br from-brand-teal to-brand-tealdark",
    eyebrow: "text-white/75",
    title: "text-white",
    desc: "text-white/90",
    button: "bg-white text-brand-tealdark hover:bg-brand-navy hover:text-white",
  },
  navy: {
    card: "bg-gradient-to-br from-brand-navy to-brand-navylight",
    eyebrow: "text-brand-teallight",
    title: "text-white",
    desc: "text-white/85",
    button:
      "bg-brand-teal text-white hover:bg-brand-teallight hover:text-brand-navy",
  },
};

/**
 * Colorful sidebar cross-promotion card for The Travel Technician properties
 * (main site, blog). Distinct accent per property so the family stands out.
 */
export default function PromoCTA({
  href,
  logoSrc,
  logoAlt,
  eyebrow,
  title,
  description,
  cta,
  accent,
}: PromoCTAProps) {
  const c = ACCENTS[accent];
  return (
    <aside className={`overflow-hidden rounded-2xl shadow-md ${c.card}`}>
      <div className="flex items-center justify-center px-5 pt-5">
        <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={320}
            height={200}
            className="h-14 w-auto object-contain"
          />
        </div>
      </div>
      <div className="p-5">
        <p className={`text-[11px] font-semibold uppercase tracking-wide ${c.eyebrow}`}>
          {eyebrow}
        </p>
        <h3 className={`mt-1 font-bold ${c.title}`}>{title}</h3>
        <p className={`mt-1 text-sm ${c.desc}`}>{description}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-3 inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-semibold shadow-sm transition ${c.button}`}
        >
          {cta} →
        </a>
      </div>
    </aside>
  );
}
