"use client";

import { useState } from "react";
import { FEEDBACK_TYPES, FEEDBACK_PRIORITIES } from "@/lib/supportContent";
import { submitSupport } from "./submitSupport";

export default function FeedbackForm() {
  const [type, setType] = useState(FEEDBACK_TYPES[0].value);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(FEEDBACK_PRIORITIES[1]);
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const active = FEEDBACK_TYPES.find((t) => t.value === type);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    const res = await submitSupport({
      kind: "feedback",
      subject: `${type}: ${title}`,
      body: details,
      fromEmail: email || undefined,
      meta: { Type: type, Priority: priority },
    });
    setBusy(false);
    setNote(res.message);
    if (res.via === "email") {
      setTitle("");
      setDetails("");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center gap-2 rounded-lg bg-brand-navy/5 px-4 py-2.5 text-sm text-slate-600">
        <span aria-hidden>💡</span>
        Ideas, feedback, bugs, questions — it all lands in one place. Every note is read.
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-brand-navy">What kind of feedback?</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-brand-navy focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
        >
          {FEEDBACK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.emoji} {t.value}
            </option>
          ))}
        </select>
        {active && <span className="mt-1 block text-xs text-slate-400">{active.hint}</span>}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-brand-navy">Title</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='e.g. "Add Vietnam"'
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-brand-navy">Priority</span>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-brand-navy focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
        >
          {FEEDBACK_PRIORITIES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-brand-navy">Details</span>
        <textarea
          required
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Describe it in as much detail as you can…"
          rows={6}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-brand-navy">Your email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com (optional)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navylight disabled:opacity-50"
        >
          <span aria-hidden>➤</span> {busy ? "Sending…" : "Submit"}
        </button>
        {note && <span className="text-sm text-slate-500">{note}</span>}
      </div>
    </form>
  );
}
