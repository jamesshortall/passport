import {
  Wallet,
  MessageCircle,
  Map,
  Car,
  Wifi,
  AtSign,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import type { CategoryWithApps } from "@/lib/types";
import AppEntryCard from "./AppEntryCard";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Payments: Wallet,
  Messaging: MessageCircle,
  "Maps & Navigation": Map,
  "Ride-hailing": Car,
  "Internet Access": Wifi,
  "Social Media Access": AtSign,
};

export default function CategorySection({ category }: { category: CategoryWithApps }) {
  const Icon = CATEGORY_ICONS[category.name] ?? LayoutGrid;
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2.5 text-lg font-bold text-brand-navy">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-teal/10 text-brand-tealdark">
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </span>
        {category.name}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
          {category.apps.length}
        </span>
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {category.apps.map((app) => (
          <AppEntryCard key={app.id} app={app} />
        ))}
      </div>
    </section>
  );
}
