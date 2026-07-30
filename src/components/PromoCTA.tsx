import Image from "next/image";

type PromoCTAProps = {
  href: string;
  logoSrc: string;
  logoAlt: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
};

/**
 * Generic sidebar cross-promotion card for The Travel Technician properties
 * (main site, blog). Styled in the brand teal so it reads as part of the
 * Travel Technician family while staying distinct from the gold Cardmaster card.
 */
export default function PromoCTA({
  href,
  logoSrc,
  logoAlt,
  eyebrow,
  title,
  description,
  cta,
}: PromoCTAProps) {
  return (
    <aside className="overflow-hidden rounded-2xl border border-brand-teal/30 bg-white shadow-sm">
      <div className="flex items-center justify-center border-b border-brand-teal/15 bg-brand-teal/5 px-5 py-5">
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={320}
          height={200}
          className="h-16 w-auto object-contain"
        />
      </div>
      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-tealdark">
          {eyebrow}
        </p>
        <h3 className="mt-1 font-bold text-brand-navy">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-teal px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-tealdark"
        >
          {cta} →
        </a>
      </div>
    </aside>
  );
}
