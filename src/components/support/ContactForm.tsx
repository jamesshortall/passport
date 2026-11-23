"use client";

import { useState } from "react";
import { CONTACT_CATEGORIES } from "@/lib/supportContent";
import { SITE } from "@/lib/constants";
import { submitSupport } from "./submitSupport";

export default function ContactForm() {
  const [category, setCategory] = useState(CONTACT_CATEGORIES[0]);
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    const res = await submitSupport({
      kind: "contact",
      subject: `${category}: ${subject}`,
      body: message,
      fromEmail: email || undefined,
      meta: { Category: category },
    });
    setBusy(false);
    setNote(res.message);
    if (res.via === "email") {
      setSubject("");
      setMessage("");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center gap-2 rounded-lg bg-brand-teal/10 px-4 py-2.5 text-sm text-slate-600">
        <span aria-hidden>✉️</span>
        Messages go to{" "}
        <span className="font-semibold text-brand-navy">{SITE.supportEmail}</span>
      </div>

      <Field label="Category">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-brand-navy focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
        >
          {CONTACT_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>

      <Field label="Your email" hint="So we can reply. Optional, but recommended.">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
        />
      </Field>

      <Field label="Subject">
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief summary"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
        />
      </Field>

      <Field label="Message">
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what's going on…"
          rows={6}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
        />
      </Field>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navylight disabled:opacity-50"
        >
          <span aria-hidden>➤</span> {busy ? "Sending…" : "Send Message"}
        </button>
        {note && <span className="text-sm text-slate-500">{note}</span>}
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-brand-navy">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}
