import { CHANGELOG } from "@/lib/supportContent";

const TAG_STYLES: Record<string, string> = {
  New: "bg-brand-teal/10 text-brand-tealdark border-brand-teal/30",
  Improved: "bg-blue-50 text-blue-700 border-blue-200",
  Fixed: "bg-green-50 text-green-700 border-green-200",
  Launch: "bg-brand-gold/15 text-brand-golddark border-brand-gold/40",
};

function fmt(iso: string) {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function WhatsNew() {
  return (
    <div className="relative space-y-6 pl-6">
      {/* timeline line */}
      <span className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-slate-200" aria-hidden />
      {CHANGELOG.map((entry, i) => (
        <div key={i} className="relative">
          <span className="absolute -left-[18px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-teal ring-4 ring-white" aria-hidden />
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${TAG_STYLES[entry.tag] ?? ""}`}>
              {entry.tag}
            </span>
            <h3 className="font-semibold text-brand-navy">{entry.title}</h3>
            <time className="text-xs text-slate-400">{fmt(entry.date)}</time>
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {entry.items.map((it, j) => (
              <li key={j}>{it}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
