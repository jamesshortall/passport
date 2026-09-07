"use client";

import { useState } from "react";
import { FAQS, type Faq } from "@/lib/supportContent";

export default function FaqAccordion({ faqs = FAQS }: { faqs?: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-slate-100">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-medium text-brand-navy">{f.q}</span>
              <span
                className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden
              >
                ⌄
              </span>
            </button>
            {isOpen && (
              <p className="pb-5 pr-6 text-sm leading-relaxed text-slate-600">{f.a}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
