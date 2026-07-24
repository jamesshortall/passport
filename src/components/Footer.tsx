import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <Image
              src="/brand/tt-logo.png"
              alt="The Travel Technician"
              width={220}
              height={64}
              className="h-12 w-auto object-contain"
            />
            <p className="mt-3 text-slate-500">
              <span className="font-semibold text-brand-navy">AppPassport</span> — {SITE.tagline}
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Part of{" "}
              <a
                href={SITE.brand.main}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-brand-navy"
              >
                The Travel Technician
              </a>
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-700">The Travel Technician</h3>
            <ul className="mt-2 space-y-1 text-slate-500">
              <li>
                <a href={SITE.brand.main} target="_blank" rel="noopener noreferrer" className="hover:text-brand-navy">
                  Main site
                </a>
              </li>
              <li>
                <a href={SITE.brand.blog} target="_blank" rel="noopener noreferrer" className="hover:text-brand-navy">
                  Blog
                </a>
              </li>
              <li>
                <a href={SITE.brand.cardmaster} target="_blank" rel="noopener noreferrer" className="hover:text-brand-navy">
                  Also check out Cardmaster →
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-700">Legal</h3>
            <ul className="mt-2 space-y-1 text-slate-500">
              <li><Link href="/privacy" className="hover:text-brand-navy">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand-navy">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-brand-navy">Cookie Policy</Link></li>
              <li><Link href="/disclaimer" className="hover:text-brand-navy">Content Accuracy Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-4 text-xs text-slate-400">
          © {new Date().getFullYear()} The Travel Technician. App-availability
          info changes fast — always double-check before you travel. See our{" "}
          <Link href="/disclaimer" className="underline hover:text-brand-navy">
            Content Accuracy Disclaimer
          </Link>
          .
        </div>
      </div>
    </footer>
  );
}
