import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/constants";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2" aria-label="AppPassport home">
          <Image
            src="/brand/emblem.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 object-contain"
            priority
          />
          <span className="flex flex-col leading-none">
            <span className="text-base font-extrabold tracking-tight text-brand-navy">
              App<span className="text-brand-teal">Passport</span>
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:block">
              by The Travel Technician
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-4">
          <Link href="/apps" className="hidden rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-brand-navy sm:inline">
            Apps
          </Link>
          <Link href="/plan" className="hidden rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-brand-navy sm:inline">
            Trip Planner
          </Link>
          <Link href="/updates" className="hidden rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-brand-navy sm:inline">
            Updates
          </Link>
          <a
            href={SITE.brand.main}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-brand-teal/40 bg-brand-teal/10 px-3 py-1 text-xs font-semibold text-brand-tealdark hover:bg-brand-teal/20"
          >
            The Travel Technician ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
