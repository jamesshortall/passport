import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About",
  description:
    "What AppPassport is, how it helps US travelers know which apps work abroad, and how it fits into The Travel Technician family.",
};

const FEATURES = [
  {
    icon: "🧭",
    title: "Country-by-country breakdowns",
    body: "For each country, see whether Apple Pay, Google Maps, WhatsApp, Uber and more actually work (✅/⚠️/❌), the local alternative to use, the setup effort, and a plain-English why.",
  },
  {
    icon: "🗺️",
    title: "Trip Planner",
    body: "Heading to more than one country? Combine them into a single, deduplicated “download before you fly” checklist you can copy or print.",
  },
  {
    icon: "🕑",
    title: "Freshness built in",
    body: "Every entry carries a “last verified” date and a change feed, plus a “still accurate? 👍👎” button — because app availability abroad changes fast.",
  },
  {
    icon: "📶",
    title: "Works offline",
    body: "Install it as an app. Countries you've viewed are cached on your device, so they're readable on a plane or on bad hotel wifi.",
  },
  {
    icon: "🛂",
    title: "Human-reviewed",
    body: "New country guides can be drafted with live AI research, but nothing goes public until a person reviews and publishes it.",
  },
  {
    icon: "🔒",
    title: "Privacy-minded",
    body: "We keep data minimal — no selling your information. Browse freely without an account; sign in only to save countries and get alerts.",
  },
];

const CATEGORIES = [
  "Payments",
  "Messaging",
  "Maps & Navigation",
  "Ride-hailing",
  "Internet Access",
  "Social Media Access",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-brand-navylight to-brand-tealdark px-6 py-10 sm:px-10 sm:py-12">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 opacity-10"
          style={{
            backgroundImage: "url(/brand/emblem-mark.png)",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="relative max-w-2xl">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-brand-teallight">
            About
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            The pre-trip checklist for your phone
          </h1>
          <p className="mt-3 text-base text-slate-200 sm:text-lg">
            AppPassport tells US travelers which of their everyday apps will
            actually work in a given country — and which local app to download
            instead — before they fly.
          </p>
        </div>
      </section>

      {/* What it is */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-brand-navy">What is AppPassport?</h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          Apple Pay, Google Maps, WhatsApp and Uber don't behave the same
          everywhere. Some are blocked, some are unreliable, and some are simply
          the wrong choice once you land. AppPassport breaks it down country by
          country across the categories that matter most for travelers, showing
          what works, what doesn't, and exactly what to set up before you go.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <span
              key={c}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600"
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-brand-navy">What makes it more than a list</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-2xl" aria-hidden>{f.icon}</span>
              <h3 className="mt-2 font-semibold text-brand-navy">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Travel Technician */}
      <section className="mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 bg-brand-paper px-6 py-6 sm:px-8">
          <Image
            src="/brand/tt-logo.png"
            alt="The Travel Technician"
            width={280}
            height={80}
            className="h-16 w-auto object-contain"
          />
        </div>
        <div className="px-6 py-6 sm:px-8">
          <h2 className="text-xl font-bold text-brand-navy">Part of The Travel Technician</h2>
          <p className="mt-3 leading-relaxed text-slate-700">
            AppPassport is one piece of{" "}
            <a
              href={SITE.brand.main}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-teal underline hover:text-brand-tealdark"
            >
              The Travel Technician
            </a>{" "}
            — a brand built on a simple idea: travel is better when the
            technical, logistical details are handled for you. Where most travel
            content stops at “where to go,” The Travel Technician focuses on the
            practical mechanics of actually getting there and getting around
            smarter — points and miles, the right cards, the right apps, and the
            small setup steps that save you money and headaches on the road.
          </p>
          <p className="mt-3 leading-relaxed text-slate-700">
            The family includes the{" "}
            <a href={SITE.brand.blog} target="_blank" rel="noopener noreferrer" className="text-brand-teal underline hover:text-brand-tealdark">
              Travel Technician blog
            </a>{" "}
            (destination guides and smarter-travel deep dives),{" "}
            <a href={SITE.brand.cardmaster} target="_blank" rel="noopener noreferrer" className="text-brand-teal underline hover:text-brand-tealdark">
              Cardmaster
            </a>{" "}
            (get the most out of your travel rewards cards), and{" "}
            <span className="font-semibold text-brand-navy">AppPassport</span>{" "}
            (which apps to use where). Same team, same goal:{" "}
            <span className="italic">smarter travel, better rewards.</span>
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={SITE.brand.main}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-brand-navy px-5 py-2 text-sm font-semibold text-white hover:bg-brand-navylight"
            >
              Visit The Travel Technician ↗
            </a>
            <a
              href={SITE.brand.blog}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-brand-navy hover:bg-slate-50"
            >
              Read the blog ↗
            </a>
          </div>
        </div>
      </section>

      {/* Closing note + CTA */}
      <section className="mt-10 rounded-2xl border-l-4 border-brand-teal bg-brand-teal/5 p-5">
        <p className="text-sm leading-relaxed text-slate-700">
          One honest caveat: app availability abroad changes quickly, so
          AppPassport is a well-researched <strong>starting point</strong>, not
          your only source. Always double-check official and local sources
          before you rely on any app while traveling — see our{" "}
          <Link href="/disclaimer" className="font-medium text-brand-teal underline hover:text-brand-tealdark">
            Content Accuracy Disclaimer
          </Link>
          .
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="rounded-full bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navylight">
          Browse countries
        </Link>
        <Link href="/plan" className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-brand-navy hover:bg-slate-50">
          Plan a trip
        </Link>
      </div>
    </div>
  );
}
