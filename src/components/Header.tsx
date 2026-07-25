import Link from "next/link";
import { SITE } from "@/lib/constants";
import { getSessionUser } from "@/lib/auth";
import SignOutButton from "./SignOutButton";

export default async function Header() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/" className="flex items-center" aria-label="AppPassport home">
          {/* Plain img so the SVG logo renders crisply without next/image config */}
          <img
            src="/brand/apppassport-logo.svg"
            alt="AppPassport by The Travel Technician"
            className="h-10 w-auto sm:h-11"
          />
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-4">
          <Link href="/" className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-brand-navy">
            Home
          </Link>
          <Link href="/apps" className="hidden rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-brand-navy sm:inline">
            Apps
          </Link>
          <Link href="/plan" className="hidden rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-brand-navy sm:inline">
            Trip Planner
          </Link>
          <Link href="/updates" className="hidden rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-brand-navy sm:inline">
            Updates
          </Link>
          {user && (
            <Link href="/support" className="hidden rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-brand-navy sm:inline">
              Support
            </Link>
          )}
          <a
            href={SITE.brand.main}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full border border-brand-teal/40 bg-brand-teal/10 px-3 py-1 text-xs font-semibold text-brand-tealdark hover:bg-brand-teal/20 md:inline"
          >
            The Travel Technician ↗
          </a>

          {/* Auth controls */}
          <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:inline-block" aria-hidden />
          {user ? (
            <span className="flex items-center gap-1.5">
              <Link
                href="/account"
                className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-brand-navy"
              >
                Account
              </Link>
              <SignOutButton />
            </span>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-brand-navy px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-navylight"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
