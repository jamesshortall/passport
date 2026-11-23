import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders legal/markdown content with a clean, readable prose style. */
export default function MarkdownPage({ markdown }: { markdown: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <article className="prose-legal">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: (p) => <h1 className="text-3xl font-extrabold text-brand-navy" {...p} />,
            h2: (p) => <h2 className="mt-8 text-xl font-bold text-brand-navy" {...p} />,
            h3: (p) => <h3 className="mt-6 text-lg font-semibold text-slate-800" {...p} />,
            p: (p) => <p className="mt-3 leading-relaxed text-slate-700" {...p} />,
            ul: (p) => <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700" {...p} />,
            ol: (p) => <ol className="mt-3 list-decimal space-y-1 pl-6 text-slate-700" {...p} />,
            li: (p) => <li className="leading-relaxed" {...p} />,
            a: (p) => <a className="text-brand-navy underline hover:text-brand-accentdark" {...p} />,
            blockquote: (p) => (
              <blockquote
                className="mt-4 rounded-r-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-2 text-amber-900"
                {...p}
              />
            ),
            em: (p) => <em className="text-slate-500" {...p} />,
            strong: (p) => <strong className="font-semibold text-slate-900" {...p} />,
          }}
        >
          {markdown}
        </ReactMarkdown>
      </article>
    </div>
  );
}
