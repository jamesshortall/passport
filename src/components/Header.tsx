import Link from "next/link";
import { SITE } from "@/lib/constants";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-brand-navy text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="text-xl" aria-hidden>
            🛂
          </span>
          <span className="text-lg tracking-tight">AppPassport</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/apps" className="hidden text-slate-200 hover:text-white sm:inline">
            Apps
          </Link>
          <Link href="/plan" className="hidden text-slate-200 hover:text-white sm:inline">
            Trip Planner
          </Link>
          <Link href="/updates" className="hidden text-slate-200 hover:text-white sm:inline">
            Updates
          </Link>
          {/* Persistent brand link so visitors know this is part of a larger brand */}
          <a
            href={SITE.brand.main}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-brand-accent/70 bg-brand-accent/10 px-3 py-1 text-xs font-medium text-brand-accent hover:bg-brand-accent/20"
          >
            The Travel Technician
          </a>
        </nav>
      </div>
    </header>
  );
}
