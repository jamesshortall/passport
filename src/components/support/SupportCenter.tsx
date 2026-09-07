"use client";

import { useState } from "react";
import ContactForm from "./ContactForm";
import FeedbackForm from "./FeedbackForm";
import FaqAccordion from "./FaqAccordion";
import WhatsNew from "./WhatsNew";
import ResourcesPanel from "./ResourcesPanel";
import type { Faq, ChangelogEntry } from "@/lib/supportContent";

const TABS = [
  { key: "contact", label: "Contact", icon: "✉️" },
  { key: "feedback", label: "Feedback", icon: "💬" },
  { key: "faq", label: "FAQ", icon: "❓" },
  { key: "whats-new", label: "What's New", icon: "🕑" },
  { key: "resources", label: "Resources", icon: "📖" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SupportCenter({
  faqs,
  changelog,
}: {
  faqs?: Faq[];
  changelog?: ChangelogEntry[];
}) {
  const [tab, setTab] = useState<TabKey>("contact");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal/10 text-2xl" aria-hidden>
          🛟
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-navy">
            Support Center
          </h1>
          <p className="text-slate-500">Get help, share ideas, and find answers — all in one place.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-white text-brand-navy shadow-sm"
                : "text-slate-500 hover:text-brand-navy"
            }`}
          >
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {tab === "contact" && <ContactForm />}
        {tab === "feedback" && <FeedbackForm />}
        {tab === "faq" && <FaqAccordion faqs={faqs} />}
        {tab === "whats-new" && <WhatsNew entries={changelog} />}
        {tab === "resources" && <ResourcesPanel />}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        AppPassport · part of The Travel Technician
      </p>
    </div>
  );
}
