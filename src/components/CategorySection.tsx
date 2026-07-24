import type { CategoryWithApps } from "@/lib/types";
import AppEntryCard from "./AppEntryCard";

export default function CategorySection({ category }: { category: CategoryWithApps }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-navy">
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
