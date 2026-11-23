import type { Severity, SetupEffort, AppWorks } from "./types";

export const SITE = {
  name: "AppPassport",
  tagline: "Which apps actually work where you're going.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://passport.traveltechnician.info",
  supportEmail: "support@traveltechnician.info",
  brand: {
    main: "https://www.traveltechnician.info",
    blog: "https://blog.traveltechnician.info",
    cardmaster: "https://cardmaster.traveltechnician.info",
  },
};

export const SEVERITY_META: Record<
  Severity,
  { label: string; dot: string; className: string }
> = {
  blocked: {
    label: "Blocked",
    dot: "🔴",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  unreliable: {
    label: "Unreliable",
    dot: "🟠",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  works_with_caveats: {
    label: "Local app preferred",
    dot: "🟡",
    className: "bg-yellow-50 text-yellow-800 border-yellow-200",
  },
  works_fine: {
    label: "Works fine",
    dot: "🟢",
    className: "bg-green-50 text-green-700 border-green-200",
  },
};

export const WORKS_META: Record<AppWorks, { icon: string; label: string }> = {
  yes: { icon: "✅", label: "Works" },
  no: { icon: "❌", label: "Doesn't work" },
  partial: { icon: "⚠️", label: "Partial" },
};

export const SETUP_META: Record<
  SetupEffort,
  { label: string; className: string }
> = {
  none: {
    label: "No setup needed",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  before_you_land: {
    label: "Set up before you land",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  hard_needs_local_id: {
    label: "Hard — needs local ID",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};
