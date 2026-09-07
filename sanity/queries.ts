import { sanityFetch } from "./client";
import type { Faq, ChangelogEntry } from "@/lib/supportContent";

/** Legal/content page Markdown body by slug, or null if not in Sanity. */
export async function getLegalPageFromSanity(slug: string): Promise<string | null> {
  return sanityFetch<string | null>(
    `*[_type == "legalPage" && slug == $slug][0].body`,
    null,
    { slug }
  );
}

/** FAQs from Sanity, or the provided fallback array. */
export async function getFaqsFromSanity(fallback: Faq[]): Promise<Faq[]> {
  return sanityFetch<Faq[]>(
    `*[_type == "faq"] | order(order asc){ "q": question, "a": answer }`,
    fallback
  );
}

/** Changelog entries from Sanity, or the provided fallback array. */
export async function getChangelogFromSanity(
  fallback: ChangelogEntry[]
): Promise<ChangelogEntry[]> {
  return sanityFetch<ChangelogEntry[]>(
    `*[_type == "changelogEntry"] | order(date desc){
      "date": date, tag, title, items
    }`,
    fallback
  );
}
