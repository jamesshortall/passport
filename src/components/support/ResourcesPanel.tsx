import Link from "next/link";
import { SITE } from "@/lib/constants";

function ResourceCard({
  icon,
  title,
  body,
  href,
  cta,
  external,
}: {
  icon: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  external?: boolean;
}) {
  const linkProps = external
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : { href };
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-teal/10 text-xl" aria-hidden>
        {icon}
      </span>
      <h3 className="mt-3 font-semibold text-brand-navy">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-600">{body}</p>
      {external ? (
        <a {...(linkProps as any)} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-teal hover:text-brand-tealdark">
          {cta} <span aria-hidden>↗</span>
        </a>
      ) : (
        <Link href={href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-teal hover:text-brand-tealdark">
          {cta} <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}

export default function ResourcesPanel() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ResourceCard
        icon="📰"
        title="The Travel Technician Blog"
        body="Deep dives on which apps to use where, destination guides, and smarter-travel tips from the team."
        href={SITE.brand.blog}
        cta="Visit blog"
        external
      />
      <ResourceCard
        icon="🛡️"
        title="Privacy & Data Notice"
        body="A quick, plain-English look at what AppPassport stores, what we don't, and what admins can see."
        href="/privacy"
        cta="Read privacy notice"
      />
      <ResourceCard
        icon="💳"
        title="Cardmaster"
        body="Our companion app for getting the most out of your travel rewards cards — know which card to use where."
        href={SITE.brand.cardmaster}
        cta="Check out Cardmaster"
        external
      />
      <ResourceCard
        icon="✉️"
        title="Direct Email"
        body="Prefer to skip the form? Reach us directly and we'll respond as soon as we can."
        href={`mailto:${SITE.supportEmail}`}
        cta={SITE.supportEmail}
        external
      />
    </div>
  );
}
